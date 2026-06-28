import { FEATURES } from '@/lib/featureFlags'
import type { NftItemMetadata } from '@/lib/crypto/types'

/**
 * Bridge on-chain NFT metadata into game items.
 * TODO: verify ownership via indexer / contract read, then mint Player.inventory item.
 */
export async function fetchPlayerNfts(_walletAddress: string): Promise<NftItemMetadata[]> {
  if (!FEATURES.cryptoPayments) return []
  return []
}

export async function redeemNftToInventory(
  _playerId: number,
  _nft: NftItemMetadata,
): Promise<boolean> {
  if (!FEATURES.cryptoPayments) return false
  return false
}
