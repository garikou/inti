'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/web3'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={[mainnet, polygon, arbitrum, optimism]}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
