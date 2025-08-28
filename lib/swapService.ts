import { OpenAPI, QuoteRequest, OneClickService } from '@defuse-protocol/one-click-sdk-typescript'
import { supportedTokens } from './web3'
import { priceService } from './priceService'
import { tokenDiscoveryService, TokenInfo } from './tokenDiscoveryService'
import { intentParser, ParsedSwapIntent } from './intentParser'

export interface SwapQuote {
  id: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  minAmountOut?: string
  slippage: number
  gasEstimate: string
  depositAddress?: string
  depositAsset?: string
  depositChain?: string
  deadline: string
  status: 'pending' | 'executed' | 'failed'
  amountInUsd?: string
  amountOutUsd?: string
  timeEstimate?: number
}

export interface SwapRequest {
  fromToken: string
  toToken: string
  amount: string
  slippage?: number
  recipient?: string
  refundTo?: string
  walletAddress?: string
}

export class SwapService {
  private static instance: SwapService

  private constructor() {
    // Initialize the SDK
    OpenAPI.BASE = process.env.NEXT_PUBLIC_1CLICK_API_URL || 'https://1click.chaindefuser.com'
    OpenAPI.TOKEN = process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN || 'your-jwt-token'
    
    // Log token status for debugging
    if (!process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN) {
      console.warn('⚠️ JWT token not configured. Please set NEXT_PUBLIC_1CLICK_JWT_TOKEN in your .env.local file')
    }
  }

  public static getInstance(): SwapService {
    if (!SwapService.instance) {
      SwapService.instance = new SwapService()
    }
    return SwapService.instance
  }

