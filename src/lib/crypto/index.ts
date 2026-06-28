/**
 * Crypto / Web3 integration layer (future).
 *
 * Planned capabilities:
 * - Wallet connect (TON via TonConnect, optional EVM)
 * - In-game purchases settled in on-chain tokens
 * - NFT cosmetics / equipment bridged into Player.inventory
 *
 * Enable FEATURES.cryptoPayments in src/lib/featureFlags.ts, then:
 * 1. Fill CRYPTO_CONFIG (manifest, treasury addresses)
 * 2. Implement wallet.ts + server verify endpoints
 * 3. Add route to CryptoPage when UI is ready
 *
 * Player save field suggestion: player.cryptoState?: PlayerCryptoState
 */

export { FEATURES } from '@/lib/featureFlags'
export { CRYPTO_CONFIG } from '@/lib/crypto/config'
export type {
  WalletConnection,
  CryptoPriceQuote,
  CryptoPurchaseReceipt,
  NftItemMetadata,
  PlayerCryptoState,
  SupportedChainId,
} from '@/lib/crypto/types'
export {
  connectWallet,
  disconnectWallet,
  getConnectedWallets,
  CryptoNotEnabledError,
} from '@/lib/crypto/wallet'
export { fetchCryptoQuote, fulfillCryptoPurchase } from '@/lib/crypto/purchases'
export { fetchPlayerNfts, redeemNftToInventory } from '@/lib/crypto/nft'
