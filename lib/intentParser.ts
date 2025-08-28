import { tokenDiscoveryService, TokenInfo } from './tokenDiscoveryService'

export interface ParsedSwapIntent {
  fromToken: string
  toToken: string
  fromChain?: string
  toChain?: string
  amount: string
  slippage?: number
  isComplete: boolean
  missingInfo?: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface ChainSelectionPrompt {
  type: 'chain_selection'
  token: string
  availableChains: string[]
  selectionType: 'from' | 'to'
  partialRequest: ParsedSwapIntent
}

export class IntentParser {
  private static instance: IntentParser

  private constructor() {}

  static getInstance(): IntentParser {
    if (!IntentParser.instance) {
      IntentParser.instance = new IntentParser()
    }
    return IntentParser.instance
  }

  /**
   * Parse natural language to extract swap intent
   */
  async parseSwapIntent(text: string): Promise<ParsedSwapIntent | null> {
    console.log('🔍 IntentParser.parseSwapIntent called with:', text)
    const lowerText = text.toLowerCase()
    
    // Check if this looks like a swap request
    if (!this.isSwapRequest(lowerText)) {
      console.log('❌ Not recognized as swap request')
      return null
    }

    // Extract basic swap information
    const basicInfo = this.extractBasicSwapInfo(text)
    if (!basicInfo) {
      return null
    }

    // Try to extract chain information
    const chainInfo = this.extractChainInfo(text)
    
    // Combine basic and chain information
    const partialIntent: ParsedSwapIntent = {
      fromToken: basicInfo.fromToken,
      toToken: basicInfo.toToken,
      fromChain: chainInfo.fromChain,
      toChain: chainInfo.toChain,
      amount: basicInfo.amount,
      slippage: basicInfo.slippage,
      isComplete: false,
      missingInfo: [],
      confidence: 'medium'
    }

    // Validate and complete the intent
    return await this.validateAndCompleteIntent(partialIntent)
  }

  /**
   * Check if text looks like a swap request
   */
  private isSwapRequest(text: string): boolean {
    const swapKeywords = ['swap', 'exchange', 'trade', 'convert', 'change']
    return swapKeywords.some(keyword => text.includes(keyword))
  }

  /**
   * Extract basic swap information (amount, from token, to token)
   */
  private extractBasicSwapInfo(text: string): { fromToken: string; toToken: string; amount: string; slippage?: number } | null {
    // More comprehensive regex patterns for common swap requests
    const patterns = [
      // "Swap 0.1 ETH for USDC"
      /swap\s+([\d.]+)\s+(\w+)\s+for\s+(\w+)/i,
      // "Swap 0.1 ETH to USDC"
      /swap\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i,
      // "Swap 0.01 eth on ethereum to usdc on solana" (with chains)
      /swap\s+([\d.]+)\s+(\w+)\s+on\s+\w+\s+to\s+(\w+)\s+on\s+\w+/i,
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
      /convert\s+([\d.]+)\s+(\w+)\s+for\s+(\w+)/i,
      // "0.1 ETH to USDC" (without explicit swap keyword)
      /^([\d.]+)\s+(\w+)\s+to\s+(\w+)$/i,
      // "0.1 ETH for USDC" (without explicit swap keyword)
      /^([\d.]+)\s+(\w+)\s+for\s+(\w+)$/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const [, amount, fromToken, toToken] = match
        console.log('🔍 Extracted basic swap info:', { amount, fromToken, toToken })
        
        // Extract slippage if present
        const slippageMatch = text.match(/(?:slippage|slippage tolerance)\s*:?\s*([\d.]+)%?/i)
        const slippage = slippageMatch ? parseFloat(slippageMatch[1]) : undefined
        
        return {
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase(),
          amount,
          slippage
        }
      }
    }

    return null
  }