  /**
   * Get a quote for a swap
   */
  async getQuote(request: SwapRequest): Promise<SwapQuote> {
    try {
      // Use enhanced token discovery if available
      let originAsset: string
      let destinationAsset: string
      let originChain: string
      let destinationChain: string

      if ((request as any).fromChain && (request as any).toChain) {
        // Use the new token discovery system
        console.log(`🔍 Getting asset IDs for ${request.fromToken} on ${(request as any).fromChain} and ${request.toToken} on ${(request as any).toChain}`)
        originAsset = await this.getAssetIdForTokenAndChain(request.fromToken, (request as any).fromChain)
        destinationAsset = await this.getAssetIdForTokenAndChain(request.toToken, (request as any).toChain)
        originChain = (request as any).fromChain
        destinationChain = (request as any).toChain
        console.log(`✅ Asset IDs: ${originAsset} → ${destinationAsset}`)
      } else {
        // Fall back to legacy system
        originAsset = this.getAssetId(request.fromToken)
        destinationAsset = this.getAssetId(request.toToken)
        originChain = this.getChainFromAssetId(originAsset)
        destinationChain = this.getChainFromAssetId(destinationAsset)
      }

      // Use wallet address if provided, otherwise fall back to chain-specific addresses
      const walletAddress = request.walletAddress || this.getAddressForChain(originChain)
      const recipientAddress = request.walletAddress || this.getAddressForChain(destinationChain)
      
      console.log(`👛 Wallet addresses: refundTo=${walletAddress}, recipient=${recipientAddress}`)
      console.log(`👛 Connected wallet: ${request.walletAddress || 'Not connected'}`)

      const quoteRequest: QuoteRequest = {
        dry: true, // Use dry: true for quotes to avoid generating transactions
        depositMode: 'SIMPLE' as any,
        swapType: 'EXACT_INPUT' as any,
        slippageTolerance: request.slippage || 100, // 1% default
        originAsset: originAsset,
        depositType: 'ORIGIN_CHAIN' as any,
        destinationAsset: destinationAsset,
        amount: request.amount,
        refundTo: request.refundTo || walletAddress,
        refundType: 'ORIGIN_CHAIN' as any,
        recipient: request.recipient || recipientAddress,
        recipientType: 'DESTINATION_CHAIN' as any,
        deadline: this.getDeadline()
      }

      console.log('🔍 Swap request:', {
        fromToken: request.fromToken,
        toToken: request.toToken,
        originAsset: quoteRequest.originAsset,
        destinationAsset: quoteRequest.destinationAsset,
        originChain: originChain,
        destinationChain: destinationChain,
        refundTo: quoteRequest.refundTo,
        recipient: quoteRequest.recipient,
        amount: quoteRequest.amount
      })

      console.log('📤 API Payload:', JSON.stringify(quoteRequest, null, 2))

      let quote
      try {
        quote = await OneClickService.getQuote(quoteRequest)
        console.log('📥 API Response:', JSON.stringify(quote, null, 2))
      } catch (error: any) {
        console.error('❌ API Error Details:', error)
        if (error.response) {
          console.error('❌ Error Response:', error.response.data)
          console.error('❌ Error Status:', error.response.status)
          console.error('❌ Error Headers:', error.response.headers)
        }
        throw error
      }

      const swapQuote: SwapQuote = {
        id: Date.now().toString(),
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: quote.quote?.amountInFormatted || request.amount,
        toAmount: quote.quote?.amountOutFormatted || '0',
        minAmountOut: quote.quote?.minAmountOut || undefined, // Keep in smallest unit for proper formatting later
        slippage: request.slippage || 1,
        gasEstimate: quote.quote?.timeEstimate?.toString() || '0',
        depositAddress: quote.quote?.depositAddress,
        depositAsset: request.fromToken,
        depositChain: originChain,
        deadline: quote.quote?.deadline || quoteRequest.deadline,
        status: 'pending',
        // Use API USD values
        amountInUsd: quote.quote?.amountInUsd,
        amountOutUsd: quote.quote?.amountOutUsd,
        timeEstimate: quote.quote?.timeEstimate
      }

      // Add chain information and wallet address for execution
      const extendedQuote = {
        ...swapQuote,
        fromChain: (request as any).fromChain,
        toChain: (request as any).toChain,
        walletAddress: request.walletAddress
      }

      return extendedQuote
    } catch (error) {
      console.error('Error getting quote:', error)
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute a swap
   */
  async executeSwap(quote: SwapQuote): Promise<{ status: string; depositAddress: string }> {
    try {
      console.log('🚀 Executing swap with quote:', {
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        fromChain: (quote as any).fromChain,
        toChain: (quote as any).toChain,
        walletAddress: (quote as any).walletAddress
      })

      // Get chain information from the quote
      const fromChain = (quote as any).fromChain
      const toChain = (quote as any).toChain
      
      if (!fromChain || !toChain) {
        throw new Error('Chain information missing from quote. Cannot execute swap.')
      }

      // Get dynamic asset IDs for the specific chains
      const originAsset = await this.getAssetIdForTokenAndChain(quote.fromToken, fromChain)
      const destinationAsset = await this.getAssetIdForTokenAndChain(quote.toToken, toChain)
      
      console.log(`🔍 Execution asset IDs: ${originAsset} → ${destinationAsset}`)

      // Use connected wallet address for both refund and recipient
      const walletAddress = (quote as any).walletAddress
      if (!walletAddress) {
        throw new Error('Wallet address not found. Please connect your wallet first.')
      }

      console.log(`👛 Using wallet address: ${walletAddress}`)

      // Convert amount to smallest unit using the correct token decimals
      const amountInSmallestUnit = await this.convertIntentToRequest({
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromChain: fromChain,
        toChain: toChain,
        amount: quote.fromAmount,
        slippage: quote.slippage,
        isComplete: true,
        confidence: 'high',
        missingInfo: []
      } as ParsedSwapIntent).then(request => request.amount)
      
      console.log(`🔢 Execution amount: ${quote.fromAmount} → ${amountInSmallestUnit}`)
      
      const executionRequest: QuoteRequest = {
        dry: false, // Set to false to get deposit address
        depositMode: 'SIMPLE' as any,
        swapType: 'EXACT_INPUT' as any,
        slippageTolerance: quote.slippage * 100,
        originAsset: originAsset,
        depositType: 'ORIGIN_CHAIN' as any,
        destinationAsset: destinationAsset,
        amount: amountInSmallestUnit,
        refundTo: walletAddress,
        refundType: 'ORIGIN_CHAIN' as any,
        recipient: walletAddress,
        recipientType: 'DESTINATION_CHAIN' as any,
        deadline: quote.deadline
      }

      console.log('📤 Execution API Payload:', JSON.stringify(executionRequest, null, 2))

      const executionQuote = await OneClickService.getQuote(executionRequest)
      
      console.log('📥 Execution API Response:', JSON.stringify(executionQuote, null, 2))

      return {
        status: 'deposit_ready',
        depositAddress: executionQuote.quote?.depositAddress || quote.depositAddress || ''
      }
    } catch (error) {
      console.error('Error executing swap:', error)
      throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get execution status with enhanced formatting
   */
  async getExecutionStatus(depositAddress: string): Promise<{ 
    status: string; 
    details?: any;
    formattedStatus?: string;
    progress?: string;
  }> {
    try {
      console.log(`🔍 Checking status for deposit address: ${depositAddress}`)
      const status = await OneClickService.getExecutionStatus(depositAddress)
      
      console.log('📥 Status API Response:', JSON.stringify(status, null, 2))
      
      const swapStatus = status.status || 'UNKNOWN'
      let formattedStatus = ''
      let progress = ''
      
      switch (swapStatus) {
        case 'PENDING_DEPOSIT':
          formattedStatus = '⏳ **Pending Deposit**'
          progress = 'Waiting for funds to be sent to the deposit address'
          break
        case 'PROCESSING':
          formattedStatus = '🔄 **Processing**'
          progress = 'Deposit detected! Market makers are executing your swap'
          break
        case 'SUCCESS':
          formattedStatus = '✅ **Success**'
          progress = 'Swap completed! Funds delivered to your destination address'
          break
        case 'INCOMPLETE_DEPOSIT':
          formattedStatus = '⚠️ **Incomplete Deposit**'
          progress = 'Deposit received but amount is below the required minimum'
          break
        case 'REFUNDED':
          formattedStatus = '💸 **Refunded**'
          progress = 'Swap could not be completed. Funds have been refunded to your address'
          break
        case 'FAILED':
          formattedStatus = '❌ **Failed**'
          progress = 'Swap failed due to an error. Check the details below'
          break
        default:
          formattedStatus = '❓ **Unknown Status**'
          progress = 'Unable to determine swap status'
      }
      
      return {
        status: swapStatus,
        details: status,
        formattedStatus,
        progress
      }
    } catch (error) {
      console.error('Error getting execution status:', error)
      throw new Error(`Failed to get execution status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Submit deposit transaction
   */
  async submitDepositTx(txHash: string, depositAddress: string): Promise<{ success: boolean }> {
    try {
      const result = await OneClickService.submitDepositTx({
        txHash,
        depositAddress
      })
      return { success: true }
    } catch (error) {
      console.error('Error submitting deposit transaction:', error)
      throw new Error(`Failed to submit deposit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse natural language to extract swap intent (legacy method)
   */
  parseSwapIntent(text: string): SwapRequest | null {
    const lowerText = text.toLowerCase()
    
    // More comprehensive regex patterns for common swap requests
    const patterns = [
      // "Swap 0.1 ETH for USDC"
      /swap\s+([\d.]+)\s+(\w+)\s+for\s+(\w+)/i,
      // "Swap 0.1 ETH to USDC"
      /swap\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i,
      // "Exchange 100 USDC to ETH"
      /exchange\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i,
      // "Exchange 100 USDC for ETH"
      /exchange\s+([\d.]+)\s+(\w+)\s+for\s+(\w+)/i,
      // "Trade 50 MATIC for USDC"
      /trade\s+([\d.]+)\s+(\w+)\s+for\s+(\w+)/i,
      // "Trade 50 MATIC to USDC"
      /trade\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i,
      // "Convert 0.1 ETH to USDC"
      /convert\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i,
      // "Convert 0.1 ETH for USDC"
      /convert\s+([\d.]+)\s+(\w+)\s+for\s+(\w+)/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const [, amount, fromToken, toToken] = match
        console.log('🔍 Parsed swap intent:', { amount, fromToken, toToken })
        return {
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase(),
          amount: this.convertToSmallestUnit(amount, fromToken.toUpperCase())
        }
      }
    }

    console.log('❌ No swap intent found in text:', text)
    return null
  }

  /**
   * Parse natural language to extract swap intent with enhanced parsing
   */
  async parseSwapIntentEnhanced(text: string): Promise<ParsedSwapIntent | null> {
    return await intentParser.parseSwapIntent(text)
  }

  /**
   * Convert ParsedSwapIntent to SwapRequest
   */
  async convertIntentToRequest(intent: ParsedSwapIntent): Promise<SwapRequest> {
    if (!intent.isComplete) {
      throw new Error('Cannot convert incomplete intent to request')
    }

    // Find the specific tokens based on chains
    const fromTokens = await tokenDiscoveryService.getTokensBySymbol(intent.fromToken)
    const toTokens = await tokenDiscoveryService.getTokensBySymbol(intent.toToken)
    
    const fromToken = fromTokens.find(t => t.blockchain === intent.fromChain)
    const toToken = toTokens.find(t => t.blockchain === intent.toChain)
    
    if (!fromToken || !toToken) {
      throw new Error('Could not find tokens for specified chains')
    }

    // Convert amount to smallest unit
    const amountInSmallestUnit = intentParser.convertToSmallestUnit(intent.amount, intent.fromToken, fromToken.decimals)
    console.log(`🔢 Amount conversion: ${intent.amount} ${intent.fromToken} (${fromToken.decimals} decimals) → ${amountInSmallestUnit}`)

    const swapRequest = {
      // Store additional metadata first
      ...(intent as any),
      // Then override with the converted values
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      amount: amountInSmallestUnit,
      slippage: intent.slippage
    }
    
    console.log(`🔢 Final swap request amount: ${swapRequest.amount}`)
    console.log(`👛 Final swap request wallet: ${swapRequest.walletAddress || 'Not set'}`)
    return swapRequest
  }

  /**
   * Get asset ID for a specific token and chain
   */
  async getAssetIdForTokenAndChain(token: string, chain: string): Promise<string> {
    const tokens = await tokenDiscoveryService.getTokensBySymbol(token)
    console.log(`🔍 Found ${tokens.length} tokens for ${token}:`, tokens.map(t => `${t.symbol} on ${t.blockchain} (${t.assetId.substring(0, 30)}...)`))
    
    const tokenInfo = tokens.find(t => t.blockchain === chain)
    
    if (!tokenInfo) {
      throw new Error(`Token ${token} not found on chain ${chain}`)
    }
    
    console.log(`✅ Selected ${tokenInfo.symbol} on ${tokenInfo.blockchain}: ${tokenInfo.assetId}`)
    return tokenInfo.assetId
  }

  /**
   * Get available chains for a token
   */
  async getAvailableChainsForToken(token: string): Promise<string[]> {
    return await tokenDiscoveryService.getAvailableChainsForToken(token)
  }

  /**
   * Search for tokens
   */
  async searchTokens(query: string): Promise<TokenInfo[]> {
    return await tokenDiscoveryService.searchTokens(query)
  }

  /**
   * Get popular tokens
   */
  async getPopularTokens(limit: number = 10): Promise<TokenInfo[]> {
    return await tokenDiscoveryService.getPopularTokens(limit)
  }

  /**
   * Get supported tokens
   */
  getSupportedTokens() {
    return supportedTokens
  }

  /**
   * Convert amount to smallest unit (e.g., ETH to wei)
   */
  public convertToSmallestUnit(amount: string, token: string): string {
    const numAmount = parseFloat(amount)
    const tokenInfo = Object.values(supportedTokens).find(t => t.symbol === token)
    const decimals = tokenInfo?.decimals || 18
    
    return (numAmount * Math.pow(10, decimals)).toString()
  }

  /**
   * Get asset ID for 1Click SDK
   */
  private getAssetId(token: string): string {
    // Asset mapping based on 1Click API documentation examples
    const assetMap: { [key: string]: string } = {
      'USDC': 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near', // USDC on Arbitrum
      'ETH': 'nep141:eth.omft.near', // ETH on Ethereum
      'MATIC': 'nep141:polygon.omft.near', // MATIC on Polygon
      'SOL': 'nep141:sol.omft.near', // SOL on Solana
      'ARB': 'nep141:arb.omft.near', // ARB on Arbitrum
      'WETH': 'nep141:eth-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.omft.near', // WETH on Ethereum
      'WBTC': 'nep141:eth-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.omft.near', // WBTC on Ethereum
      'DAI': 'nep141:eth-0x6b175474e89094c44da98b954eedeac495271d0f.omft.near' // DAI on Ethereum
    }
    
    const upperToken = token.toUpperCase()
    const assetId = assetMap[upperToken]
    
    if (!assetId) {
      console.warn(`⚠️ Unknown token: ${token}, using USDC as fallback`)
      return assetMap['USDC']
    }
    
    return assetId
  }

  private getChainFromAssetId(assetId: string): string {
    if (assetId.includes('arb-') || assetId.includes('arb.omft.near')) return 'arbitrum'
    if (assetId.includes('eth-') || assetId.includes('eth.omft.near')) return 'ethereum'
    if (assetId.includes('polygon-') || assetId.includes('polygon.omft.near')) return 'polygon'
    if (assetId.includes('sol-') || assetId.includes('sol.omft.near')) return 'solana'
    return 'ethereum' // default
  }

  private getAddressForChain(chain: string): string {
    const addresses: { [key: string]: string } = {
      'ethereum': '0x2527D02599Ba641c19FEa793cD0F167589a0f10D',
      'arbitrum': '0x2527D02599Ba641c19FEa793cD0F167589a0f10D',
      'polygon': '0x2527D02599Ba641c19FEa793cD0F167589a0f10D',
      'solana': '13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK'
    }
    return addresses[chain] || addresses['ethereum']
  }

  /**
   * Get deadline (24 hours from now)
   */
  private getDeadline(): string {
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + 24)
    return deadline.toISOString()
  }
}

// Export singleton instance
export const swapService = SwapService.getInstance()
