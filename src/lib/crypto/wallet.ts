import { FEATURES } from '@/lib/featureFlags'
import type { SupportedChainId, WalletConnection } from '@/lib/crypto/types'

export class CryptoNotEnabledError extends Error {
  constructor() {
    super('Crypto payments are not enabled yet')
    this.name = 'CryptoNotEnabledError'
  }
}

/**
 * Connect TON / other wallet (TonConnect, WalletConnect, etc.).
 * TODO: integrate @tonconnect/ui-react or chain-specific SDK.
 */
export async function connectWallet(_chainId: SupportedChainId): Promise<WalletConnection> {
  if (!FEATURES.cryptoPayments) throw new CryptoNotEnabledError()
  throw new Error('connectWallet not implemented')
}

export async function disconnectWallet(_address: string): Promise<void> {
  if (!FEATURES.cryptoPayments) throw new CryptoNotEnabledError()
}

export async function getConnectedWallets(): Promise<WalletConnection[]> {
  if (!FEATURES.cryptoPayments) return []
  return []
}