  /**
   * Extract chain information from text
   */
  private extractChainInfo(text: string): { fromChain?: string; toChain?: string } {
    console.log('🔍 Extracting chain info from:', text)
    
    // More specific chain pattern that avoids matching asset names
    // Only match chains that are explicitly mentioned with "on", "from", or "to"
    const chainPattern = /(?:on|from|to)\s+(arbitrum|arb|polygon|pol|solana|sol|base|optimism|op|bsc|binance|avax|avalanche|near|sui|ton|stellar|tron|aptos|cardano|btc|bitcoin|doge|dogecoin|xrp|ripple|zec|zcash|bera)/gi
    
    // Special handling for ethereum/eth to avoid confusion with asset names
    const ethChainPattern = /(?:on|from|to)\s+(ethereum)/gi
    
    const matches = Array.from(text.matchAll(chainPattern))
    const ethMatches = Array.from(text.matchAll(ethChainPattern))
    
    // Combine matches and normalize
    const allMatches = [...matches, ...ethMatches]
    const chains = allMatches.map(match => this.normalizeChainName(match[1]))
    
    console.log(`🔗 Found chains: ${chains.join(', ')}`)
    
    // If we have exactly 2 chains, determine order based on context
    if (chains.length === 2) {
      // Look for "to" keyword to determine direction
      const toIndex = text.toLowerCase().indexOf(' to ')
      if (toIndex !== -1) {
        // Find which chain comes after "to"
        const afterTo = text.substring(toIndex + 4)
        const toChainMatch = afterTo.match(/(?:on\s+)?(ethereum|arbitrum|arb|polygon|pol|solana|sol|base|optimism|op|bsc|binance|avax|avalanche|near|sui|ton|stellar|tron|aptos|cardano|btc|bitcoin|doge|dogecoin|xrp|ripple|zec|zcash|bera)/i)
        
        if (toChainMatch) {
          const toChain = this.normalizeChainName(toChainMatch[1])
          const fromChain = chains.find(chain => chain !== toChain)
          
          if (fromChain) {
            console.log(`✅ Determined order: ${fromChain} → ${toChain}`)
            return { fromChain, toChain }
          }
        }
      }
      
      // Fallback: assume first is from, second is to
      console.log(`✅ Using fallback order: ${chains[0]} → ${chains[1]}`)
      return { fromChain: chains[0], toChain: chains[1] }
    }
    
    // If we have more than 2 chains, try to determine order based on "to" keyword
    if (chains.length > 2) {
      const toIndex = text.toLowerCase().indexOf(' to ')
      if (toIndex !== -1) {
        // Find which chain comes after "to"
        const afterTo = text.substring(toIndex + 4)
        const toChainMatch = afterTo.match(/(?:on\s+)?(ethereum|arbitrum|arb|polygon|pol|solana|sol|base|optimism|op|bsc|binance|avax|avalanche|near|sui|ton|stellar|tron|aptos|cardano|btc|bitcoin|doge|dogecoin|xrp|ripple|zec|zcash|bera)/i)
        
        if (toChainMatch) {
          const toChain = this.normalizeChainName(toChainMatch[1])
          // Find the chain that appears before "to" - it should be the fromChain
          const beforeTo = text.substring(0, toIndex)
          const fromChainMatch = beforeTo.match(/(?:on\s+)?(ethereum|arbitrum|arb|polygon|pol|solana|sol|base|optimism|op|bsc|binance|avax|avalanche|near|sui|ton|stellar|tron|aptos|cardano|btc|bitcoin|doge|dogecoin|xrp|ripple|zec|zcash|bera)/i)
          
          if (fromChainMatch) {
            const fromChain = this.normalizeChainName(fromChainMatch[1])
            console.log(`✅ Determined order from context: ${fromChain} → ${toChain}`)
            return { fromChain, toChain }
          }
        }
      }
      
      // Fallback: use first and last chains found
      console.log(`✅ Using fallback order (first/last): ${chains[0]} → ${chains[chains.length - 1]}`)
      return { fromChain: chains[0], toChain: chains[chains.length - 1] }
    }
    
    // If we have only one chain, we can't determine if it's from or to
    if (chains.length === 1) {
      return { fromChain: chains[0] }
    }

    return {}
  }

  /**
   * Normalize chain names to standard format
   */
  private normalizeChainName(chainName: string): string {
    const chainMap: { [key: string]: string } = {
      'ethereum': 'eth',
      'eth': 'eth',
      'arbitrum': 'arb',
      'arb': 'arb',
      'polygon': 'pol',
      'pol': 'pol',
      'solana': 'sol',
      'sol': 'sol',
      'base': 'base',
      'optimism': 'op',
      'op': 'op',
      'binance': 'bsc',
      'bsc': 'bsc',
      'avalanche': 'avax',
      'avax': 'avax',
      'near': 'near',
      'sui': 'sui',
      'ton': 'ton',
      'stellar': 'stellar',
      'tron': 'tron',
      'aptos': 'aptos',
      'cardano': 'cardano',
      'bitcoin': 'btc',
      'btc': 'btc',
      'dogecoin': 'doge',
      'doge': 'doge',
      'ripple': 'xrp',
      'xrp': 'xrp',
      'zcash': 'zec',
      'zec': 'zec',
      'bera': 'bera'
    }
    
    return chainMap[chainName.toLowerCase()] || chainName.toLowerCase()
  }

