'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { WalletConnect } from '@/components/wallet/WalletConnect'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'

export default function Home() {
  const { isConnected } = useAccount()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const rotatingWords = ['crosschain', 'ai-powered', 'intent-based']

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length)
        setIsTransitioning(false)
      }, 400) // Fade out duration
    }, 3000) // Change word every 2 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-cyber">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section - Only show when not connected */}
          {!isConnected && (
            <div className="text-center mb-12">
              <div className="text-2xl md:text-6xl text-white font-semibold leading-none mb-8">
                <div>Meet your{' '}
                  <span className={`text-neon-400 font-bold transition-all duration-300 inline-block w-96 text-left ${
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}>
                    {rotatingWords[currentWordIndex]}
                  </span>
                </div>
                <div>swap assistant.</div>
              </div>
              <p className="text-xl text-white max-w-2xl mx-auto">
                Effortless, gas-free and secure swaps across multiple chains.
              </p>
            </div>
          )}

          {/* Wallet Connection */}
          {!isConnected && (
            <div className="mb-8">
              <WalletConnect onConnect={() => {}} />
            </div>
          )}

          {/* Chat Interface */}
          {isConnected && (
            <div className="animate-fade-in">
              <ChatInterface />
            </div>
          )}

          {/* Features Section */}
          {!isConnected && (
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-black border border-neon-500 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-neon-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neon-400">Natural Language</h3>
                <p className="text-neon-300">
                  Simply tell the chatbot what you want to do in plain English
                </p>
              </div>

              <div className="bg-black border border-neon-500 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-neon-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neon-400">1-Click Execution</h3>
                <p className="text-neon-300">
                  Execute trades instantly with our streamlined SDK integration
                </p>
              </div>

              <div className="bg-black border border-neon-500 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-neon-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neon-400">Secure & Fast</h3>
                <p className="text-neon-300">
                  Built with enterprise-grade security and lightning-fast execution
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
