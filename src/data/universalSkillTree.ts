import type { UniversalSkillId } from '@/types/game'

export const UNIVERSAL_SKILL_MAX_LEVEL = 4

export type UniversalSkillEffect =
  | 'damage'
  | 'heal'
  | 'hybrid'
  | 'passive'

export interface UniversalSkillDef {
  id: UniversalSkillId
  nameRu: string
  descriptionRu: string
  icon: string
  tierLevel: number
  tierSlot: number
  effect: UniversalSkillEffect
  damageMultiplier: number
  healPercent: number
  cooldown: number
  energyCost: number
  /** +40% per level above 1 */
  upgradeBonusPerLevel: number
}

export const UNIVERSAL_SKILL_TIERS: Array<{ unlockLevel: number; skillIds: UniversalSkillId[] }> = [
  { unlockLevel: 10, skillIds: ['u_fury', 'u_tough_skin', 'u_quick_step'] },
  { unlockLevel: 15, skillIds: ['u_crit_strike', 'u_regeneration', 'u_shield'] },
  { unlockLevel: 20, skillIds: ['u_whirlwind', 'u_concentration', 'u_reflect'] },
  { unlockLevel: 25, skillIds: ['u_berserk', 'u_barrier', 'u_sharp_eye'] },
  { unlockLevel: 30, skillIds: ['u_flash', 'u_vampirism', 'u_steadfastness'] },
  { unlockLevel: 35, skillIds: ['u_chain_lightning', 'u_healing', 'u_invulnerability'] },
  { unlockLevel: 40, skillIds: ['u_dragon_fury', 'u_mirror', 'u_speed_boost'] },
  { unlockLevel: 45, skillIds: ['u_rupture', 'u_recovery', 'u_aura'] },
  { unlockLevel: 50, skillIds: ['u_apocalypse', 'u_immortality', 'u_spirit_strength'] },
  { unlockLevel: 55, skillIds: ['u_blood_dance', 'u_absolute_defense', 'u_life_energy'] },
  { unlockLevel: 60, skillIds: ['u_star_burst'] },
  { unlockLevel: 65, skillIds: ['u_eternal_regen'] },
  { unlockLevel: 70, skillIds: ['u_absolute_shield'] },
  { unlockLevel: 75, skillIds: ['u_godlike_strength'] },
  { unlockLevel: 80, skillIds: ['u_reality_rift'] },
  { unlockLevel: 85, skillIds: ['u_divine_healing'] },
  { unlockLevel: 90, skillIds: ['u_skill_copy'] },
  { unlockLevel: 95, skillIds: ['u_time_slow'] },
  { unlockLevel: 100, skillIds: ['u_final_strike'] },
]

