import type { CombatLogEntry } from '@/types/game'
import type { SkillId, PlayerRace } from '@/types/game'
import { SKILL_MAX_LEVEL } from '@/data/playerSkills'
import type { EnemyCombatState } from '@/lib/enemyCombat'
import { createEnemyCombatState } from '@/lib/enemyCombat'

export const SKILL_DEBUFF_DURATION_SEC = 20

export type SkillDebuffType =
  | 'burn'
  | 'bleed'
  | 'poison'
  | 'frost'
  | 'shock'
  | 'holy'
  | 'arcane'
  | 'curse'
  | 'weaken'
  | 'slow'
  | 'fear'

export interface SkillDebuffDef {
  type: SkillDebuffType
  nameRu: string
  icon: string
}

export interface PlayerAppliedDebuff {
  type: SkillDebuffType
  nameRu: string
  icon: string
  remainingSec: number
  tickDamage: number
  skillId?: SkillId
  sourceRu?: string
}

const DEBUFF_DEFS: Record<SkillDebuffType, SkillDebuffDef> = {
  burn: { type: 'burn', nameRu: 'Сгорание', icon: '🔥' },
  bleed: { type: 'bleed', nameRu: 'Кровотечение', icon: '🩸' },
  poison: { type: 'poison', nameRu: 'Отравление', icon: '☠️' },
  frost: { type: 'frost', nameRu: 'Обморожение', icon: '❄️' },
  shock: { type: 'shock', nameRu: 'Шок', icon: '⚡' },
  holy: { type: 'holy', nameRu: 'Святой ожог', icon: '✝️' },
  arcane: { type: 'arcane', nameRu: 'Магический ожог', icon: '🔮' },
  curse: { type: 'curse', nameRu: 'Проклятие', icon: '👿' },
  weaken: { type: 'weaken', nameRu: 'Ослабление', icon: '📉' },
  slow: { type: 'slow', nameRu: 'Замедление', icon: '🐌' },
  fear: { type: 'fear', nameRu: 'Страх', icon: '😨' },
}

export const SKILL_DEBUFF_MAP: Record<SkillId, SkillDebuffType> = {
  dual_blades: 'bleed',
  sword_skill: 'bleed',
  dash_strike: 'slow',
  healing_light: 'holy',
  power_slash: 'bleed',
  whirlwind: 'bleed',
  battle_cry: 'weaken',
  executioner: 'bleed',
  aether_rampage: 'burn',
  piercing_shot: 'bleed',
  volley: 'bleed',
  trap_shot: 'slow',
  headshot: 'bleed',
  aether_rain: 'burn',
  fireball: 'burn',
  ice_lance: 'frost',
  chain_lightning: 'shock',
  arcane_orb: 'arcane',
  aether_storm: 'shock',
  spirit_bolt: 'arcane',
  summon_guardian: 'slow',
  draining_touch: 'bleed',
  group_heal: 'holy',
  aether_avatar: 'arcane',
  backstab: 'bleed',
  poison_dagger: 'poison',
  smoke_bomb: 'poison',
  lethal_strike: 'bleed',
  aether_blade: 'curse',
  shield_bash: 'slow',
  holy_smite: 'holy',
  iron_fortress: 'weaken',
  judgment: 'holy',
  aether_aegis: 'holy',
}

const RACE_DEBUFF_MAP: Record<PlayerRace, SkillDebuffType> = {
  human: 'weaken',
  dwarf: 'slow',
  night_elf: 'poison',
  orc: 'bleed',
  undead: 'curse',
  troll: 'poison',
  blood_elf: 'arcane',
}

export function getSkillDebuffDef(skillId: SkillId): SkillDebuffDef {
  const type = SKILL_DEBUFF_MAP[skillId]
  return DEBUFF_DEFS[type]
}

export function getSkillDebuffDescription(skillId: SkillId): string {
  const def = getSkillDebuffDef(skillId)
  return `Накладывает «${def.nameRu}» на ${SKILL_DEBUFF_DURATION_SEC} сек.`
}

