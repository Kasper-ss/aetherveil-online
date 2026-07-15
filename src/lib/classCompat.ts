import type { PlayerClass } from '@/types/game'

/** Legacy bucket for set bonuses, kitchen food, lucky sets. */
export type LegacyClassBucket = 'warrior' | 'archer' | 'mage' | 'summoner' | 'assassin' | 'knight'

const CLASS_TO_LEGACY: Record<PlayerClass, LegacyClassBucket> = {
  warrior: 'warrior',
  paladin: 'knight',
  hunter: 'archer',
  rogue: 'assassin',
  priest: 'summoner',
  shaman: 'mage',
  mage: 'mage',
  warlock: 'mage',
  druid: 'summoner',
  monk: 'assassin',
}

const OLD_CLASS_IDS: Record<string, PlayerClass> = {
  archer: 'hunter',
  assassin: 'rogue',
  knight: 'paladin',
  summoner: 'priest',
}

export function normalizeClassId(classId: string | undefined): PlayerClass | undefined {
  if (!classId) return undefined
  if (classId in CLASS_TO_LEGACY) return classId as PlayerClass
  return OLD_CLASS_IDS[classId]
}

export function getLegacyClassBucket(classId: PlayerClass | undefined): LegacyClassBucket | null {
  if (!classId) return null
  const normalized = normalizeClassId(classId)
  if (!normalized) return null
  return CLASS_TO_LEGACY[normalized]
}

export function isHighCritClass(classId: PlayerClass | undefined): boolean {
  return getMaxCritChanceForClass(classId) >= 80
}

const CRIT_CAP_BY_BUCKET: Record<LegacyClassBucket, number> = {
  archer: 80,
  assassin: 80,
  warrior: 45,
  mage: 45,
  summoner: 50,
  knight: 40,
}

const DODGE_CAP_BY_BUCKET: Record<LegacyClassBucket, number> = {
  archer: 0.55,
  assassin: 0.60,
  warrior: 0.35,
  mage: 0.30,
  summoner: 0.40,
  knight: 0.45,
}

export function getMaxCritChanceForClass(classId?: PlayerClass): number {
  const bucket = getLegacyClassBucket(classId)
  if (!bucket) return 45
  return CRIT_CAP_BY_BUCKET[bucket]
}

export function getMaxDodgeChanceForClass(classId?: PlayerClass): number {
  const bucket = getLegacyClassBucket(classId)
  if (!bucket) return 0.35
  return DODGE_CAP_BY_BUCKET[bucket]
}

export function isManaClass(classId: PlayerClass | undefined): boolean {
  if (!classId) return false
  const n = normalizeClassId(classId)!
  return n === 'mage' || n === 'warlock' || n === 'priest' || n === 'shaman'
}

export function usesPetClass(classId: PlayerClass | undefined): boolean {
  return normalizeClassId(classId) === 'hunter'
}
