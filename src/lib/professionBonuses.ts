import type { Player, ProfessionId } from '@/types/game'
import { PROFESSIONS } from '@/data/classes'

export function getProfessionSkillLevel(
  player: Player,
  professionId: ProfessionId,
  skillId: string,
): number {
  const prof = PROFESSIONS.find((p) => p.id === professionId)
  if (!prof) return 0
  const idx = prof.skills.findIndex((s) => s.id === skillId)
  if (idx < 0) return 0
  return player.professionLevels?.[professionId]?.[idx] ?? 0
}

/** Урон по слабому месту: требует hn_7 (Знание монстров) уровень 1+. */
export function canUseWeakSpot(player: Player): boolean {
  return getProfessionSkillLevel(player, 'hunter', 'hn_7') >= 1
}

export function getWeakSpotDamageMultiplier(player: Player): number {
  const lvl = getProfessionSkillLevel(player, 'hunter', 'hn_7')
  if (lvl <= 0) return 1
  return 1.35 + lvl * 0.08
}

export function hasSupremeEnchantments(player: Player): boolean {
  return getProfessionSkillLevel(player, 'sorcerer', 'sc_9') >= 1
}

export function isHerbalismActive(player: Player): boolean {
  return (player.activeProfessions ?? []).includes('alchemist')
}
