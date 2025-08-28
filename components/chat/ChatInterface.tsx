'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAccount } from 'wagmi'
import { ChatMessage } from './ChatMessage'
import { swapService, SwapQuote, SwapRequest } from '@/lib/swapService'
import { testJWTToken } from '@/lib/testToken'
import { priceService } from '@/lib/priceService'
import { tokenDiscoveryService } from '@/lib/tokenDiscoveryService'
import { intentParser, ParsedSwapIntent } from '@/lib/intentParser'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  swapData?: SwapQuote
  awaitingConfirmation?: boolean
}



export function ChatInterface() {
  const { address, isConnected } = useAccount()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm Inti, your AI trading assistant. I can help you swap cryptocurrencies, check prices, and execute trades. What would you like to do today?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Handle incomplete swap intents by providing interactive guidance
   */
  const handleIncompleteIntent = async (intent: ParsedSwapIntent, currentMessages: Message[]): Promise<Message> => {
    console.log('🔄 Handling incomplete intent:', intent)
    
    let guidanceMessage = `I understand you want to swap **${intent.amount} ${intent.fromToken}** for **${intent.toToken}**, but I need some additional information:\n\n`
    
    // Check what information is missing
    if (!intent.fromChain) {
      const fromChains = await swapService.getAvailableChainsForToken(intent.fromToken)
      if (fromChains.length === 1) {
        // Auto-complete if only one option
        intent.fromChain = fromChains[0]
        guidanceMessage += `✅ **Auto-selected source chain:** ${intent.fromChain} for ${intent.fromToken}\n\n`
      } else {
        guidanceMessage += `🔗 **Please specify the source chain for ${intent.fromToken}:**\n`
        guidanceMessage += fromChains.map(chain => `• ${chain}`).join('\n')
        guidanceMessage += '\n\n'
      }
    }
    
    if (!intent.toChain) {
      const toChains = await swapService.getAvailableChainsForToken(intent.toToken)
      if (toChains.length === 1) {
        // Auto-complete if only one option
        intent.toChain = toChains[0]
        guidanceMessage += `✅ **Auto-selected destination chain:** ${intent.toChain} for ${intent.toToken}\n\n`
      } else {
        guidanceMessage += `🔗 **Please specify the destination chain for ${intent.toToken}:**\n`
        guidanceMessage += toChains.map(chain => `• ${chain}`).join('\n')
        guidanceMessage += '\n\n'
      }
    }
    
    // If we have missing info, provide examples
    if (intent.missingInfo && intent.missingInfo.length > 0) {
      guidanceMessage += `⚠️ **Issues to resolve:**\n`
      guidanceMessage += intent.missingInfo.map(info => `• ${info}`).join('\n')
      guidanceMessage += '\n\n'
    }
    
    // Provide example commands
    guidanceMessage += `💡 **Example commands:**\n`
    if (!intent.fromChain) {
      guidanceMessage += `• "swap ${intent.amount} ${intent.fromToken} on ethereum to ${intent.toToken}"\n`
    }
    if (!intent.toChain) {
      guidanceMessage += `• "swap ${intent.amount} ${intent.fromToken} to ${intent.toToken} on arbitrum"\n`
    }
    guidanceMessage += `• "swap ${intent.amount} ${intent.fromToken} on ethereum to ${intent.toToken} on arbitrum"\n\n`
    
    // Check if we can auto-complete now
    if (intent.fromChain && intent.toChain) {
      guidanceMessage += `🎉 **Ready to proceed!** I can now get you a quote for this swap.`
    } else {
      guidanceMessage += `Please provide the missing chain information and I'll get you a quote!`
    }
    
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: guidanceMessage,
      timestamp: new Date()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

             // Generate AI response
         setTimeout(async () => {
           const botResponse = await generateBotResponse(inputValue, messages)
           setMessages(prev => [...prev, botResponse])
           setIsLoading(false)
         }, 1500)
  }

    const generateBotResponse = async (userInput: string, currentMessages: Message[]): Promise<Message> => {
    const lowerInput = userInput.toLowerCase()

    // Check if this is a confirmation response to a pending swap
    const pendingSwapMessage = currentMessages.find(m => m.awaitingConfirmation)
    console.log('🔍 Found pending swap message:', pendingSwapMessage)
    if (pendingSwapMessage && pendingSwapMessage.swapData) {
      console.log('🔍 Pending swap data:', pendingSwapMessage.swapData)
      const isAffirmative = /^(yes|y|confirm|proceed|go|ok|okay|sure|absolutely|definitely|let's do it|do it)$/i.test(userInput)
      const isNegative = /^(no|n|cancel|abort|stop|don't|dont|nevermind|never mind|not now|later)$/i.test(userInput)
      
      if (isAffirmative) {
        // Execute the swap
        try {
          const result = await swapService.executeSwap(pendingSwapMessage.swapData)
          // Clear the awaiting confirmation flag
          setMessages(prev => prev.map(m => ({ ...m, awaitingConfirmation: false })))
          
          // Format deposit information
          const depositInfo = `✅ Swap quote confirmed!

📋 **Deposit Information:**

• **Address:** ${result.depositAddress}
• **Asset:** ${pendingSwapMessage.swapData.fromToken}
• **Chain:** ${pendingSwapMessage.swapData.depositChain || 'ethereum'}
• **Amount:** ${pendingSwapMessage.swapData.fromAmount} ${pendingSwapMessage.swapData.fromToken}

🚀 **Next Steps:**

1. Send ${pendingSwapMessage.swapData.fromAmount} ${pendingSwapMessage.swapData.fromToken} to the deposit address above
2. Copy the transaction hash from your wallet after sending
3. Use the command "submit tx [YOUR_TX_HASH]" to complete the swap

The swap will be processed once you submit your deposit transaction.`
          
          // Create updated swap data with deposit address
          const updatedSwapData = {
            ...pendingSwapMessage.swapData,
            depositAddress: result.depositAddress
          }
          
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: depositInfo,
            timestamp: new Date(),
            swapData: updatedSwapData
          }
        } catch (error) {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: `❌ Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
            timestamp: new Date()
          }
        }
      } else if (isNegative) {
        // Clear the awaiting confirmation flag
        setMessages(prev => prev.map(m => ({ ...m, awaitingConfirmation: false })))
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "❌ Swap cancelled. No worries! Let me know if you'd like to try a different swap or if there's anything else I can help you with.",
          timestamp: new Date()
        }
      }
    }

    // Handle swap status check
    const statusMatch = userInput.match(/status|check\s+status/i)
    if (statusMatch) {
      console.log('🔍 Looking for swap to check status...')
      
      // Find the most recent swap with deposit address
      const recentSwapMessage = currentMessages
        .slice()
        .reverse()
        .find((m: Message) => m.swapData && m.swapData.depositAddress)
      
      if (recentSwapMessage && recentSwapMessage.swapData) {
        try {
          const statusResult = await swapService.getExecutionStatus(recentSwapMessage.swapData.depositAddress!)
          
          let statusMessage = `${statusResult.formattedStatus}\n\n${statusResult.progress}\n\n`
          
          // Add transaction details if available
          if (statusResult.details?.swapDetails) {
            const details = statusResult.details.swapDetails
            statusMessage += `📊 **Swap Details:**\n`
            statusMessage += `• Amount In: ${details.amountInFormatted || details.amountIn} ${recentSwapMessage.swapData.fromToken}\n`
            statusMessage += `• Amount Out: ${details.amountOutFormatted || details.amountOut} ${recentSwapMessage.swapData.toToken}\n`
            
            if (details.originChainTxHashes && details.originChainTxHashes.length > 0) {
              statusMessage += `• Origin TX: ${details.originChainTxHashes[0].hash}\n`
            }
            if (details.destinationChainTxHashes && details.destinationChainTxHashes.length > 0) {
              statusMessage += `• Destination TX: ${details.destinationChainTxHashes[0].hash}\n`
            }
          }
          
          // Add refund information if applicable
          if (statusResult.status === 'REFUNDED' && statusResult.details?.swapDetails?.refundedAmount) {
            const refund = statusResult.details.swapDetails
            statusMessage += `\n💸 **Refund Details:**\n`
            statusMessage += `• Refunded Amount: ${refund.refundedAmountFormatted || refund.refundedAmount} ${recentSwapMessage.swapData.fromToken}\n`
          }
          
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: statusMessage,
            timestamp: new Date()
          }
        } catch (error) {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: `❌ Failed to check swap status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          }
        }
      } else {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "❌ No recent swap found to check status. Please start a swap first.",
          timestamp: new Date()
        }
      }
    }

    // Handle deposit transaction submission
    const submitTxMatch = userInput.match(/submit\s+tx\s+([a-fA-F0-9x]+)/i)
    if (submitTxMatch) {
      const txHash = submitTxMatch[1]
      console.log('🔍 Looking for pending swap message with deposit address...')
      
      // First try to find a message with deposit address (executed swap)
      let pendingSwapMessage = currentMessages.find(m => m.swapData && m.swapData.depositAddress)
      
      // If not found, look for the most recent awaiting confirmation message (quote phase)
      if (!pendingSwapMessage) {
        console.log('🔍 No executed swap found, looking for pending quote...')
        pendingSwapMessage = currentMessages.find(m => m.awaitingConfirmation && m.swapData)
      }
      
      console.log('🔍 Found pending swap message:', pendingSwapMessage)
      
      if (pendingSwapMessage && pendingSwapMessage.swapData) {
        // If we have a deposit address, submit the transaction
        if (pendingSwapMessage.swapData.depositAddress) {
          try {
            const result = await swapService.submitDepositTx(txHash, pendingSwapMessage.swapData.depositAddress!)
            return {
              id: Date.now().toString(),
              type: 'bot',
              content: `✅ Deposit transaction submitted successfully!\n\nTransaction hash: ${txHash}\n\nYour swap is now being processed. You should receive ${pendingSwapMessage.swapData.toAmount} ${pendingSwapMessage.swapData.toToken} in your wallet shortly.`,
              timestamp: new Date()
            }
          } catch (error) {
            return {
              id: Date.now().toString(),
              type: 'bot',
              content: `❌ Failed to submit deposit transaction: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your transaction hash and try again.`,
              timestamp: new Date()
            }
          }
        } else {
          // We have a pending quote but no deposit address, need to execute the swap first
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: `⚠️ I found a pending swap quote, but it hasn't been executed yet. Please confirm the swap first by typing "yes", then submit your transaction hash.\n\nOr if you've already sent funds, please provide the deposit address you used.`,
            timestamp: new Date()
          }
        }
      } else {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "❌ No pending swap found. Please start a new swap first, then submit your transaction hash.",
          timestamp: new Date()
        }
      }
    }

    // Clear any previous awaiting confirmation flags when starting a new quote
    setMessages(prev => prev.map(m => ({ ...m, awaitingConfirmation: false })))
    
    // Try to parse swap intent with enhanced parsing
    console.log('🔍 Attempting to parse intent for:', userInput)
    const parsedIntent = await swapService.parseSwapIntentEnhanced(userInput)
    console.log('🔍 Parse result:', parsedIntent)

    if (parsedIntent) {
      console.log('🔍 Parsed intent:', parsedIntent)

      // If intent is incomplete, provide interactive guidance
      if (!parsedIntent.isComplete) {
        return await handleIncompleteIntent(parsedIntent, currentMessages)
      }

      // Add wallet address to the swap request if connected
      if (isConnected && address) {
        (parsedIntent as any).walletAddress = address
      }

      try {
        // Check if JWT token is configured
        if (!process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN || process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN === 'your-jwt-token') {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: "I can help you with that! However, the JWT token for the 1Click API is not configured yet. Please:\n\n1. Request a JWT token from: https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform\n2. Add it to your .env.local file as NEXT_PUBLIC_1CLICK_JWT_TOKEN\n3. Restart the development server\n\nFor now, I can show you a preview of what the swap would look like.",
            timestamp: new Date(),
            swapData: {
              id: 'preview',
              fromToken: parsedIntent.fromToken,
              toToken: parsedIntent.toToken,
              fromAmount: parsedIntent.amount,
              toAmount: '0', // Will be calculated when token is configured
              slippage: parsedIntent.slippage || 1,
              gasEstimate: '0',
              depositAddress: undefined,
              depositAsset: undefined,
              depositChain: undefined,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending'
            }
          }
        }
        
        // Convert intent to request and get quote
        const swapRequest = await swapService.convertIntentToRequest(parsedIntent)
        if (isConnected && address) {
          swapRequest.walletAddress = address
        }
        
        const quote = await swapService.getQuote(swapRequest)
        
        // Format the swap details for display
        const timeEstimate = quote.timeEstimate ? `${quote.timeEstimate}s` : 'Unknown'
        
        // Format USD values properly
        const formatUSD = (usdString: string | undefined, isOutput: boolean = false) => {
          if (!usdString) return ''
          const usdValue = parseFloat(usdString)
          if (isNaN(usdValue)) return ''
          const prefix = isOutput ? '~' : ''
          return usdValue >= 1 ? `(${prefix}$${usdValue.toFixed(2)})` : `(${prefix}$${usdValue.toFixed(4)})`
        }
        
        // Format amount from smallest unit to human-readable format
        const formatAmountFromSmallestUnit = async (amountInSmallestUnit: string, token: string, chain?: string): Promise<string> => {
          try {
            console.log(`🔢 Formatting amount: ${amountInSmallestUnit} for token ${token} on chain ${chain}`)
            
            // Check if the amount is already in a reasonable decimal format
            const amountValue = parseFloat(amountInSmallestUnit)
            console.log(`🔢 Amount value: ${amountValue}`)
            
            // If the amount is very small (< 0.01), it's likely already in decimal format
            if (amountValue < 0.01 && amountValue > 0) {
              console.log(`🔢 Amount appears to already be in decimal format: ${amountInSmallestUnit}`)
              return amountInSmallestUnit
            }
            
            // Get token info to find decimals
            const tokens = await swapService.searchTokens(token)
            const targetToken = tokens.find(t => 
              t.symbol.toUpperCase() === token.toUpperCase() && 
              (!chain || t.blockchain === chain)
            )
            
            if (targetToken) {
              const decimals = targetToken.decimals
              console.log(`🔢 Found token ${targetToken.symbol} with ${decimals} decimals`)
              const amount = parseFloat(amountInSmallestUnit) / Math.pow(10, decimals)
              const result = amount.toFixed(decimals)
              console.log(`🔢 Converted ${amountInSmallestUnit} to ${result}`)
              return result
            }
            
            // Fallback: assume 18 decimals if token not found
            console.log(`🔢 Token not found, using 18 decimals fallback`)
            const amount = parseFloat(amountInSmallestUnit) / Math.pow(10, 18)
            const result = amount.toFixed(18)
            console.log(`🔢 Converted ${amountInSmallestUnit} to ${result}`)
            return result
          } catch (error) {
            console.error('Error formatting amount:', error)
            return amountInSmallestUnit
          }
        }
        
        const amountInUsd = formatUSD(quote.amountInUsd, false)
        const amountOutUsd = formatUSD(quote.amountOutUsd, true)
        
        // Format minAmountOut properly
        console.log(`🔢 Raw minAmountOut from API: ${quote.minAmountOut}`)
        console.log(`🔢 Raw toAmount from API: ${quote.toAmount}`)
        
        const formattedMinAmountOut = await formatAmountFromSmallestUnit(
          quote.minAmountOut || quote.toAmount, 
          quote.toToken, 
          parsedIntent.toChain
        )
        
        const swapDetails = `I can help you with that! Here's your swap quote:

💰 **Swap Details:**

• Swap **${quote.fromAmount} ${quote.fromToken}** ${amountInUsd} → **${quote.toAmount} ${quote.toToken}** ${amountOutUsd}
• From: ${parsedIntent.fromChain} → To: ${parsedIntent.toChain}
• Slippage: ${quote.slippage}%
• Receive at least: ${formattedMinAmountOut} ${quote.toToken}
• Estimated time: ${timeEstimate}

Do you want to proceed with the swap?`

        // Ensure the quote has chain information for execution
        const quoteWithChains = {
          ...quote,
          fromChain: parsedIntent.fromChain,
          toChain: parsedIntent.toChain,
          walletAddress: address
        }
        
        console.log('🔍 Created quote with chains:', quoteWithChains)
        
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: swapDetails,
          timestamp: new Date(),
          swapData: quoteWithChains,
          awaitingConfirmation: true
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: `I encountered an error while getting a quote: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your input.`,
          timestamp: new Date()
        }
      }
    }
    
    if (lowerInput.includes('price') || lowerInput.includes('rate')) {
      // Extract token names from price requests
      const priceMatch = userInput.match(/(?:price|rate|cost)\s+(?:of\s+)?(\w+)/i)
      if (priceMatch) {
        const token = priceMatch[1].toUpperCase()
        try {
          const price = await priceService.getTokenPrice(token)
          if (price) {
            return {
              id: Date.now().toString(),
              type: 'bot',
              content: `💰 Current price of ${token}: ${priceService.formatPrice(price)}`,
              timestamp: new Date()
            }
          } else {
            return {
              id: Date.now().toString(),
              type: 'bot',
              content: `❌ Sorry, I couldn't find the price for ${token}.\n\nPlease check the token symbol and try again.`,
              timestamp: new Date()
            }
          }
        } catch (error) {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: `❌ Error fetching price for ${token}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          }
        }
      } else {
        // If no specific token mentioned, show prices for common tokens
        try {
          const tokens = ['ETH', 'USDC', 'MATIC', 'SOL']
          const prices = await priceService.getTokenPrices(tokens)
          
          let priceList = "Here are the current prices:\n\n"
          for (const token of tokens) {
            const price = prices.get(token)
            if (price) {
              priceList += `• ${token}: ${priceService.formatPrice(price)}\n`
            }
          }
          priceList += "\nWould you like to swap any of these tokens?"
          
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: priceList,
            timestamp: new Date()
          }
        } catch (error) {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: "❌ Error fetching prices.\n\nPlease try asking for a specific token like 'What's the price of ETH?'",
            timestamp: new Date()
          }
        }
      }
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      try {
        // Get popular tokens for suggestions
        const popularTokens = await swapService.getPopularTokens(8)
        const availableChains = await tokenDiscoveryService.getAvailableBlockchains()
        
        const tokenSuggestions = popularTokens
          .map(token => `• ${token.symbol} on ${token.blockchain} ($${token.price})`)
          .join('\n')
        
        const helpMessage = `I can help you with:\n\n• **Swapping cryptocurrencies** across multiple chains\n• **Checking current prices** for any supported token\n• **Executing trades** with 1-click simplicity\n• **Providing market insights** and recommendations\n• **Monitoring swap status** and transaction progress\n\n**Popular tokens you can swap:**\n${tokenSuggestions}\n\n**Supported chains:** ${availableChains.slice(0, 10).join(', ')}${availableChains.length > 10 ? '...' : ''}\n\n**Example commands:**\n• "swap 0.1 ETH for USDC"\n• "swap 0.1 ETH on ethereum to USDC on arbitrum"\n• "0.1 BTC to USDT"\n• "What's the price of ETH?"\n• "status" (check your swap status)\n\nJust tell me what you'd like to do!`
        
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: helpMessage,
          timestamp: new Date()
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "I can help you with:\n\n• Swapping cryptocurrencies\n• Checking current prices\n• Executing trades with 1-click\n• Providing market insights\n• Managing your portfolio\n\nJust tell me what you'd like to do!",
          timestamp: new Date()
        }
      }
    }
    
    if (lowerInput.includes('test') || lowerInput.includes('token')) {
      try {
        const testResult = await testJWTToken()
        if (testResult.success) {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: "✅ JWT token test successful! Your token is working correctly. You can now perform real swaps.",
            timestamp: new Date()
          }
        } else {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: `❌ JWT token test failed: ${testResult.message}`,
            timestamp: new Date()
          }
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: `❌ JWT token test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      }
    }

    // Test token discovery service
    if (lowerInput.includes('discover') || lowerInput.includes('tokens')) {
      try {
        console.log('🧪 Testing token discovery service...')
        
        // Test 1: Get all tokens
        const allTokens = await tokenDiscoveryService.getAllTokens()
        console.log(`✅ Found ${allTokens.length} total tokens`)
        
        // Test 2: Get popular tokens
        const popularTokens = await tokenDiscoveryService.getPopularTokens(5)
        console.log(`✅ Found ${popularTokens.length} popular tokens`)
        
        // Test 3: Search for specific tokens
        const ethTokens = await tokenDiscoveryService.getTokensBySymbol('ETH')
        const usdcTokens = await tokenDiscoveryService.getTokensBySymbol('USDC')
        const btcTokens = await tokenDiscoveryService.getTokensBySymbol('BTC')
        
        // Test 4: Get available chains
        const chains = await tokenDiscoveryService.getAvailableBlockchains()
        
        // Test 5: Cache status
        const cacheStatus = tokenDiscoveryService.getCacheStatus()
        
        const testResults = `🧪 **Token Discovery Service Test Results:**

✅ **Total Tokens:** ${allTokens.length}
✅ **Popular Tokens:** ${popularTokens.length} (${popularTokens.map(t => t.symbol).join(', ')})
✅ **ETH Tokens:** ${ethTokens.length} (${ethTokens.map(t => `${t.symbol} on ${t.blockchain}`).join(', ')})
✅ **USDC Tokens:** ${usdcTokens.length} (${usdcTokens.map(t => `${t.symbol} on ${t.blockchain}`).join(', ')})
✅ **BTC Tokens:** ${btcTokens.length} (${btcTokens.map(t => `${t.symbol} on ${t.blockchain}`).join(', ')})
✅ **Available Chains:** ${chains.length} (${chains.slice(0, 10).join(', ')}${chains.length > 10 ? '...' : ''})
✅ **Cache Status:** ${cacheStatus.hasCache ? 'Active' : 'Empty'} (${cacheStatus.tokenCount} tokens, ${Math.round(cacheStatus.cacheAge / 1000)}s old)

🎉 **Token Discovery Service is working correctly!**`
        
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: testResults,
          timestamp: new Date()
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: `❌ Token discovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      }
    }

    // Test intent parser
    if (lowerInput.includes('parse') || lowerInput.includes('intent')) {
      try {
        console.log('🧪 Testing intent parser...')
        
        // Test cases
        const testCases = [
          'swap 0.1 ETH for USDC',
          'swap 0.1 ETH on ethereum to USDC on arbitrum',
          '0.1 BTC to USDT',
          'exchange 100 USDC from polygon to ethereum',
          'trade 50 MATIC for USDC'
        ]
        
        let testResults = '🧪 **Intent Parser Test Results:**\n\n'
        
        for (const testCase of testCases) {
          console.log(`Testing: "${testCase}"`)
          const intent = await intentParser.parseSwapIntent(testCase)
          
          if (intent) {
            testResults += `✅ **"${testCase}"**\n`
            testResults += `   From: ${intent.fromToken}${intent.fromChain ? ` on ${intent.fromChain}` : ''}\n`
            testResults += `   To: ${intent.toToken}${intent.toChain ? ` on ${intent.toChain}` : ''}\n`
            testResults += `   Amount: ${intent.amount}\n`
            testResults += `   Complete: ${intent.isComplete ? 'Yes' : 'No'}\n`
            testResults += `   Confidence: ${intent.confidence}\n`
            if (intent.missingInfo && intent.missingInfo.length > 0) {
              testResults += `   Missing: ${intent.missingInfo.join(', ')}\n`
            }
            testResults += '\n'
          } else {
            testResults += `❌ **"${testCase}"** - No intent detected\n\n`
          }
        }
        
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: testResults,
          timestamp: new Date()
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: `❌ Intent parser test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      }
    }

    // Search for tokens
    if (lowerInput.includes('search') || lowerInput.includes('find')) {
      const searchMatch = userInput.match(/(?:search|find)\s+(.+)/i)
      if (searchMatch) {
        const searchQuery = searchMatch[1].trim()
        try {
          const searchResults = await swapService.searchTokens(searchQuery)
          
          if (searchResults.length === 0) {
            return {
              id: Date.now().toString(),
              type: 'bot',
              content: `❌ No tokens found matching "${searchQuery}". Try searching for a different token or check the spelling.`,
              timestamp: new Date()
            }
          }
          
          // Group by symbol
          const groupedResults = new Map<string, any[]>()
          searchResults.forEach(token => {
            const symbol = token.symbol.toUpperCase()
            if (!groupedResults.has(symbol)) {
              groupedResults.set(symbol, [])
            }
            groupedResults.get(symbol)!.push(token)
          })
          
          let searchMessage = `🔍 **Search results for "${searchQuery}":**\n\n`
          
          groupedResults.forEach((tokens, symbol) => {
            searchMessage += `**${symbol}** (${tokens.length} chain${tokens.length > 1 ? 's' : ''}):\n`
            tokens.forEach(token => {
              searchMessage += `• ${token.blockchain} - $${token.price} (${token.assetId.substring(0, 20)}...)\n`
            })
            searchMessage += '\n'
          })
          
          searchMessage += `💡 **To swap, use:** "swap [amount] [TOKEN] on [chain] to [TOKEN] on [chain]"`
          
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: searchMessage,
            timestamp: new Date()
          }
        } catch (error) {
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: `❌ Error searching for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          }
        }
      }
    }

    // Test enhanced swap service
    if (lowerInput.includes('enhanced') || lowerInput === 'test swap') {
      try {
        console.log('🧪 Testing enhanced swap service...')
        
        // Test 1: Enhanced intent parsing
        const testIntent = await swapService.parseSwapIntentEnhanced('swap 0.1 ETH for USDC')
        console.log('Enhanced intent:', testIntent)
        
        // Test 2: Token discovery
        const ethChains = await swapService.getAvailableChainsForToken('ETH')
        const usdcChains = await swapService.getAvailableChainsForToken('USDC')
        const popularTokens = await swapService.getPopularTokens(5)
        
        // Test 3: Asset ID resolution
        let assetIdTest = '❌ Asset ID test failed'
        if (ethChains.length > 0 && usdcChains.length > 0) {
          try {
            const ethAssetId = await swapService.getAssetIdForTokenAndChain('ETH', ethChains[0])
            const usdcAssetId = await swapService.getAssetIdForTokenAndChain('USDC', usdcChains[0])
            assetIdTest = `✅ ETH on ${ethChains[0]}: ${ethAssetId.substring(0, 20)}...\n   USDC on ${usdcChains[0]}: ${usdcAssetId.substring(0, 20)}...`
          } catch (error) {
            assetIdTest = `❌ Asset ID resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
        
        const testResults = `🧪 **Enhanced Swap Service Test Results:**

✅ **Enhanced Intent Parsing:**
${testIntent ? `   From: ${testIntent.fromToken}${testIntent.fromChain ? ` on ${testIntent.fromChain}` : ''}\n   To: ${testIntent.toToken}${testIntent.toChain ? ` on ${testIntent.toChain}` : ''}\n   Complete: ${testIntent.isComplete ? 'Yes' : 'No'}` : '   ❌ No intent detected'}

✅ **Token Discovery:**
   ETH available on: ${ethChains.join(', ')}
   USDC available on: ${usdcChains.join(', ')}
   Popular tokens: ${popularTokens.map(t => `${t.symbol} on ${t.blockchain}`).join(', ')}

✅ **Asset ID Resolution:**
${assetIdTest}

🎉 **Enhanced Swap Service is working correctly!**`
        
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: testResults,
          timestamp: new Date()
        }
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: `❌ Enhanced swap service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
      }
    }
    
            return {
          id: Date.now().toString(),
          type: 'bot',
          content: "I understand you want to interact with the market. Could you please be more specific?\n\n**Popular swaps you can try:**\n• 'swap 0.1 ETH for USDC'\n• 'swap 0.01 BTC to USDT'\n• '0.1 ETH on ethereum to USDC on arbitrum'\n\n**Other commands:**\n• 'What's the price of ETH?'\n• 'search USDC' (to see available chains)\n• 'help' (for more options)",
          timestamp: new Date()
        }
  }



  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black border border-neon-500 rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="bg-black border-b border-neon-500 p-6">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Chat with Inti</h2>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[460px] overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-neon-400">
              <div className="w-2 h-2 bg-neon-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-neon-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-neon-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-sm">Inti is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>



        {/* Input */}
        <div className="border-t border-neon-500 p-6">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me what you want to do... (e.g., 'Swap 0.1 ETH for USDC')"
              className="flex-1 bg-gray-900 border border-neon-500 rounded-xl px-4 py-3 text-neon-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-neon-500 hover:bg-neon-600 disabled:bg-gray-600 text-black p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
