import { FEATURES } from '@/lib/featureFlags'
import type { CryptoPriceQuote, CryptoPurchaseReceipt, SupportedChainId } from '@/lib/crypto/types'

/**
 * Request a price quote from backend before showing checkout.
 * TODO: POST /api/crypto/quote { sku, chainId, playerId }
 */
export async function fetchCryptoQuote(
  _sku: string,
  _chainId: SupportedChainId,
): Promise<CryptoPriceQuote | null> {
  if (!FEATURES.cryptoPayments) return null
  return null
}

/**
 * Submit signed transaction hash for server verification and in-game fulfillment.
 * TODO: POST /api/crypto/fulfill { txHash, sku, playerId }
 */
export async function fulfillCryptoPurchase(
  _txHash: string,
  _sku: string,
): Promise<CryptoPurchaseReceipt | null> {
  if (!FEATURES.cryptoPayments) return null
  return null
}
