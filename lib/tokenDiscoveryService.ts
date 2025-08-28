interface TokenInfo {
  assetId: string
  symbol: string
  decimals: number
  blockchain: string
  price: number
  priceUpdatedAt: string
  contractAddress: string
}

interface TokenSearchResult {
  tokens: TokenInfo[]
  totalCount: number
  hasMultipleChains: boolean
  availableChains: string[]
}

class TokenDiscoveryService {
  private static instance: TokenDiscoveryService
  private tokenCache: TokenInfo[] = []
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
  private readonly API_URL = 'https://1click.chaindefuser.com/v0/tokens'

  private constructor() {}

  static getInstance(): TokenDiscoveryService {
    if (!TokenDiscoveryService.instance) {
      TokenDiscoveryService.instance = new TokenDiscoveryService()
    }
    return TokenDiscoveryService.instance
  }

  /**
   * Fetch all tokens from the 1Click API
   */
  async fetchAllTokens(): Promise<TokenInfo[]> {
    try {
      console.log('🔍 Fetching tokens from 1Click API...')
      const response = await fetch(this.API_URL)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`)
      }

      const tokens: TokenInfo[] = await response.json()
      console.log(`✅ Fetched ${tokens.length} tokens from 1Click API`)
      
      // Cache the tokens
      this.tokenCache = tokens
      this.lastFetch = Date.now()
      
      return tokens
    } catch (error) {
      console.error('❌ Error fetching tokens:', error)
      throw new Error(`Failed to fetch tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all tokens (from cache if available, otherwise fetch)
   */
  async getAllTokens(): Promise<TokenInfo[]> {
    // Check if cache is still valid
    if (this.tokenCache.length > 0 && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      console.log(`📦 Using cached tokens (${this.tokenCache.length} tokens)`)
      return this.tokenCache
    }

    return this.fetchAllTokens()
  }

  /**
   * Get tokens by blockchain/chain
   */
  async getTokensByChain(chain: string): Promise<TokenInfo[]> {
    const tokens = await this.getAllTokens()
    const normalizedChain = chain.toLowerCase()
    
    return tokens.filter(token => 
      token.blockchain.toLowerCase() === normalizedChain
    )
  }

  /**
   * Get tokens by symbol (case-insensitive)
   */
  async getTokensBySymbol(symbol: string): Promise<TokenInfo[]> {
    const tokens = await this.getAllTokens()
    const normalizedSymbol = symbol.toUpperCase()
    
    return tokens.filter(token => 
      token.symbol.toUpperCase() === normalizedSymbol
    )
  }

  /**
   * Search tokens by symbol (partial match)
   */
  async searchTokens(query: string): Promise<TokenInfo[]> {
    const tokens = await this.getAllTokens()
    const normalizedQuery = query.toLowerCase()
    
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(normalizedQuery) ||
      token.blockchain.toLowerCase().includes(normalizedQuery)
    )
  }

  /**
   * Get available chains for a specific token symbol
   */
  async getAvailableChainsForToken(symbol: string): Promise<string[]> {
    const tokens = await this.getTokensBySymbol(symbol)
    const chains = tokens.map(token => token.blockchain)
    return [...new Set(chains)] // Remove duplicates
  }

  /**
   * Get token info by asset ID
   */
  async getTokenByAssetId(assetId: string): Promise<TokenInfo | null> {
    const tokens = await this.getAllTokens()
    return tokens.find(token => token.assetId === assetId) || null
  }

  /**
   * Get popular tokens (tokens with price > 0 and recent updates)
   */
  async getPopularTokens(limit: number = 10): Promise<TokenInfo[]> {
    const tokens = await this.getAllTokens()
    
    return tokens
      .filter(token => token.price > 0)
      .sort((a, b) => new Date(b.priceUpdatedAt).getTime() - new Date(a.priceUpdatedAt).getTime())
      .slice(0, limit)
  }

  /**
   * Get all available blockchains
   */
  async getAvailableBlockchains(): Promise<string[]> {
    const tokens = await this.getAllTokens()
    const chains = tokens.map(token => token.blockchain)
    return [...new Set(chains)].sort()
  }

  /**
   * Search for tokens with advanced filtering
   */
  async searchTokensAdvanced(query: string): Promise<TokenSearchResult> {
    const tokens = await this.getAllTokens()
    const normalizedQuery = query.toLowerCase()
    
    const matchingTokens = tokens.filter(token => 
      token.symbol.toLowerCase().includes(normalizedQuery) ||
      token.blockchain.toLowerCase().includes(normalizedQuery)
    )

    // Group by symbol to check for multiple chains
    const symbolGroups = new Map<string, TokenInfo[]>()
    matchingTokens.forEach(token => {
      const symbol = token.symbol.toUpperCase()
      if (!symbolGroups.has(symbol)) {
        symbolGroups.set(symbol, [])
      }
      symbolGroups.get(symbol)!.push(token)
    })

    const hasMultipleChains = Array.from(symbolGroups.values()).some(group => group.length > 1)
    const availableChains = [...new Set(matchingTokens.map(token => token.blockchain))]

    return {
      tokens: matchingTokens,
      totalCount: matchingTokens.length,
      hasMultipleChains,
      availableChains
    }
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.tokenCache = []
    this.lastFetch = 0
    console.log('🗑️ Token cache cleared')
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { hasCache: boolean; cacheAge: number; tokenCount: number } {
    const hasCache = this.tokenCache.length > 0
    const cacheAge = hasCache ? Date.now() - this.lastFetch : 0
    const tokenCount = this.tokenCache.length

    return { hasCache, cacheAge, tokenCount }
  }
}

export const tokenDiscoveryService = TokenDiscoveryService.getInstance()
export type { TokenInfo, TokenSearchResult }