export const UNIVERSAL_SKILLS: Record<UniversalSkillId, UniversalSkillDef> = {
  u_fury: {
    id: 'u_fury', nameRu: 'Ярость', icon: '🔥',
    descriptionRu: '+15% к урону на 8 сек (перезарядка 25 сек)',
    tierLevel: 10, tierSlot: 1, effect: 'damage',
    damageMultiplier: 1.65, healPercent: 0, cooldown: 25, energyCost: 18, upgradeBonusPerLevel: 0.4,
  },
  u_tough_skin: {
    id: 'u_tough_skin', nameRu: 'Твёрдая Кожа', icon: '🛡️',
    descriptionRu: '+20% к защите на 10 сек',
    tierLevel: 10, tierSlot: 2, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.2, cooldown: 22, energyCost: 16, upgradeBonusPerLevel: 0.4,
  },
  u_quick_step: {
    id: 'u_quick_step', nameRu: 'Быстрый Шаг', icon: '💨',
    descriptionRu: '+25% к скорости восстановления энергии (пассивно)',
    tierLevel: 10, tierSlot: 3, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.35,
  },
  u_crit_strike: {
    id: 'u_crit_strike', nameRu: 'Критический Удар', icon: '💥',
    descriptionRu: '+20% шанс крита на 1 удар',
    tierLevel: 15, tierSlot: 1, effect: 'damage',
    damageMultiplier: 2.2, healPercent: 0, cooldown: 14, energyCost: 20, upgradeBonusPerLevel: 0.4,
  },
  u_regeneration: {
    id: 'u_regeneration', nameRu: 'Регенерация', icon: '💚',
    descriptionRu: 'Восстанавливает 8% HP каждые 3 сек в течение 9 сек',
    tierLevel: 15, tierSlot: 2, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.24, cooldown: 20, energyCost: 22, upgradeBonusPerLevel: 0.4,
  },
  u_shield: {
    id: 'u_shield', nameRu: 'Щит', icon: '🔰',
    descriptionRu: 'Поглощает 30% входящего урона на 6 сек',
    tierLevel: 15, tierSlot: 3, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.15, cooldown: 18, energyCost: 18, upgradeBonusPerLevel: 0.4,
  },
  u_whirlwind: {
    id: 'u_whirlwind', nameRu: 'Вихрь', icon: '🌀',
    descriptionRu: 'AoE-атака по всем врагам в радиусе',
    tierLevel: 20, tierSlot: 1, effect: 'damage',
    damageMultiplier: 2.0, healPercent: 0, cooldown: 12, energyCost: 24, upgradeBonusPerLevel: 0.4,
  },
  u_concentration: {
    id: 'u_concentration', nameRu: 'Концентрация', icon: '🎯',
    descriptionRu: '+30% к урону следующего удара',
    tierLevel: 20, tierSlot: 2, effect: 'damage',
    damageMultiplier: 2.6, healPercent: 0, cooldown: 10, energyCost: 16, upgradeBonusPerLevel: 0.4,
  },
  u_reflect: {
    id: 'u_reflect', nameRu: 'Отскок', icon: '↩️',
    descriptionRu: 'Шанс 25% отразить часть урона',
    tierLevel: 20, tierSlot: 3, effect: 'hybrid',
    damageMultiplier: 1.5, healPercent: 0.08, cooldown: 16, energyCost: 18, upgradeBonusPerLevel: 0.4,
  },
  u_berserk: {
    id: 'u_berserk', nameRu: 'Берсерк', icon: '😤',
    descriptionRu: '+40% атаки, но −15% защиты на 12 сек',
    tierLevel: 25, tierSlot: 1, effect: 'damage',
    damageMultiplier: 2.8, healPercent: 0, cooldown: 18, energyCost: 26, upgradeBonusPerLevel: 0.4,
  },
  u_barrier: {
    id: 'u_barrier', nameRu: 'Барьер', icon: '🧱',
    descriptionRu: 'Создаёт щит на 40% от максимального HP',
    tierLevel: 25, tierSlot: 2, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.4, cooldown: 24, energyCost: 28, upgradeBonusPerLevel: 0.4,
  },
  u_sharp_eye: {
    id: 'u_sharp_eye', nameRu: 'Острый Глаз', icon: '👁️',
    descriptionRu: '+35% шанс крита на 1 удар',
    tierLevel: 25, tierSlot: 3, effect: 'damage',
    damageMultiplier: 2.5, healPercent: 0, cooldown: 14, energyCost: 22, upgradeBonusPerLevel: 0.45,
  },
  u_flash: {
    id: 'u_flash', nameRu: 'Вспышка', icon: '⚡',
    descriptionRu: 'Мгновенный урон + оглушение на 2 сек',
    tierLevel: 30, tierSlot: 1, effect: 'damage',
    damageMultiplier: 2.4, healPercent: 0, cooldown: 16, energyCost: 24, upgradeBonusPerLevel: 0.4,
  },
  u_vampirism: {
    id: 'u_vampirism', nameRu: 'Вампиризм', icon: '🩸',
    descriptionRu: '25% от нанесённого урона идёт в HP',
    tierLevel: 30, tierSlot: 2, effect: 'hybrid',
    damageMultiplier: 2.0, healPercent: 0.25, cooldown: 14, energyCost: 22, upgradeBonusPerLevel: 0.4,
  },
  u_steadfastness: {
    id: 'u_steadfastness', nameRu: 'Стойкость', icon: '🏔️',
    descriptionRu: '+50% к защите на 8 сек',
    tierLevel: 30, tierSlot: 3, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.25, cooldown: 20, energyCost: 20, upgradeBonusPerLevel: 0.4,
  },
  u_chain_lightning: {
    id: 'u_chain_lightning', nameRu: 'Цепная Молния', icon: '⛈️',
    descriptionRu: 'Урон по 3 ближайшим целям',
    tierLevel: 35, tierSlot: 1, effect: 'damage',
    damageMultiplier: 2.8, healPercent: 0, cooldown: 16, energyCost: 28, upgradeBonusPerLevel: 0.4,
  },
  u_healing: {
    id: 'u_healing', nameRu: 'Исцеление', icon: '✨',
    descriptionRu: 'Восстанавливает 35% HP',
    tierLevel: 35, tierSlot: 2, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.35, cooldown: 18, energyCost: 26, upgradeBonusPerLevel: 0.4,
  },
  u_invulnerability: {
    id: 'u_invulnerability', nameRu: 'Неуязвимость', icon: '💎',
    descriptionRu: '3 секунды полного иммунитета к урону',
    tierLevel: 35, tierSlot: 3, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.3, cooldown: 30, energyCost: 32, upgradeBonusPerLevel: 0.4,
  },
  u_dragon_fury: {
    id: 'u_dragon_fury', nameRu: 'Ярость Дракона', icon: '🐉',
    descriptionRu: '+60% урона на 10 сек',
    tierLevel: 40, tierSlot: 1, effect: 'damage',
    damageMultiplier: 3.2, healPercent: 0, cooldown: 22, energyCost: 32, upgradeBonusPerLevel: 0.45,
  },
  u_mirror: {
    id: 'u_mirror', nameRu: 'Зеркало', icon: '🪞',
    descriptionRu: 'Отражает 50% урона в течение 5 сек',
    tierLevel: 40, tierSlot: 2, effect: 'hybrid',
    damageMultiplier: 1.8, healPercent: 0.2, cooldown: 20, energyCost: 24, upgradeBonusPerLevel: 0.4,
  },
  u_speed_boost: {
    id: 'u_speed_boost', nameRu: 'Скорость', icon: '⚡',
    descriptionRu: '+40% к скорости восстановления энергии',
    tierLevel: 40, tierSlot: 3, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.4,
  },
  u_rupture: {
    id: 'u_rupture', nameRu: 'Разрыв', icon: '🗡️',
    descriptionRu: 'Игнорирует 40% защиты цели',
    tierLevel: 45, tierSlot: 1, effect: 'damage',
    damageMultiplier: 3.0, healPercent: 0, cooldown: 16, energyCost: 28, upgradeBonusPerLevel: 0.45,
  },
  u_recovery: {
    id: 'u_recovery', nameRu: 'Восстановление', icon: '♻️',
    descriptionRu: 'Пассивно восстанавливает 2% HP в секунду',
    tierLevel: 45, tierSlot: 2, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.35,
  },
  u_aura: {
    id: 'u_aura', nameRu: 'Аура', icon: '🌟',
    descriptionRu: 'Постоянно +15% к урону',
    tierLevel: 45, tierSlot: 3, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.35,
  },
  u_apocalypse: {
    id: 'u_apocalypse', nameRu: 'Апокалипсис', icon: '☄️',
    descriptionRu: 'Мощный AoE-урон по врагам',
    tierLevel: 50, tierSlot: 1, effect: 'damage',
    damageMultiplier: 4.0, healPercent: 0, cooldown: 24, energyCost: 40, upgradeBonusPerLevel: 0.45,
  },
  u_immortality: {
    id: 'u_immortality', nameRu: 'Бессмертие', icon: '👼',
    descriptionRu: '1 раз за бой воскрешает с 30% HP',
    tierLevel: 50, tierSlot: 2, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.3, cooldown: 60, energyCost: 35, upgradeBonusPerLevel: 0.4,
  },
  u_spirit_strength: {
    id: 'u_spirit_strength', nameRu: 'Сила Духа', icon: '🔮',
    descriptionRu: '+50% ко всем статам на 8 сек',
    tierLevel: 50, tierSlot: 3, effect: 'damage',
    damageMultiplier: 2.5, healPercent: 0.1, cooldown: 22, energyCost: 30, upgradeBonusPerLevel: 0.45,
  },
  u_blood_dance: {
    id: 'u_blood_dance', nameRu: 'Кровавый Танец', icon: '🩸',
    descriptionRu: '+70% атаки на 10 сек',
    tierLevel: 55, tierSlot: 1, effect: 'damage',
    damageMultiplier: 3.5, healPercent: 0, cooldown: 20, energyCost: 34, upgradeBonusPerLevel: 0.45,
  },
  u_absolute_defense: {
    id: 'u_absolute_defense', nameRu: 'Абсолютная Защита', icon: '🛡️',
    descriptionRu: '100% блок урона на 4 сек',
    tierLevel: 55, tierSlot: 2, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.35, cooldown: 28, energyCost: 30, upgradeBonusPerLevel: 0.4,
  },
  u_life_energy: {
    id: 'u_life_energy', nameRu: 'Энергия Жизни', icon: '⚡',
    descriptionRu: '+60% к максимальной энергии (пассивно)',
    tierLevel: 55, tierSlot: 3, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.4,
  },
  u_star_burst: {
    id: 'u_star_burst', nameRu: 'Звёздный Взрыв', icon: '💫',
    descriptionRu: 'Высший скилл: взрыв звёздной энергии',
    tierLevel: 60, tierSlot: 1, effect: 'damage',
    damageMultiplier: 4.5, healPercent: 0, cooldown: 26, energyCost: 42, upgradeBonusPerLevel: 0.5,
  },
  u_eternal_regen: {
    id: 'u_eternal_regen', nameRu: 'Вечная Регенерация', icon: '🌿',
    descriptionRu: 'Постоянная регенерация HP в бою',
    tierLevel: 65, tierSlot: 1, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.4,
  },
  u_absolute_shield: {
    id: 'u_absolute_shield', nameRu: 'Абсолютный Щит', icon: '🔷',
    descriptionRu: 'Щит, поглощающий огромный урон',
    tierLevel: 70, tierSlot: 1, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.5, cooldown: 32, energyCost: 36, upgradeBonusPerLevel: 0.45,
  },
  u_godlike_strength: {
    id: 'u_godlike_strength', nameRu: 'Богоподобная Сила', icon: '👑',
    descriptionRu: 'Постоянно +25% ко всем статам',
    tierLevel: 75, tierSlot: 1, effect: 'passive',
    damageMultiplier: 0, healPercent: 0, cooldown: 0, energyCost: 0, upgradeBonusPerLevel: 0.4,
  },
  u_reality_rift: {
    id: 'u_reality_rift', nameRu: 'Разрыв Реальности', icon: '🌌',
    descriptionRu: 'Разрывает защиту и наносит колossal урон',
    tierLevel: 80, tierSlot: 1, effect: 'damage',
    damageMultiplier: 5.0, healPercent: 0, cooldown: 28, energyCost: 45, upgradeBonusPerLevel: 0.5,
  },
  u_divine_healing: {
    id: 'u_divine_healing', nameRu: 'Божественное Исцеление', icon: '🕊️',
    descriptionRu: 'Полное восстановление HP',
    tierLevel: 85, tierSlot: 1, effect: 'heal',
    damageMultiplier: 0, healPercent: 0.6, cooldown: 30, energyCost: 38, upgradeBonusPerLevel: 0.45,
  },
  u_skill_copy: {
    id: 'u_skill_copy', nameRu: 'Копия', icon: '📋',
    descriptionRu: 'Дублирует последний использованный скилл',
    tierLevel: 90, tierSlot: 1, effect: 'damage',
    damageMultiplier: 3.0, healPercent: 0, cooldown: 18, energyCost: 30, upgradeBonusPerLevel: 0.45,
  },
  u_time_slow: {
    id: 'u_time_slow', nameRu: 'Время Замедления', icon: '⏳',
    descriptionRu: 'Замедляет врага и наносит урон',
    tierLevel: 95, tierSlot: 1, effect: 'damage',
    damageMultiplier: 3.2, healPercent: 0, cooldown: 22, energyCost: 32, upgradeBonusPerLevel: 0.45,
  },
  u_final_strike: {
    id: 'u_final_strike', nameRu: 'Финальный Удар', icon: '💀',
    descriptionRu: 'Огромный урон по одной цели',
    tierLevel: 100, tierSlot: 1, effect: 'damage',
    damageMultiplier: 6.0, healPercent: 0, cooldown: 30, energyCost: 50, upgradeBonusPerLevel: 0.5,
  },
}

