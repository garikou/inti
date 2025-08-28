import { OpenAPI, QuoteRequest, OneClickService } from '@defuse-protocol/one-click-sdk-typescript'
import { supportedTokens } from './web3'
import { priceService } from './priceService'

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
      const originAsset = this.getAssetId(request.fromToken)
      const destinationAsset = this.getAssetId(request.toToken)
      const originChain = this.getChainFromAssetId(originAsset)
      const destinationChain = this.getChainFromAssetId(destinationAsset)

      // Use wallet address if provided, otherwise fall back to chain-specific addresses
      const walletAddress = request.walletAddress || this.getAddressForChain(originChain)
      const recipientAddress = request.walletAddress || this.getAddressForChain(destinationChain)

      const quoteRequest: QuoteRequest = {
        dry: true, // Use dry: true for quotes to avoid generating transactions
        depositMode: 'SIMPLE',
        swapType: 'EXACT_INPUT',
        slippageTolerance: request.slippage || 100, // 1% default
        originAsset: originAsset,
        depositType: 'ORIGIN_CHAIN',
        destinationAsset: destinationAsset,
        amount: request.amount,
        refundTo: request.refundTo || walletAddress,
        refundType: 'ORIGIN_CHAIN',
        recipient: request.recipient || recipientAddress,
        recipientType: 'DESTINATION_CHAIN',
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

      const quote = await OneClickService.getQuote(quoteRequest)
      
      console.log('📥 API Response:', JSON.stringify(quote, null, 2))

      return {
        id: Date.now().toString(),
        fromToken: request.fromToken,
        toToken: request.toToken,
        fromAmount: quote.quote?.amountInFormatted || request.amount,
        toAmount: quote.quote?.amountOutFormatted || '0',
        minAmountOut: quote.quote?.minAmountOut ? (parseInt(quote.quote.minAmountOut) / Math.pow(10, 6)).toString() : undefined, // Convert from smallest unit to formatted
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
      // Recreate the original request with dry: false to get deposit address
      const originAsset = this.getAssetId(quote.fromToken)
      const destinationAsset = this.getAssetId(quote.toToken)
      const originChain = this.getChainFromAssetId(originAsset)
      const destinationChain = this.getChainFromAssetId(destinationAsset)

      // Use wallet address if available in the quote, otherwise fall back to chain-specific addresses
      const walletAddress = (quote as any).walletAddress || this.getAddressForChain(originChain)
      const recipientAddress = (quote as any).walletAddress || this.getAddressForChain(destinationChain)

      // Convert amount to smallest unit (wei) for the API
      const amountInSmallestUnit = this.convertToSmallestUnit(quote.fromAmount, quote.fromToken)
      
      const executionRequest: QuoteRequest = {
        dry: false, // Set to false to get deposit address
        depositMode: 'SIMPLE',
        swapType: 'EXACT_INPUT',
        slippageTolerance: quote.slippage * 100,
        originAsset: originAsset,
        depositType: 'ORIGIN_CHAIN',
        destinationAsset: destinationAsset,
        amount: amountInSmallestUnit,
        refundTo: walletAddress,
        refundType: 'ORIGIN_CHAIN',
        recipient: recipientAddress,
        recipientType: 'DESTINATION_CHAIN',
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
   * Get execution status
   */
  async getExecutionStatus(depositAddress: string): Promise<{ status: string; details?: any }> {
    try {
      const status = await OneClickService.getExecutionStatus(depositAddress)
      return {
        status: status.status || 'pending',
        details: status
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
   * Parse natural language to extract swap intent
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
    const addresses = {
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
