import { useAccount, useBalance, useNetwork, useSwitchNetwork } from 'wagmi'
import { useMemo } from 'react'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  
  const { data: balance } = useBalance({
    address,
    watch: true,
  })

  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address])

  const isSupportedChain = useMemo(() => {
    if (!chain) return false
    const supportedChainIds = [1, 137, 42161, 10] // Ethereum, Polygon, Arbitrum, Optimism
    return supportedChainIds.includes(chain.id)
  }, [chain])

  return {
    address,
    shortAddress,
    isConnected,
    isConnecting,
    chain,
    balance,
    isSupportedChain,
    switchNetwork,
  }
}