  /**
   * Validate and complete the swap intent
   */
  private async validateAndCompleteIntent(intent: ParsedSwapIntent): Promise<ParsedSwapIntent> {
    const missingInfo: string[] = []
    
    // Check if tokens exist
    const fromTokens = await tokenDiscoveryService.getTokensBySymbol(intent.fromToken)
    const toTokens = await tokenDiscoveryService.getTokensBySymbol(intent.toToken)
    
    if (fromTokens.length === 0) {
      missingInfo.push(`Token "${intent.fromToken}" not found`)
      intent.confidence = 'low'
    }
    
    if (toTokens.length === 0) {
      missingInfo.push(`Token "${intent.toToken}" not found`)
      intent.confidence = 'low'
    }

    // If tokens exist, check chain information
    if (fromTokens.length > 0 && toTokens.length > 0) {
      const fromChains = [...new Set(fromTokens.map(t => t.blockchain))]
      const toChains = [...new Set(toTokens.map(t => t.blockchain))]
      
      console.log(`🔍 Chain validation: fromChains=${fromChains.join(', ')}, toChains=${toChains.join(', ')}`)
      console.log(`🔍 Intent chains: fromChain=${intent.fromChain}, toChain=${intent.toChain}`)
      
      // If fromChain is specified, validate it
      if (intent.fromChain && !fromChains.includes(intent.fromChain)) {
        console.log(`❌ From chain validation failed: ${intent.fromChain} not in ${fromChains.join(', ')}`)
        missingInfo.push(`Chain "${intent.fromChain}" not available for ${intent.fromToken}`)
        intent.confidence = 'low'
      }
      
      // If toChain is specified, validate it
      if (intent.toChain && !toChains.includes(intent.toChain)) {
        console.log(`❌ To chain validation failed: ${intent.toChain} not in ${toChains.join(', ')}`)
        missingInfo.push(`Chain "${intent.toChain}" not available for ${intent.toToken}`)
        intent.confidence = 'low'
      }
      
      // If chains are missing but tokens have multiple chains, add to missing info
      if (!intent.fromChain && fromChains.length > 1) {
        missingInfo.push(`Please specify source chain for ${intent.fromToken} (available: ${fromChains.join(', ')})`)
      }
      
      if (!intent.toChain && toChains.length > 1) {
        missingInfo.push(`Please specify destination chain for ${intent.toToken} (available: ${toChains.join(', ')})`)
      }
      
      // Auto-select chains if only one option available
      if (!intent.fromChain && fromChains.length === 1) {
        intent.fromChain = fromChains[0]
        console.log(`✅ Auto-selected source chain: ${intent.fromChain} for ${intent.fromToken}`)
      }
      
      if (!intent.toChain && toChains.length === 1) {
        intent.toChain = toChains[0]
        console.log(`✅ Auto-selected destination chain: ${intent.toChain} for ${intent.toToken}`)
      }
    }

    // Check if amount is valid
    const amount = parseFloat(intent.amount)
    if (isNaN(amount) || amount <= 0) {
      missingInfo.push('Invalid amount specified')
      intent.confidence = 'low'
    }

    // Determine if intent is complete
    intent.isComplete = missingInfo.length === 0 && intent.fromChain && intent.toChain
    intent.missingInfo = missingInfo
    
    // Update confidence based on completeness
    if (intent.isComplete) {
      intent.confidence = 'high'
    } else if (intent.confidence !== 'low') {
      intent.confidence = 'medium'
    }

    console.log('🔍 Validated intent:', {
      ...intent,
      fromTokensCount: fromTokens.length,
      toTokensCount: toTokens.length
    })

    return intent
  }

  /**
   * Generate a chain selection prompt
   */
  async generateChainSelectionPrompt(intent: ParsedSwapIntent): Promise<ChainSelectionPrompt | null> {
    if (intent.isComplete) return null

    // Determine which chain selection is needed
    if (!intent.fromChain) {
      const fromTokens = await tokenDiscoveryService.getTokensBySymbol(intent.fromToken)
      const availableChains = Array.from(new Set(fromTokens.map(t => t.blockchain)))
      
      if (availableChains.length > 1) {
        return {
          type: 'chain_selection',
          token: intent.fromToken,
          availableChains,
          selectionType: 'from',
          partialRequest: intent
        }
      }
    }

    if (!intent.toChain) {
      const toTokens = await tokenDiscoveryService.getTokensBySymbol(intent.toToken)
      const availableChains = Array.from(new Set(toTokens.map(t => t.blockchain)))
      
      if (availableChains.length > 1) {
        return {
          type: 'chain_selection',
          token: intent.toToken,
          availableChains,
          selectionType: 'to',
          partialRequest: intent
        }
      }
    }

    return null
  }

  /**
   * Convert amount to smallest unit for API
   */
  convertToSmallestUnit(amount: string, token: string, decimals: number): string {
    const numAmount = parseFloat(amount)
    return (numAmount * Math.pow(10, decimals)).toString()
  }
}

export const intentParser = IntentParser.getInstance()
