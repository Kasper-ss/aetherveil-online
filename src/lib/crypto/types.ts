/**
 * Web3 / crypto integration types (TON, other EVM chains, etc.).
 * Not wired to UI yet — implement adapters in wallet.ts and purchases.ts.
 */

export type SupportedChainId = 'ton' | 'ton-testnet' | 'ethereum' | 'polygon'

export interface WalletConnection {
  chainId: SupportedChainId
  address: string
  /** Raw provider id, e.g. tonconnect, metamask */
  providerId: string
  connectedAt: string
}

export interface CryptoPriceQuote {
  sku: string
  chainId: SupportedChainId
  /** Human-readable amount in native token, e.g. "1.5 TON" */
  displayAmount: string
  /** Smallest units as string for exact comparison */
  atomicAmount: string
  expiresAt: string
}

export interface CryptoPurchaseReceipt {
  txHash: string
  chainId: SupportedChainId
  sku: string
  playerId: number
  fulfilledAt: string
}

/** Future: on-chain or off-chain metadata for cosmetic / equipment NFTs */
export interface NftItemMetadata {
  tokenId: string
  contractAddress: string
  chainId: SupportedChainId
  name: string
  imageUrl?: string
  /** Maps to in-game item template id when bridged */
  gameItemId?: string
  attributes?: Record<string, string | number>
}

export interface PlayerCryptoState {
  wallets: WalletConnection[]
  /** NFT inventory not yet mirrored to Player.inventory */
  pendingNfts?: NftItemMetadata[]
}
