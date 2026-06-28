import type { SupportedChainId } from '@/lib/crypto/types'

/**
 * Chain and merchant configuration placeholders.
 * Replace with env vars / server-side secrets before production crypto checkout.
 */
export const CRYPTO_CONFIG = {
  /** Primary chain for Telegram Mini App (TON is typical) */
  defaultChain: 'ton' as SupportedChainId,

  ton: {
    manifestUrl: '', // TonConnect manifest URL
    merchantWallet: '', // Treasury address for in-game purchases
  },

  /** SKUs that could be sold for crypto — mirror starShop / gem packs later */
  productSkus: {
    gems_100: { gems: 100, labelRu: '100 кристаллов' },
    gems_500: { gems: 500, labelRu: '500 кристаллов' },
    battle_pass: { labelRu: 'Боевой пропуск (будущее)' },
  },
} as const
