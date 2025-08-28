'use client'

import { useWallet } from '@/hooks/useWallet'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { WalletIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function WalletStatus() {
  const { isConnected, chain, isSupportedChain, shortAddress, balance } = useWallet()

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <WalletIcon className="w-5 h-5 text-neon-400" />
        <span className="text-sm text-neon-400">Not connected</span>
        <ConnectButton />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Chain Status */}
      {!isSupportedChain && (
        <div className="flex items-center space-x-1 text-amber-400">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span className="text-xs">Unsupported chain</span>
        </div>
      )}

      {/* Connect Button for account management */}
      <ConnectButton />
    </div>
  )
}
