import type { Player, ProfessionId } from '@/types/game'

/** Three main professions — full skill tree and mythic upgrades. */
export const BASE_PROFESSION_SLOTS = 3
export const MAX_PROFESSION_SLOTS = 5
export const MAX_PROFESSION_RANK = 30

export function getProfessionSlotLimit(player: Player): number {
  return Math.min(MAX_PROFESSION_SLOTS, player.professionSlotLimit ?? BASE_PROFESSION_SLOTS)
}

export function getActiveProfessions(player: Player): ProfessionId[] {
  if (player.activeProfessions?.length) return player.activeProfessions.slice(0, getProfessionSlotLimit(player))
  if (player.profession) return [player.profession]
  return []
}

export function isProfessionActive(player: Player, id: ProfessionId): boolean {
  return getActiveProfessions(player).includes(id)
}

/** Main (active) profession — full skill tree. */
export function isMainProfession(player: Player, id: ProfessionId): boolean {
  return isProfessionActive(player, id)
}

/** Any profession can be used for activities; main slots only gate full skill progression. */
export function canUseProfession(_player: Player, _id: ProfessionId): boolean {
  return true
}

export function getProfessionExp(player: Player, id: ProfessionId): number {
  return player.professionExp?.[id] ?? 0
}

/** XP to unlock grind location tier (1 = always open). Low tiers cheap, high tiers costly. */
export function getGrindLocationXpToUnlock(level: number): number {
  if (level <= 1) return 0
  return Math.floor(28 * Math.pow(level - 1, 1.5) + (level - 1) * 20)
}

/** XP threshold to unlock mine / herb field tier — early levels cheap, later levels expensive. */
export function getMineHerbUnlockXp(level: number): number {
  if (level <= 1) return 0
  return Math.floor(25 * Math.pow(level - 1, 2) + (level - 1) * 18)
}

/** XP per mine dig or herb gather — grows with location tier. */
export function getMineHerbXpGain(locationLevel: number): number {
  return Math.max(2, Math.floor(2 + locationLevel * 1.35 + Math.pow(locationLevel, 1.22) * 0.85))
}

export function getMineHerbTierProgress(
  totalXp: number,
  unlockedLevel: number,
  maxLevel: number,
): { nextLevel: number | null; xpIntoTier: number; xpNeededForNext: number; progressPct: number } {
  const currentThreshold = getMineHerbUnlockXp(unlockedLevel)
  const nextLevel = unlockedLevel < maxLevel ? unlockedLevel + 1 : null
  if (!nextLevel) {
    return { nextLevel: null, xpIntoTier: 0, xpNeededForNext: 0, progressPct: 100 }
  }
  const nextThreshold = getMineHerbUnlockXp(nextLevel)
  const xpIntoTier = Math.max(0, totalXp - currentThreshold)
  const xpNeededForNext = Math.max(1, nextThreshold - currentThreshold)
  return {
    nextLevel,
    xpIntoTier,
    xpNeededForNext,
    progressPct: Math.min(100, (xpIntoTier / xpNeededForNext) * 100),
  }
}

/** Profession / location XP per one gather action — grows with location tier. */
export function getGrindProfessionXp(grindLevel: number): number {
  return Math.max(1, Math.floor(2 + grindLevel * 1.5 + Math.pow(grindLevel, 1.12) * 0.9))
}

/** XP required to advance from rank → rank+1. */
export function getProfessionRankXpRequired(rank: number): number {
  if (rank >= MAX_PROFESSION_RANK) return 0
  if (rank <= 0) return 18
  return Math.floor(18 + rank * 7 + Math.pow(rank, 1.42) * 5)
}

/** Profession rank from grind XP (0–30). */
export function getProfessionRank(exp: number): number {
  let rank = 0
  let total = 0
  while (rank < MAX_PROFESSION_RANK) {
    const step = getProfessionRankXpRequired(rank)
    if (total + step > exp) break
    total += step
    rank++
  }
  return rank
}

export function getProfessionRankProgress(exp: number): { rank: number; intoRank: number; needed: number } {
  const rank = getProfessionRank(exp)
  let spent = 0
  for (let r = 0; r < rank; r++) {
    spent += getProfessionRankXpRequired(r)
  }
  const needed = getProfessionRankXpRequired(rank)
  return { rank, intoRank: exp - spent, needed: needed || 1 }
}

export function professionRankRequiredForSkill(skillIndex: number): number {
  return skillIndex + 1
}

/** Inactive professions: only skill 0. Skills 1+ and mythic require a main slot. */
export function canUpgradeProfessionSkill(
  player: Player,
  professionId: ProfessionId,
  skillIndex: number,
): boolean {
  if (skillIndex === 0) return true
  return isMainProfession(player, professionId)
}

export function canUpgradeProfessionMythicSkill(player: Player, professionId: ProfessionId): boolean {
  return isMainProfession(player, professionId)
}
