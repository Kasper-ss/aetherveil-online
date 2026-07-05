import type { Player, ProfessionId } from '@/types/game'

/** Two main professions — full skill tree and mythic upgrades. */
export const BASE_PROFESSION_SLOTS = 2
export const MAX_PROFESSION_SLOTS = 5

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

/** Profession rank from grind XP (0–30) */
export function getProfessionRank(exp: number): number {
  let rank = 0
  let total = 0
  let step = 80
  while (rank < 30) {
    if (total + step > exp) break
    total += step
    rank++
    step = Math.floor(80 + rank * 25)
  }
  return rank
}

export function getProfessionRankProgress(exp: number): { rank: number; intoRank: number; needed: number } {
  const rank = getProfessionRank(exp)
  let spent = 0
  let step = 80
  for (let r = 0; r < rank; r++) {
    spent += step
    step = Math.floor(80 + (r + 1) * 25)
  }
  const needed = Math.floor(80 + rank * 25)
  return { rank, intoRank: exp - spent, needed }
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
