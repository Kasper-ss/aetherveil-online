import type { PlayerClass, ResourceId, Skill, SkillId } from '@/types/game'
import { normalizeClassId } from '@/lib/classCompat'

export const SKILL_MAX_LEVEL = 10

export const SKILLS: Record<SkillId, Skill> = {
  dual_blades: {
    id: 'dual_blades', name: 'Dual Blades', nameRu: 'Двойные клинки',
    description: 'Rapid strikes', descriptionRu: 'Быстрые удары. +50% урон, наращивает комбо.',
    damageMultiplier: 1.5, cooldown: 4, energyCost: 10, icon: '⚔️', healPercent: 0,
  },
  sword_skill: {
    id: 'sword_skill', name: 'Sword Skill', nameRu: 'Мечевой навык',
    description: 'Ultimate attack', descriptionRu: 'Мощная атака в стиле SAO. Огромный урон.',
    damageMultiplier: 3.0, cooldown: 14, energyCost: 30, icon: '✨', healPercent: 0,
  },
  dash_strike: {
    id: 'dash_strike', name: 'Dash Strike', nameRu: 'Рывок',
    description: 'Counter attack', descriptionRu: 'Уклонение и контратака.',
    damageMultiplier: 2.0, cooldown: 6, energyCost: 15, icon: '💨', healPercent: 0,
  },
  healing_light: {
    id: 'healing_light', name: 'Healing Light', nameRu: 'Исцеление',
    description: 'Restore HP', descriptionRu: 'Восстанавливает HP.',
    damageMultiplier: 0, cooldown: 16, energyCost: 20, icon: '💚', healPercent: 0.25,
  },
  power_slash: {
    id: 'power_slash', name: 'Power Slash', nameRu: 'Силовой удар',
    description: 'Heavy strike', descriptionRu: 'Мощный рубящий удар.',
    damageMultiplier: 2.2, cooldown: 7, energyCost: 18, icon: '🗡️', healPercent: 0,
  },
  whirlwind: {
    id: 'whirlwind', name: 'Whirlwind', nameRu: 'Вихрь',
    description: 'Spin attack', descriptionRu: 'Вращательная атака по области.',
    damageMultiplier: 1.8, cooldown: 8, energyCost: 22, icon: '🌀', healPercent: 0,
  },
  battle_cry: {
    id: 'battle_cry', name: 'Battle Cry', nameRu: 'Боевой клич',
    description: 'Empowered strike', descriptionRu: 'Усиленный удар после крика.',
    damageMultiplier: 2.5, cooldown: 10, energyCost: 20, icon: '📣', healPercent: 0,
  },
  executioner: {
    id: 'executioner', name: 'Executioner', nameRu: 'Казнь',
    description: 'Finishing blow', descriptionRu: 'Сокрушительный финальный удар.',
    damageMultiplier: 3.2, cooldown: 12, energyCost: 28, icon: '☠️', healPercent: 0,
  },
  aether_rampage: {
    id: 'aether_rampage', name: 'Aether Rampage', nameRu: 'Эфирная ярость',
    description: 'Ultimate fury', descriptionRu: 'Верховный навык воина.',
    damageMultiplier: 4.0, cooldown: 18, energyCost: 40, icon: '🔥', healPercent: 0,
  },
  piercing_shot: {
    id: 'piercing_shot', name: 'Piercing Shot', nameRu: 'Пробивающий выстрел',
    description: 'Armor pierce', descriptionRu: 'Выстрел, пробивающий защиту.',
    damageMultiplier: 2.3, cooldown: 7, energyCost: 16, icon: '🎯', healPercent: 0,
  },
  volley: {
    id: 'volley', name: 'Volley', nameRu: 'Залп',
    description: 'Multi arrow', descriptionRu: 'Серия стрел по цели.',
    damageMultiplier: 1.9, cooldown: 6, energyCost: 18, icon: '🏹', healPercent: 0,
  },
  trap_shot: {
    id: 'trap_shot', name: 'Trap Shot', nameRu: 'Ловушка-выстрел',
    description: 'Trapped target', descriptionRu: 'Выстрел с обездвиживающим эффектом.',
    damageMultiplier: 2.4, cooldown: 9, energyCost: 20, icon: '🪤', healPercent: 0,
  },
  headshot: {
    id: 'headshot', name: 'Headshot', nameRu: 'Выстрел в голову',
    description: 'Critical shot', descriptionRu: 'Точный выстрел с высоким критом.',
    damageMultiplier: 3.0, cooldown: 11, energyCost: 25, icon: '💀', healPercent: 0,
  },
  aether_rain: {
    id: 'aether_rain', name: 'Aether Rain', nameRu: 'Эфирный дождь',
    description: 'Rain of arrows', descriptionRu: 'Верховный залп лучника.',
    damageMultiplier: 3.8, cooldown: 17, energyCost: 38, icon: '🌧️', healPercent: 0,
  },
  fireball: {
    id: 'fireball', name: 'Fireball', nameRu: 'Огненный шар',
    description: 'Fire magic', descriptionRu: 'Классический огненный шар.',
    damageMultiplier: 2.1, cooldown: 5, energyCost: 14, icon: '🔥', healPercent: 0,
  },
  ice_lance: {
    id: 'ice_lance', name: 'Ice Lance', nameRu: 'Ледяное копьё',
    description: 'Frost magic', descriptionRu: 'Пронзающая ледяная магия.',
    damageMultiplier: 2.4, cooldown: 7, energyCost: 18, icon: '❄️', healPercent: 0,
  },
  chain_lightning: {
    id: 'chain_lightning', name: 'Chain Lightning', nameRu: 'Цепная молния',
    description: 'Lightning chain', descriptionRu: 'Молния, поражающая цель.',
    damageMultiplier: 2.6, cooldown: 9, energyCost: 22, icon: '⚡', healPercent: 0,
  },
  arcane_orb: {
    id: 'arcane_orb', name: 'Arcane Orb', nameRu: 'Магическая сфера',
    description: 'Arcane blast', descriptionRu: 'Концентрированный магический взрыв.',
    damageMultiplier: 3.1, cooldown: 12, energyCost: 28, icon: '🔮', healPercent: 0,
  },
  aether_storm: {
    id: 'aether_storm', name: 'Aether Storm', nameRu: 'Эфирный шторм',
    description: 'Ultimate magic', descriptionRu: 'Верховное заклинание мага.',
    damageMultiplier: 4.2, cooldown: 18, energyCost: 42, icon: '🌪️', healPercent: 0,
  },
  spirit_bolt: {
    id: 'spirit_bolt', name: 'Spirit Bolt', nameRu: 'Духовный болт',
    description: 'Spirit attack', descriptionRu: 'Атака призванным духом.',
    damageMultiplier: 1.8, cooldown: 5, energyCost: 12, icon: '👻', healPercent: 0,
  },
  summon_guardian: {
    id: 'summon_guardian', name: 'Summon Guardian', nameRu: 'Призыв стража',
    description: 'Guardian strike', descriptionRu: 'Удар призванного стража.',
    damageMultiplier: 2.3, cooldown: 8, energyCost: 20, icon: '🛡️', healPercent: 0,
  },
  draining_touch: {
    id: 'draining_touch', name: 'Draining Touch', nameRu: 'Вампирическое касание',
    description: 'Drain life', descriptionRu: 'Урон и частичное исцеление.',
    damageMultiplier: 1.6, cooldown: 9, energyCost: 18, icon: '🩸', healPercent: 0.12,
  },
  group_heal: {
    id: 'group_heal', name: 'Group Heal', nameRu: 'Массовое исцеление',
    description: 'Strong heal', descriptionRu: 'Сильное восстановление HP.',
    damageMultiplier: 0, cooldown: 14, energyCost: 25, icon: '💫', healPercent: 0.4,
  },
  aether_avatar: {
    id: 'aether_avatar', name: 'Aether Avatar', nameRu: 'Эфирный аватар',
    description: 'Ultimate summon', descriptionRu: 'Верховный призыв призывателя.',
    damageMultiplier: 3.5, cooldown: 18, energyCost: 40, icon: '✨', healPercent: 0,
  },
  backstab: {
    id: 'backstab', name: 'Backstab', nameRu: 'Удар в спину',
    description: 'Sneak attack', descriptionRu: 'Скрытая атака с тыла.',
    damageMultiplier: 2.8, cooldown: 7, energyCost: 16, icon: '🗡️', healPercent: 0,
  },
  poison_dagger: {
    id: 'poison_dagger', name: 'Poison Dagger', nameRu: 'Отравленный кинжал',
    description: 'Poison strike', descriptionRu: 'Удар с ядовитым лезвием.',
    damageMultiplier: 2.0, cooldown: 6, energyCost: 14, icon: '☠️', healPercent: 0,
  },
  smoke_bomb: {
    id: 'smoke_bomb', name: 'Smoke Bomb', nameRu: 'Дымовая шашка',
    description: 'Smoke strike', descriptionRu: 'Атака из дыма с уклонением.',
    damageMultiplier: 1.7, cooldown: 8, energyCost: 12, icon: '💨', healPercent: 0,
  },
  lethal_strike: {
    id: 'lethal_strike', name: 'Lethal Strike', nameRu: 'Смертельный удар',
    description: 'Lethal blow', descriptionRu: 'Почти гарантированный крит.',
    damageMultiplier: 3.3, cooldown: 11, energyCost: 26, icon: '💥', healPercent: 0,
  },
  aether_blade: {
    id: 'aether_blade', name: 'Aether Blade', nameRu: 'Эфирный клинок',
    description: 'Ultimate assassin', descriptionRu: 'Верховный навык убийцы.',
    damageMultiplier: 4.0, cooldown: 17, energyCost: 38, icon: '🌑', healPercent: 0,
  },
  shield_bash: {
    id: 'shield_bash', name: 'Shield Bash', nameRu: 'Удар щитом',
    description: 'Shield strike', descriptionRu: 'Оглушающий удар щитом.',
    damageMultiplier: 1.9, cooldown: 6, energyCost: 14, icon: '🛡️', healPercent: 0,
  },
  holy_smite: {
    id: 'holy_smite', name: 'Holy Smite', nameRu: 'Святой удар',
    description: 'Holy damage', descriptionRu: 'Священный удар по нечисти.',
    damageMultiplier: 2.3, cooldown: 8, energyCost: 18, icon: '✝️', healPercent: 0,
  },
  iron_fortress: {
    id: 'iron_fortress', name: 'Iron Fortress', nameRu: 'Железная крепость',
    description: 'Fortified strike', descriptionRu: 'Мощный удар из обороны.',
    damageMultiplier: 2.0, cooldown: 10, energyCost: 16, icon: '🏰', healPercent: 0.15,
  },
  judgment: {
    id: 'judgment', name: 'Judgment', nameRu: 'Суд',
    description: 'Righteous blow', descriptionRu: 'Сокрушительный праведный удар.',
    damageMultiplier: 3.0, cooldown: 12, energyCost: 26, icon: '⚖️', healPercent: 0,
  },
  aether_aegis: {
    id: 'aether_aegis', name: 'Aether Aegis', nameRu: 'Эфирный эгид',
    description: 'Ultimate knight', descriptionRu: 'Верховный навык рыцаря.',
    damageMultiplier: 3.6, cooldown: 18, energyCost: 38, icon: '👑', healPercent: 0.1,
  },
}

