'use client'

import { SparklesIcon, UserIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  swapData?: any
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === 'bot'
  
  // Function to format message content with markdown-style formatting
  const formatMessageContent = (content: string) => {
    // Replace **text** with bold styling and preserve line breaks
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    return (
      <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
    )
  }
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
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
          
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {formatMessageContent(message.content)}
          </div>
          

          
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
