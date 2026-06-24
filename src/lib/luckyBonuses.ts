import type { Player } from '@/types/game'

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

const PIECE_GOLD = 0.04
const PIECE_EXP = 0.04
const PIECE_LOOT = 0.03
const FULL_GOLD = 0.15
const FULL_EXP = 0.15
const FULL_LOOT = 0.10

function isLuckySetId(setId?: string): boolean {
  return !!setId?.startsWith('lucky_')
}

export function getLuckyMultipliers(player: Player): { gold: number; exp: number; loot: number } {
  let goldPct = 0
  let expPct = 0
  let lootPct = 0
  let luckyPieces = 0

  for (const slot of EQUIP_SLOTS) {
    const item = player.equipped[slot]
    if (!item || !isLuckySetId(item.setId)) continue
    luckyPieces++
    goldPct += PIECE_GOLD
    expPct += PIECE_EXP
    lootPct += PIECE_LOOT
  }

  if (luckyPieces >= 7) {
    goldPct += FULL_GOLD
    expPct += FULL_EXP
    lootPct += FULL_LOOT
  }

  return {
    gold: 1 + goldPct,
    exp: 1 + expPct,
    loot: 1 + lootPct,
  }
}

export function getLuckyPieceCount(player: Player): number {
  return EQUIP_SLOTS.filter((s) => isLuckySetId(player.equipped[s]?.setId)).length
}