export function getSkillDebuffTickDamage(
  skillLevel: number,
  playerAtk: number,
  powerMult: number,
): number {
  const lvl = Math.max(1, Math.min(SKILL_MAX_LEVEL, skillLevel))
  const levelFactor = 1 + (lvl - 1) * 0.12
  const power = Math.max(0.4, powerMult)
  return Math.max(2, Math.floor(playerAtk * 0.08 * power * levelFactor))
}

export function getRacialDebuffTickDamage(playerAtk: number, playerLevel: number): number {
  const levelFactor = 1 + (Math.max(1, playerLevel) - 1) * 0.06
  return Math.max(2, Math.floor(playerAtk * 0.06 * levelFactor))
}

function upsertDebuff(
  debuffs: PlayerAppliedDebuff[],
  entry: PlayerAppliedDebuff,
): PlayerAppliedDebuff[] {
  const idx = debuffs.findIndex((d) => d.type === entry.type)
  if (idx < 0) return [...debuffs, entry]
  const next = [...debuffs]
  next[idx] = {
    ...entry,
    tickDamage: Math.max(debuffs[idx].tickDamage, entry.tickDamage),
    remainingSec: SKILL_DEBUFF_DURATION_SEC,
  }
  return next
}

export function applyPlayerSkillDebuff(
  state: EnemyCombatState | undefined,
  skillId: SkillId,
  skillLevel: number,
  playerAtk: number,
  powerMult: number,
): { state: EnemyCombatState; log: string } {
  const def = getSkillDebuffDef(skillId)
  const base = state ?? createEnemyCombatState()
  const tickDamage = getSkillDebuffTickDamage(skillLevel, playerAtk, powerMult)
  const entry: PlayerAppliedDebuff = {
    type: def.type,
    nameRu: def.nameRu,
    icon: def.icon,
    remainingSec: SKILL_DEBUFF_DURATION_SEC,
    tickDamage,
    skillId,
  }
  return {
    state: { ...base, playerDebuffs: upsertDebuff(base.playerDebuffs ?? [], entry) },
    log: `${def.icon} «${def.nameRu}» на ${SKILL_DEBUFF_DURATION_SEC} сек (−${tickDamage}/с)`,
  }
}

export function applyRacialSkillDebuff(
  state: EnemyCombatState | undefined,
  raceId: PlayerRace,
  playerAtk: number,
  playerLevel: number,
  abilityNameRu: string,
): { state: EnemyCombatState; log: string } {
  const type = RACE_DEBUFF_MAP[raceId]
  const def = DEBUFF_DEFS[type]
  const base = state ?? createEnemyCombatState()
  const tickDamage = getRacialDebuffTickDamage(playerAtk, playerLevel)
  const entry: PlayerAppliedDebuff = {
    type: def.type,
    nameRu: def.nameRu,
    icon: def.icon,
    remainingSec: SKILL_DEBUFF_DURATION_SEC,
    tickDamage,
    sourceRu: abilityNameRu,
  }
  return {
    state: { ...base, playerDebuffs: upsertDebuff(base.playerDebuffs ?? [], entry) },
    log: `${def.icon} «${def.nameRu}» (${abilityNameRu}) на ${SKILL_DEBUFF_DURATION_SEC} сек`,
  }
}

export function tickPlayerSkillDebuffs(
  enemyHp: number,
  state: EnemyCombatState | undefined,
): {
  enemyHp: number
  state: EnemyCombatState
  logs: CombatLogEntry[]
  totalDamage: number
} {
  const base = state ?? createEnemyCombatState()
  const debuffs = base.playerDebuffs ?? []
  if (debuffs.length === 0) {
    return { enemyHp, state: base, logs: [], totalDamage: 0 }
  }

  let totalDamage = 0
  const logs: CombatLogEntry[] = []
  const nextDebuffs: PlayerAppliedDebuff[] = []

  for (const d of debuffs) {
    if (d.remainingSec <= 0) continue
    totalDamage += d.tickDamage
    logs.push({ text: `${d.icon} ${d.nameRu}: −${d.tickDamage}`, type: 'skill' })
    const remaining = d.remainingSec - 1
    if (remaining > 0) nextDebuffs.push({ ...d, remainingSec: remaining })
  }

  return {
    enemyHp: Math.max(0, enemyHp - totalDamage),
    state: { ...base, playerDebuffs: nextDebuffs },
    logs,
    totalDamage,
  }
}
