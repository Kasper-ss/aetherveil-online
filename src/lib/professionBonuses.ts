import type { Player, ProfessionId, EquipSlot, Skill } from '@/types/game'
import { PROFESSIONS, MYTHIC_SKILLS } from '@/data/classes'
import { getScaledSkill } from '@/data/playerSkills'
import type { SkillDebuffType } from '@/lib/skillDebuffs'

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

export function getProfessionSkillLevelByIndex(
  player: Player,
  professionId: ProfessionId,
  skillIndex: number,
): number {
  return player.professionLevels?.[professionId]?.[skillIndex] ?? 0
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

export interface ProfStatMult {
  atk: number
  def: number
  hp: number
  crit: number
  speed: number
  stealth: number
}

export interface ProfEquipModifiers {
  mult: ProfStatMult
  flat: ProfStatMult
}

function emptyMult(): ProfStatMult {
  return { atk: 1, def: 1, hp: 1, crit: 1, speed: 1, stealth: 1 }
}

function emptyFlat(): ProfStatMult {
  return { atk: 0, def: 0, hp: 0, crit: 0, speed: 0, stealth: 0 }
}

/** Passive profession bonuses on equipped item stats (combat + hub). */
export function getEquipmentProfModifiers(player: Player, slot: EquipSlot): ProfEquipModifiers {
  const mult = emptyMult()
  const flat = emptyFlat()

  const aetherSmith = getProfessionSkillLevel(player, 'blacksmith', 'bs_10') * 0.05
  mult.atk += aetherSmith
  mult.def += aetherSmith
  mult.hp += aetherSmith
  mult.crit += aetherSmith
  mult.speed += aetherSmith
  mult.stealth += aetherSmith

  if (slot === 'weapon') {
    mult.atk += getProfessionSkillLevel(player, 'blacksmith', 'bs_1') * 0.02
    mult.atk += getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m1') * 0.05
    flat.crit += getProfessionSkillLevel(player, 'blacksmith', 'bs_3') * 3
    flat.atk += getProfessionSkillLevel(player, 'blacksmith', 'bs_7')
    mult.crit += getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m3') * 0.08
    flat.atk += getProfessionSkillLevel(player, 'sorcerer', 'sc_4')
  }

  if (ARMOR_SLOTS.includes(slot)) {
    mult.def += getProfessionSkillLevel(player, 'blacksmith', 'bs_4') * 0.02
    mult.def += getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m4') * 0.06
    mult.def += getProfessionSkillLevel(player, 'sorcerer', 'sc_8') * 0.02
    flat.atk += getProfessionSkillLevel(player, 'sorcerer', 'sc_4')
  }

  if (ACCESSORY_SLOTS.includes(slot)) {
    mult.atk += getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
    mult.def += getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
    mult.hp += getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
    mult.crit += getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
    mult.speed += getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
    mult.stealth += getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02

    const crown = getProfessionSkillLevel(player, 'jeweler', 'jw_10') * 0.10
    mult.atk += crown
    mult.def += crown
    mult.hp += crown
    mult.crit += crown
    mult.speed += crown
    mult.stealth += crown

    const mythicJewel = getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m1') * 0.08
    mult.atk += mythicJewel
    mult.def += mythicJewel
    mult.hp += mythicJewel
    mult.crit += mythicJewel
    mult.speed += mythicJewel
    mult.stealth += mythicJewel

    const prismatic = getProfessionSkillLevel(player, 'jeweler', 'jw_8') * 2
    flat.atk += prismatic
    flat.def += prismatic
    flat.hp += prismatic
    flat.crit += prismatic
    flat.speed += prismatic
    flat.stealth += prismatic

    flat.crit += getProfessionSkillLevel(player, 'jeweler', 'jw_3')
    mult.crit += getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m2') * 0.04

    const etherInlay = getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m4') * 0.05
    mult.atk += etherInlay
    mult.def += etherInlay
    mult.hp += etherInlay
    mult.crit += etherInlay
    mult.speed += etherInlay
    mult.stealth += etherInlay
  }

  return { mult, flat }
}

export function getEquipmentStatMultiplier(player: Player, slot: EquipSlot): ProfStatMult {
  return getEquipmentProfModifiers(player, slot).mult
}

/** Global stat bonuses from professions (not tied to a single slot). */
export function getGlobalProfessionStatBonuses(player: Player): ProfStatMult {
  const flat = emptyFlat()
  flat.crit += getProfessionSkillLevel(player, 'hunter', 'hn_6') * 2
  flat.crit += getProfessionMythicSkillLevel(player, 'hunter', 'hn_m2') * 3

  const magicClasses = new Set(['sorcerer', 'mage', 'warlock', 'priest'])
  if (player.classId && magicClasses.has(player.classId)) {
    flat.atk += Math.floor((player.stats.atk ?? 0) * getProfessionSkillLevel(player, 'sorcerer', 'sc_3') * 0.03)
  }

  return flat
}

export function getProfessionDurabilityMult(player: Player, slot: EquipSlot): number {
  if (slot !== 'weapon') return 1
  return 1 + getProfessionSkillLevel(player, 'blacksmith', 'bs_2') * 0.01
}

export function getProfessionLootMult(player: Player, isBoss = false): number {
  let mult = 1 + getProfessionSkillLevel(player, 'hunter', 'hn_1') * 0.05
  if (isBoss) {
    mult += getProfessionMythicSkillLevel(player, 'hunter', 'hn_m1') * 0.10
  }
  return mult
}

export function getProfessionKillGoldMult(player: Player): number {
  return 1
    + getProfessionSkillLevel(player, 'hunter', 'hn_8') * 0.10
    + getProfessionMythicSkillLevel(player, 'hunter', 'hn_m4') * 0.15
}

export function getProfessionCombatDamageMult(
  player: Player,
  opts: { isBoss?: boolean; isBeast?: boolean; combo?: number },
): number {
  let mult = 1
  if (opts.isBoss) mult += getProfessionSkillLevel(player, 'hunter', 'hn_9') * 0.05
  if (opts.isBeast) mult += getProfessionSkillLevel(player, 'hunter', 'hn_4') * 0.03
  if ((opts.combo ?? 0) > 0) mult += getProfessionSkillLevel(player, 'sorcerer', 'sc_7') * 0.05
  return mult
}

export function getProfessionCritDamageMult(player: Player): number {
  return 1
    + getProfessionSkillLevel(player, 'hunter', 'hn_3') * 0.02
    + getProfessionMythicSkillLevel(player, 'hunter', 'hn_m3') * 0.06
}

export function getDebuffDamageMult(player: Player, type: SkillDebuffType): number {
  if (type === 'poison') {
    return 1
      + getProfessionSkillLevel(player, 'alchemist', 'al_3') * 0.02
      + getProfessionMythicSkillLevel(player, 'alchemist', 'al_m2') * 0.05
  }
  return 1
}

export function getProfessionScaledSkill(player: Player, skill: Skill, level: number) {
  const scaled = getScaledSkill(skill, level)
  const skillDmg = 1
    + getProfessionSkillLevel(player, 'sorcerer', 'sc_1') * 0.02
    + getProfessionMythicSkillLevel(player, 'sorcerer', 'sc_m1') * 0.08
  const skillEffect = 1
    + getProfessionSkillLevel(player, 'sorcerer', 'sc_10') * 0.10
    + getProfessionMythicSkillLevel(player, 'sorcerer', 'sc_m5') * 0.12
  const healPotency = 1
    + getProfessionSkillLevel(player, 'alchemist', 'al_5') * 0.05
    + getProfessionMythicSkillLevel(player, 'alchemist', 'al_m1') * 0.08

  const energyDisc = Math.min(
    0.45,
    getProfessionSkillLevel(player, 'sorcerer', 'sc_2') * 0.05
      + getProfessionMythicSkillLevel(player, 'sorcerer', 'sc_m2') * 0.08,
  )
  const cdReduction = getProfessionSkillLevel(player, 'sorcerer', 'sc_5') * 0.5
    + Math.floor(getProfessionMythicSkillLevel(player, 'sorcerer', 'sc_m3') / 2)

  return {
    ...scaled,
    damageMultiplier: scaled.damageMultiplier * skillDmg * skillEffect,
    healPercent: scaled.healPercent * skillEffect * healPotency,
    energyCost: Math.max(5, Math.floor(scaled.energyCost * (1 - energyDisc))),
    cooldown: Math.max(2, scaled.cooldown - cdReduction),
  }
}

export function getPotionHealMult(player: Player): number {
  return 1
    + getProfessionSkillLevel(player, 'alchemist', 'al_1') * 0.05
    + getProfessionSkillLevel(player, 'alchemist', 'al_5') * 0.05
    + getProfessionMythicSkillLevel(player, 'alchemist', 'al_m1') * 0.08
}

export function getHerbGatherProfessionBonus(player: Player): number {
  return getProfessionMythicSkillLevel(player, 'alchemist', 'al_m3') * 2
}

export function getGemDigProfessionBonus(player: Player): Partial<Record<'gem_shard' | 'mana_crystal', number>> {
  const bonus: Partial<Record<'gem_shard' | 'mana_crystal', number>> = {}
  const gemLvl = getProfessionSkillLevel(player, 'jeweler', 'jw_1')
  if (gemLvl > 0) bonus.gem_shard = gemLvl
  const manaLvl = getProfessionSkillLevel(player, 'jeweler', 'jw_6')
  if (manaLvl > 0) bonus.mana_crystal = manaLvl * 2
  const mythicMana = getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m3') * 3
  if (mythicMana > 0) bonus.mana_crystal = (bonus.mana_crystal ?? 0) + mythicMana
  return bonus
}

export function getCombatHideBonus(player: Player): number {
  return getProfessionSkillLevel(player, 'hunter', 'hn_2')
}

export function getCombatAetherDustBonus(player: Player): number {
  return getProfessionSkillLevel(player, 'sorcerer', 'sc_6')
}

export function hasLegendaryHuntBossLoot(player: Player): boolean {
  return getProfessionSkillLevel(player, 'hunter', 'hn_10') >= 1
    || getProfessionMythicSkillLevel(player, 'hunter', 'hn_m5') >= 1
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