export interface ClassSkillNode {
  unlockLevel: number
  skillId: SkillId
}

export const CLASS_SKILL_TREES: Record<PlayerClass, ClassSkillNode[]> = {
  warrior: [
    { unlockLevel: 1, skillId: 'dual_blades' },
    { unlockLevel: 10, skillId: 'power_slash' },
    { unlockLevel: 20, skillId: 'whirlwind' },
    { unlockLevel: 30, skillId: 'battle_cry' },
    { unlockLevel: 40, skillId: 'executioner' },
    { unlockLevel: 50, skillId: 'aether_rampage' },
  ],
  paladin: [
    { unlockLevel: 1, skillId: 'dual_blades' },
    { unlockLevel: 10, skillId: 'shield_bash' },
    { unlockLevel: 20, skillId: 'holy_smite' },
    { unlockLevel: 30, skillId: 'iron_fortress' },
    { unlockLevel: 40, skillId: 'judgment' },
    { unlockLevel: 50, skillId: 'aether_aegis' },
  ],
  hunter: [
    { unlockLevel: 1, skillId: 'dash_strike' },
    { unlockLevel: 10, skillId: 'piercing_shot' },
    { unlockLevel: 20, skillId: 'volley' },
    { unlockLevel: 30, skillId: 'trap_shot' },
    { unlockLevel: 40, skillId: 'headshot' },
    { unlockLevel: 50, skillId: 'aether_rain' },
  ],
  rogue: [
    { unlockLevel: 1, skillId: 'dash_strike' },
    { unlockLevel: 10, skillId: 'backstab' },
    { unlockLevel: 20, skillId: 'poison_dagger' },
    { unlockLevel: 30, skillId: 'smoke_bomb' },
    { unlockLevel: 40, skillId: 'lethal_strike' },
    { unlockLevel: 50, skillId: 'aether_blade' },
  ],
  priest: [
    { unlockLevel: 1, skillId: 'healing_light' },
    { unlockLevel: 10, skillId: 'spirit_bolt' },
    { unlockLevel: 20, skillId: 'summon_guardian' },
    { unlockLevel: 30, skillId: 'draining_touch' },
    { unlockLevel: 40, skillId: 'group_heal' },
    { unlockLevel: 50, skillId: 'aether_avatar' },
  ],
  shaman: [
    { unlockLevel: 1, skillId: 'healing_light' },
    { unlockLevel: 10, skillId: 'fireball' },
    { unlockLevel: 20, skillId: 'chain_lightning' },
    { unlockLevel: 30, skillId: 'spirit_bolt' },
    { unlockLevel: 40, skillId: 'arcane_orb' },
    { unlockLevel: 50, skillId: 'aether_storm' },
  ],
  mage: [
    { unlockLevel: 1, skillId: 'sword_skill' },
    { unlockLevel: 10, skillId: 'fireball' },
    { unlockLevel: 20, skillId: 'ice_lance' },
    { unlockLevel: 30, skillId: 'chain_lightning' },
    { unlockLevel: 40, skillId: 'arcane_orb' },
    { unlockLevel: 50, skillId: 'aether_storm' },
  ],
  warlock: [
    { unlockLevel: 1, skillId: 'sword_skill' },
    { unlockLevel: 10, skillId: 'fireball' },
    { unlockLevel: 20, skillId: 'draining_touch' },
    { unlockLevel: 30, skillId: 'poison_dagger' },
    { unlockLevel: 40, skillId: 'chain_lightning' },
    { unlockLevel: 50, skillId: 'aether_storm' },
  ],
  druid: [
    { unlockLevel: 1, skillId: 'healing_light' },
    { unlockLevel: 10, skillId: 'shield_bash' },
    { unlockLevel: 20, skillId: 'spirit_bolt' },
    { unlockLevel: 30, skillId: 'iron_fortress' },
    { unlockLevel: 40, skillId: 'group_heal' },
    { unlockLevel: 50, skillId: 'aether_aegis' },
  ],
  monk: [
    { unlockLevel: 1, skillId: 'dash_strike' },
    { unlockLevel: 10, skillId: 'backstab' },
    { unlockLevel: 20, skillId: 'healing_light' },
    { unlockLevel: 30, skillId: 'smoke_bomb' },
    { unlockLevel: 40, skillId: 'lethal_strike' },
    { unlockLevel: 50, skillId: 'aether_blade' },
  ],
}