export function getTotalUniversalSkillPoints(level: number): number {
  if (level < 10) return 0
  return 1 + Math.floor((Math.min(level, 200) - 10) / 5)
}

export function getSpentUniversalSkillPoints(
  levels: Partial<Record<UniversalSkillId, number>>,
): number {
  return Object.values(levels).reduce((sum, lv) => sum + (lv ?? 0), 0)
}

export function getAvailableUniversalSkillPoints(player: {
  level: number
  universalSkillLevels?: Partial<Record<UniversalSkillId, number>>
}): number {
  const total = getTotalUniversalSkillPoints(player.level)
  const spent = getSpentUniversalSkillPoints(player.universalSkillLevels ?? {})
  return Math.max(0, total - spent)
}

export function getUniversalSkillUnlockLevel(skillId: UniversalSkillId): number {
  for (const tier of UNIVERSAL_SKILL_TIERS) {
    if (tier.skillIds.includes(skillId)) return tier.unlockLevel
  }
  return UNIVERSAL_SKILLS[skillId]?.tierLevel ?? 999
}

export function getScaledUniversalSkill(skill: UniversalSkillDef, level: number) {
  const lvl = Math.max(1, Math.min(UNIVERSAL_SKILL_MAX_LEVEL, level))
  const bonus = 1 + (lvl - 1) * skill.upgradeBonusPerLevel
  return {
    damageMultiplier: skill.damageMultiplier * bonus,
    healPercent: skill.healPercent * bonus,
    cooldown: skill.cooldown > 0 ? Math.max(3, Math.floor(skill.cooldown * (1 - (lvl - 1) * 0.05))) : 0,
    energyCost: skill.energyCost > 0 ? Math.max(5, Math.floor(skill.energyCost * (1 - (lvl - 1) * 0.04))) : 0,
  }
}

