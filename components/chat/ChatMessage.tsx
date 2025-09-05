'use client'

import { SparklesIcon, UserIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  swapData?: any
  awaitingConfirmation?: boolean
  awaitingDeposit?: boolean
  depositAddress?: string
  monitoring?: boolean
}

interface ChatMessageProps {
  message: Message
  onButtonClick?: (action: string, messageId: string) => void
}

export function ChatMessage({ message, onButtonClick }: ChatMessageProps) {
  const isBot = message.type === 'bot'
  
  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Function to format message content with React components instead of dangerouslySetInnerHTML
  const formatMessageContent = (content: string) => {
    // Find all addresses/hashes in the content
    const addressMatch = content.match(/(0x[a-fA-F0-9]{40,})/g)
    
    if (!addressMatch) {
      // No addresses found, just format markdown
      const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      return (
        <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
      )
    }
    
    // Split content by addresses and create React elements
    let parts: (string | JSX.Element)[] = [content]
    addressMatch.forEach(address => {
      parts = parts.flatMap(part => {
        if (typeof part === 'string') {
          const splitParts = part.split(address)
          const result: (string | JSX.Element)[] = []
          for (let i = 0; i < splitParts.length; i++) {
            if (i > 0) {
              result.push(
                <div key={`${address}-${i}`} className="flex items-center w-full min-w-0">
                  <span className="break-all font-mono text-sm">{address}</span>
                  <button 
                    onClick={() => copyToClipboard(address)}
                    className="inline-flex items-center justify-center ml-2 text-neon-300 hover:text-neon-200 transition-colors align-middle group flex-shrink-0"
                  >
                    <svg className="w-4 h-4 group-hover:fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              )
            }
            if (splitParts[i]) {
              const formattedPart = splitParts[i]
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
              result.push(
                <span key={`text-${i}`} dangerouslySetInnerHTML={{ __html: formattedPart }} />
              )
            }
          }
          return result
        }
        return [part]
      })
    })
    
    return <>{parts}</>
  }
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex items-start space-x-3 ${isBot ? 'max-w-[90%] sm:max-w-[85%]' : 'max-w-[85%]'} ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot 
            ? 'bg-gray-600' 
            : 'bg-gray-600'
        }`}>
          {isBot ? (
            <img src="/inti-logo.png" alt="Inti Robot" className="w-6 h-6" />
          ) : (
            <UserIcon className="w-4 h-4 text-white" />
          )}
        </div>
        
        {/* Message Content */}
        <div className={`relative rounded-2xl px-4 py-3 ${
          isBot 
            ? 'bg-gray-900 text-neon-300' 
            : 'bg-neon-500 text-black'
        }`}>
          {/* Chat bubble spike */}
          <div className={`absolute top-3 w-0 h-0 ${
            isBot 
              ? '-left-2 border-r-8 border-r-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent' 
              : '-right-2 border-l-8 border-l-neon-500 border-t-4 border-t-transparent border-b-4 border-b-transparent'
          }`}></div>
          
          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
            {formatMessageContent(message.content)}
          </div>
          
          {/* Interactive Buttons */}
          {isBot && message.awaitingConfirmation && (
            <div className="flex flex-col space-y-2 mt-4">
              <button
                onClick={() => onButtonClick?.('confirm', message.id)}
                className="border border-neon-300 text-neon-300 hover:bg-neon-300 hover:text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ✅ Confirm Swap
              </button>
              <button
                onClick={() => onButtonClick?.('cancel', message.id)}
                className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ❌ Cancel
              </button>
            </div>
          )}
          
          {isBot && message.awaitingDeposit && (
            <div className="flex flex-col space-y-2 mt-4">
              <button
                onClick={() => onButtonClick?.('sent', message.id)}
                className="border border-neon-300 text-neon-300 hover:bg-neon-300 hover:text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                💰 I sent {message.swapData?.fromAmount} {message.swapData?.fromToken}
              </button>
              <button
                onClick={() => onButtonClick?.('submit_tx', message.id)}
                className="border border-white text-white hover:bg-white hover:text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📝 Submit tx hash
              </button>
              <button
                onClick={() => onButtonClick?.('cancel_deposit', message.id)}
                className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ❌ Cancel Swap
              </button>
            </div>
          )}
          
          {/* Monitoring buttons - always show Cancel and Submit during monitoring */}
          {isBot && message.monitoring && (
            <div className="flex flex-col space-y-2 mt-4">
              <div className="text-sm text-gray-500 mb-2">
                🔄 Monitoring swap status<span className="animate-pulse">...</span>
              </div>
              <button
                onClick={() => onButtonClick?.('submit_tx', message.id)}
                className="border border-white text-white hover:bg-white hover:text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📝 Submit tx hash
              </button>
              <button
                onClick={() => onButtonClick?.('cancel_deposit', message.id)}
                className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ❌ Cancel Swap
              </button>
            </div>
          )}
          
          {/* Timestamp */}
          <div className={`text-xs mt-2 ${
            isBot 
              ? 'text-gray-500' 
              : 'text-black/70'
          }`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
