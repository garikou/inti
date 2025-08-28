'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { WalletIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface WalletConnectProps {
  onConnect: () => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()

  // If already connected, trigger the onConnect callback
  if (isConnected && address) {
    // Use a small delay to ensure the connection is fully established
    setTimeout(() => onConnect(), 100)
  }

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="max-w-md w-full">
        <div className="bg-black border border-neon-500 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-neon-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <WalletIcon className="w-8 h-8 text-black" />
          </div>
          
          <h2 className="text-2xl font-bold text-neon-400 mb-4">
            Connect Your Wallet
          </h2>
          
          <p className="text-neon-300 mb-8">
            Connect your wallet to start trading with Inti. We support MetaMask, WalletConnect, and other popular wallets.
          </p>
          
          {/* RainbowKit Connect Button */}
          <div className="mb-6 flex justify-center">
            <ConnectButton 
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
          
          <div className="mt-6 text-sm text-neon-400">
            <p>By connecting, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  )
}
