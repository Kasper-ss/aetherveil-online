import type { Player, ProfessionId, EquipSlot } from '@/types/game'
import { PROFESSIONS, MYTHIC_SKILLS } from '@/data/classes'

const ARMOR_SLOTS: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots']
const ACCESSORY_SLOTS: EquipSlot[] = ['necklace', 'ring']

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

export function getProfessionMythicSkillLevel(
  player: Player,
  professionId: ProfessionId,
  skillId: string,
): number {
  const skills = MYTHIC_SKILLS[professionId]
  if (!skills) return 0
  const idx = skills.findIndex((s) => s.id === skillId)
  if (idx < 0) return 0
  return player.professionMythicLevels?.[professionId]?.[idx] ?? 0
}

/** Passive profession bonuses on equipped item stats (shown on hub / used in combat). */
export function getEquipmentStatMultiplier(
  player: Player,
  slot: EquipSlot,
): { atk: number; def: number; hp: number; crit: number; speed: number; stealth: number } {
  let mult = 1 + getProfessionSkillLevel(player, 'blacksmith', 'bs_10') * 0.05

  if (ACCESSORY_SLOTS.includes(slot)) {
    mult *=
      1
      + getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
      + getProfessionSkillLevel(player, 'jeweler', 'jw_10') * 0.10
      + getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m1') * 0.08
  }

  let atkMult = mult
  let defMult = mult
  let critMult = mult

  if (slot === 'weapon') {
    atkMult += getProfessionSkillLevel(player, 'blacksmith', 'bs_1') * 0.02
    atkMult += getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m1') * 0.05
    critMult += getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m3') * 0.08
  }

  if (ARMOR_SLOTS.includes(slot)) {
    defMult += getProfessionSkillLevel(player, 'blacksmith', 'bs_4') * 0.02
    defMult += getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m4') * 0.06
  }

  if (ACCESSORY_SLOTS.includes(slot)) {
    defMult += getProfessionSkillLevel(player, 'sorcerer', 'sc_8') * 0.02
  }

  return { atk: atkMult, def: defMult, hp: mult, crit: critMult, speed: mult, stealth: mult }
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
