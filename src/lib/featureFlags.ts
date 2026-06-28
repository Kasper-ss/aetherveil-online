/**
 * Central feature toggles. Flip flags here when enabling work-in-progress systems.
 */
export const FEATURES = {
  /** PvP arena — disabled until matchmaking and balance are ready */
  pvpArena: false,
  /** On-chain wallets, crypto checkout, NFT items — see src/lib/crypto */
  cryptoPayments: false,
} as const
