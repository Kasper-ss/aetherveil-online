import type { Player } from '@/types/game'

const SET_PIECES_REQUIRED = 7
const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon'] as const

export function countEquippedSetPieces(player: Player, setId: string): number {
  let count = 0
  for (const slot of EQUIP_SLOTS) {
    if (player.equipped[slot]?.setId === setId) count++
  }
  return count
}

export function hasFullSet(player: Player, setId: string): boolean {
  return countEquippedSetPieces(player, setId) >= SET_PIECES_REQUIRED
}

export interface SetCombatEffects {
  critChanceMult: number
  stealthDamageMult: number
  singleTargetDamageMult: number
  energyRegenMult: number
  fearOnHitChance: number
}

const NEUTRAL: SetCombatEffects = {
  critChanceMult: 1,
  stealthDamageMult: 1,
  singleTargetDamageMult: 1,
  energyRegenMult: 1,
  fearOnHitChance: 0,
}

export function getSetCombatEffects(player: Player): SetCombatEffects {
  const effects = { ...NEUTRAL }
  if (hasFullSet(player, 'assassin')) {
    effects.critChanceMult = 1.35
    effects.stealthDamageMult = 1.2
  }
  if (hasFullSet(player, 'penivise')) {
    effects.singleTargetDamageMult = 1.5
    effects.energyRegenMult = 1.25
    effects.fearOnHitChance = 0.22
  }
  return effects
}

export function applySetDamageMultipliers(
  baseDamage: number,
  stats: { stealth: number },
  effects: SetCombatEffects,
): number {
  let dmg = baseDamage
  if (effects.stealthDamageMult > 1 && stats.stealth > 0) {
    dmg = Math.floor(dmg * effects.stealthDamageMult)
  }
  if (effects.singleTargetDamageMult > 1) {
    dmg = Math.floor(dmg * effects.singleTargetDamageMult)
  }
  return Math.max(1, dmg)
}