export function getUnlockedUniversalSkillIds(
  levels: Partial<Record<UniversalSkillId, number>>,
): UniversalSkillId[] {
  return (Object.entries(levels) as [UniversalSkillId, number][])
    .filter(([, lv]) => (lv ?? 0) > 0)
    .map(([id]) => id)
}

export function getActiveUniversalSkills(
  levels: Partial<Record<UniversalSkillId, number>>,
): UniversalSkillId[] {
  return getUnlockedUniversalSkillIds(levels).filter((id) => UNIVERSAL_SKILLS[id].effect !== 'passive')
}

export interface UniversalPassiveBonuses {
  damageMult: number
  allStatsMult: number
  energyRegenMult: number
  maxEnergyMult: number
  hpRegenPerTurn: number
}

export function getUniversalPassiveBonuses(
  levels: Partial<Record<UniversalSkillId, number>>,
): UniversalPassiveBonuses {
  const out: UniversalPassiveBonuses = {
    damageMult: 1,
    allStatsMult: 1,
    energyRegenMult: 1,
    maxEnergyMult: 1,
    hpRegenPerTurn: 0,
  }
  const apply = (id: UniversalSkillId, fn: (lvl: number, bonus: number) => void) => {
    const lvl = levels[id] ?? 0
    if (lvl <= 0) return
    const bonus = 1 + (lvl - 1) * UNIVERSAL_SKILLS[id].upgradeBonusPerLevel
    fn(lvl, bonus)
  }

  apply('u_quick_step', (_, b) => { out.energyRegenMult *= 1 + 0.25 * b })
  apply('u_speed_boost', (_, b) => { out.energyRegenMult *= 1 + 0.4 * b })
  apply('u_life_energy', (_, b) => { out.maxEnergyMult *= 1 + 0.6 * b })
  apply('u_aura', (_, b) => { out.damageMult *= 1 + 0.15 * b })
  apply('u_recovery', (_, b) => { out.hpRegenPerTurn += Math.floor(2 * b) })
  apply('u_eternal_regen', (_, b) => { out.hpRegenPerTurn += Math.floor(3 * b) })
  apply('u_godlike_strength', (_, b) => { out.allStatsMult *= 1 + 0.25 * b })

  return out
}