export function getUnlockedSkillsForLevel(classId: PlayerClass, level: number): SkillId[] {
  return CLASS_SKILL_TREES[classId]
    .filter((n) => level >= n.unlockLevel)
    .map((n) => n.skillId)
}

export function syncPlayerSkills(
  classId: PlayerClass | string | undefined,
  level: number,
  currentSkills: SkillId[],
  currentLevels: Partial<Record<SkillId, number>>,
): { skills: SkillId[]; skillLevels: Partial<Record<SkillId, number>> } {
  const normalized = normalizeClassId(classId as string)
  if (!normalized) return { skills: currentSkills, skillLevels: currentLevels }
  const unlocked = getUnlockedSkillsForLevel(normalized, level)
  const skillLevels = { ...currentLevels }
  for (const sid of unlocked) {
    if (!skillLevels[sid]) skillLevels[sid] = 1
  }
  return { skills: unlocked, skillLevels }
}

export function getSkillUpgradeCost(skillId: SkillId, currentLevel: number): {
  gold: number
  resources: Partial<Record<ResourceId, number>>
} {
  if (currentLevel >= SKILL_MAX_LEVEL) return { gold: 0, resources: {} }
  const next = currentLevel + 1
  const skill = SKILLS[skillId]
  const tier = Math.ceil(next / 2)
  return {
    gold: Math.floor(60 * next * next + tier * 40),
    resources: Object.fromEntries(
      Object.entries({
        mana_crystal: tier >= 2 ? Math.ceil(next / 3) : 0,
        upgrade_core: Math.ceil(next / 4),
        aether_dust: next >= 7 ? 1 : 0,
        herb: skill.healPercent > 0 ? Math.ceil(next / 2) : 0,
      }).filter(([, v]) => v > 0)
    ) as Partial<Record<ResourceId, number>>,
  }
}

export function getScaledSkill(skill: Skill, level: number): {
  damageMultiplier: number
  cooldown: number
  energyCost: number
  healPercent: number
} {
  const lvl = Math.max(1, Math.min(SKILL_MAX_LEVEL, level))
  const bonus = (lvl - 1) * 0.08
  return {
    damageMultiplier: skill.damageMultiplier * (1 + bonus),
    cooldown: Math.max(2, Math.floor(skill.cooldown * (1 - (lvl - 1) * 0.035))),
    energyCost: Math.max(5, Math.floor(skill.energyCost * (1 - (lvl - 1) * 0.03))),
    healPercent: skill.healPercent * (1 + bonus),
  }
}
