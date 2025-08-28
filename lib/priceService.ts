interface PriceData {
  [key: string]: {
    usd: number
    usd_24h_change: number
  }
}

class PriceService {
  private static instance: PriceService
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService()
    }
    return PriceService.instance
  }

  /**
   * Get current price for a token
   */
  async getTokenPrice(token: string): Promise<number | null> {
    const normalizedToken = this.normalizeTokenName(token)
    
    // Check cache first
    const cached = this.priceCache.get(normalizedToken)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${normalizedToken}&vs_currencies=usd&include_24hr_change=true`
      )
      
      if (!response.ok) {
        console.warn(`Failed to fetch price for ${token}: ${response.status}`)
        return null
      }

      const data: PriceData = await response.json()
      const price = data[normalizedToken]?.usd

      if (price) {
        this.priceCache.set(normalizedToken, { price, timestamp: Date.now() })
        return price
      }

      return null
    } catch (error) {
      console.error(`Error fetching price for ${token}:`, error)
      return null
    }
  }

  /**
   * Get prices for multiple tokens
   */
  async getTokenPrices(tokens: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>()
    const tokensToFetch: string[] = []

    // Check cache for each token
    for (const token of tokens) {
      const normalizedToken = this.normalizeTokenName(token)
      const cached = this.priceCache.get(normalizedToken)
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        prices.set(token, cached.price)
      } else {
        tokensToFetch.push(normalizedToken)
      }
    }

    // Fetch prices for tokens not in cache
    if (tokensToFetch.length > 0) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokensToFetch.join(',')}&vs_currencies=usd&include_24hr_change=true`
        )
        
        if (response.ok) {
          const data: PriceData = await response.json()
          
          for (const token of tokens) {
            const normalizedToken = this.normalizeTokenName(token)
            const price = data[normalizedToken]?.usd
            
            if (price) {
              this.priceCache.set(normalizedToken, { price, timestamp: Date.now() })
              prices.set(token, price)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching token prices:', error)
      }
    }

    return prices
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  /**
   * Calculate USD value from token amount and price
   */
  calculateUSDValue(amount: string, price: number): string {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return '$0.00'
    
    const usdValue = numAmount * price
    return this.formatPrice(usdValue)
  }

  /**
   * Normalize token names to CoinGecko IDs
   */
  private normalizeTokenName(token: string): string {
    const tokenMap: { [key: string]: string } = {
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'MATIC': 'matic-network',
      'SOL': 'solana',
      'ARB': 'arbitrum',
      'WETH': 'ethereum',
      'WBTC': 'wrapped-bitcoin',
      'DAI': 'dai'
    }
    
    return tokenMap[token.toUpperCase()] || token.toLowerCase()
  }
}

export const priceService = PriceService.getInstance()
