'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAccount } from 'wagmi'
import { ChatMessage } from './ChatMessage'
import { swapService, SwapQuote, SwapRequest } from '@/lib/swapService'
import { testJWTToken } from '@/lib/testToken'
import { priceService } from '@/lib/priceService'

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
    if (pendingSwapMessage && pendingSwapMessage.swapData) {
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
          
          return {
            id: Date.now().toString(),
            type: 'bot',
            content: depositInfo,
            timestamp: new Date()
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

    // Handle deposit transaction submission
    const submitTxMatch = userInput.match(/submit\s+tx\s+([a-fA-F0-9x]+)/i)
    if (submitTxMatch) {
      const txHash = submitTxMatch[1]
      const pendingSwapMessage = currentMessages.find(m => m.swapData && m.swapData.depositAddress)
      
      if (pendingSwapMessage && pendingSwapMessage.swapData) {
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
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "❌ No pending swap found. Please start a new swap first, then submit your transaction hash.",
          timestamp: new Date()
        }
      }
    }

    // Try to parse swap intent
    const swapRequest = swapService.parseSwapIntent(userInput)

    if (swapRequest) {
      // Add wallet address to the swap request if connected
      if (isConnected && address) {
        swapRequest.walletAddress = address
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
              fromToken: swapRequest.fromToken,
              toToken: swapRequest.toToken,
              fromAmount: swapRequest.amount,
              toAmount: '0', // Will be calculated when token is configured
              slippage: swapRequest.slippage || 1,
              gasEstimate: '0',
              depositAddress: undefined,
              depositAsset: undefined,
              depositChain: undefined,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending'
            }
          }
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
        
        const amountInUsd = formatUSD(quote.amountInUsd, false)
        const amountOutUsd = formatUSD(quote.amountOutUsd, true)
        
        const swapDetails = `I can help you with that! Here's your swap quote:

💰 **Swap Details:**

• Swap **${quote.fromAmount} ${quote.fromToken}** ${amountInUsd} → **${quote.toAmount} ${quote.toToken}** ${amountOutUsd}
• Slippage: ${quote.slippage}%
• Receive at least: ${quote.minAmountOut || quote.toAmount} ${quote.toToken}
• Estimated time: ${timeEstimate}

Do you want to proceed with the swap?`

        return {
          id: Date.now().toString(),
          type: 'bot',
          content: swapDetails,
          timestamp: new Date(),
          swapData: quote,
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
      return {
        id: Date.now().toString(),
        type: 'bot',
        content: "I can help you with:\n\n• Swapping cryptocurrencies\n• Checking current prices\n• Executing trades with 1-click\n• Providing market insights\n• Managing your portfolio\n\nJust tell me what you'd like to do!",
        timestamp: new Date()
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
    
            return {
          id: Date.now().toString(),
          type: 'bot',
          content: "I understand you want to interact with the market. Could you please be more specific?\n\nFor example, you could say:\n• 'Swap 0.1 ETH for USDC'\n• 'What's the current price of Bitcoin?'\n• 'Check price of ETH'",
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
