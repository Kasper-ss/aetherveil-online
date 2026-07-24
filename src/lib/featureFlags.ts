/**
 * Central feature toggles. Flip flags here when enabling work-in-progress systems.
 */
export const FEATURES = {
  /** PvP arena — matchmaking and gold steal */
  pvpArena: true,
  /** On-chain wallets, crypto checkout, NFT items — see src/lib/crypto */
  cryptoPayments: false,
} as const
