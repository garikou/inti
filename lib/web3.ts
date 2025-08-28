import { createConfig, configureChains } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { OpenAPI, QuoteRequest, OneClickService } from '@defuse-protocol/one-click-sdk-typescript'

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, arbitrum, optimism],
  [publicProvider()]
)

// Set up wagmi config
const { connectors } = getDefaultWallets({
  appName: 'Inti Swap Chatbot',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains,
})

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

// Initialize 1Click SDK
export function initializeOneClickSDK() {
  OpenAPI.BASE = process.env.NEXT_PUBLIC_1CLICK_API_URL || 'https://1click.chaindefuser.com'
  
  // Set JWT token - you'll need to get this from the form mentioned in the SDK docs
  // https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform
  OpenAPI.TOKEN = process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN || 'your-jwt-token'
}

// Supported chains configuration
export const supportedChains = [
  {
    id: 1,
    name: 'Ethereum',
    network: 'ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'] } },
  },
  {
    id: 137,
    name: 'Polygon',
    network: 'polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com'] } },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    network: 'arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'] } },
  },
  {
    id: 10,
    name: 'Optimism',
    network: 'optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io'] } },
  },
]

// Token configuration for 1Click SDK
export const supportedTokens = {
  'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chain: 'arbitrum',
    address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
  },
  'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chain: 'solana',
    address: '5ce3bf3a31af18be40ba30f721101b4341690186'
  },
  'nep141:eth-0xa0b86a33e6441b8c4c8c0b8c4c8c0b8c4c8c0b8c.omft.near': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chain: 'ethereum',
    address: '0xa0b86a33e6441b8c4c8c0b8c4c8c0b8c4c8c0b8c'
  }
}

// Initialize SDK on module load
if (typeof window !== 'undefined') {
  initializeOneClickSDK()
}
