import type { CombatLogEntry, CombatState, FloorEnemy } from '@/types/game'
import { rollDodge, type EffectiveStats } from '@/lib/playerStats'
import { calcMitigatedDamage, PLAYER_DEF_MITIGATION } from '@/lib/combatDamage'
import { EFFECT_PRESETS } from '@/lib/activeEffects'
import type { PlayerClass } from '@/types/game'

export interface EnemyAbility {
  id: string
  nameRu: string
  cooldown: number
}

export interface EnemyCombatState {
  abilityCooldowns: Record<string, number>
  shieldRemaining: number
  enraged: boolean
  dotTurns: number
  dotDamage: number
  fearedTurns?: number
}

export function createEnemyCombatState(): EnemyCombatState {
  return {
    abilityCooldowns: {},
    shieldRemaining: 0,
    enraged: false,
    dotTurns: 0,
    dotDamage: 0,
  }
}

export function getEnemyAbilities(enemy: FloorEnemy, floor: number): EnemyAbility[] {
  if (floor < 3) return []

  const abilities: EnemyAbility[] = []

  if (enemy.isBoss) {
    abilities.push({ id: 'flame_burst', nameRu: 'Удар пламени', cooldown: 3 })
    if (floor >= 6) abilities.push({ id: 'venom_bite', nameRu: 'Ядовитый укус', cooldown: 4 })
    if (floor >= 10) abilities.push({ id: 'armor_break', nameRu: 'Пробой брони', cooldown: 5 })
    if (floor >= 15) abilities.push({ id: 'life_drain', nameRu: 'Вампиризм', cooldown: 4 })
    if (floor >= 20) abilities.push({ id: 'shadow_strike', nameRu: 'Удар тени', cooldown: 5 })
    return abilities
  }

  switch (enemy.pattern) {
    case 'aggressive':
      abilities.push({ id: 'rage_strike', nameRu: 'Яростный удар', cooldown: 3 })
      break
    case 'defensive':
      abilities.push({ id: 'iron_shell', nameRu: 'Железный панцирь', cooldown: 4 })
      break
    case 'berserker':
      abilities.push({ id: 'blood_frenzy', nameRu: 'Кровожадность', cooldown: 0 })
      break
    default:
      break
  }

  if (floor >= 8 && !enemy.isEpic) {
    abilities.push({ id: 'crippling_strike', nameRu: 'Калечащий удар', cooldown: 5 })
  }

  return abilities
}

function tickCooldowns(state: EnemyCombatState): EnemyCombatState {
  const abilityCooldowns: Record<string, number> = {}
  for (const [id, cd] of Object.entries(state.abilityCooldowns)) {
    if (cd > 1) abilityCooldowns[id] = cd - 1
  }
  return { ...state, abilityCooldowns }
}

function canUseAbility(state: EnemyCombatState, ability: EnemyAbility): boolean {
  return ability.cooldown === 0 || (state.abilityCooldowns[ability.id] ?? 0) <= 0
}

function setCooldown(state: EnemyCombatState, abilityId: string, turns: number): EnemyCombatState {
  if (turns <= 0) return state
  return {
    ...state,
    abilityCooldowns: { ...state.abilityCooldowns, [abilityId]: turns },
  }
}

function log(text: string, type: CombatLogEntry['type'] = 'enemy'): CombatLogEntry {
  return { text, type }
}

export interface EnemyAttackResult {
  playerDmg: number
  enemyHeal: number
  logs: CombatLogEntry[]
  enemyCombat: EnemyCombatState
  debuffPresets?: Array<{ preset: keyof typeof EFFECT_PRESETS; durationMs: number }>
}

const PHASE2_DEBUFF_MS = 3 * 60_000
/** Cap stacked ability multipliers so bosses cannot one-shot from ability chains. */
const BOSS_ATK_MULT_CAP = 2.3

function applyAtkMult(current: number, factor: number, isBoss: boolean): number {
  const next = current * factor
  return isBoss ? Math.min(next, BOSS_ATK_MULT_CAP) : next
}

function getPhase2Abilities(floor: number): EnemyAbility[] {
  const abilities: EnemyAbility[] = [
    { id: 'molten_curse', nameRu: 'Раскалённое проклятие', cooldown: 4 },
    { id: 'armor_shatter', nameRu: 'Разрушение брони', cooldown: 5 },
    { id: 'inferno_wave', nameRu: 'Волна пламени', cooldown: 3 },
    { id: 'dark_regen', nameRu: 'Тёмная регенерация', cooldown: 5 },
  ]
  if (floor >= 10) abilities.push({ id: 'toxic_mist', nameRu: 'Токсичный туман', cooldown: 4 })
  if (floor >= 20) abilities.push({ id: 'void_rage', nameRu: 'Ярость бездны', cooldown: 6 })
  return abilities
}

export function executeEnemyAttack(
  combat: CombatState,
  playerStats: EffectiveStats,
  classId?: PlayerClass,
): EnemyAttackResult {
  const enemy = combat.enemy
  const floor = combat.floor
  let state = tickCooldowns(combat.enemyCombat ?? createEnemyCombatState())
  const logs: CombatLogEntry[] = []
  const abilities = getEnemyAbilities(enemy, floor)
  const phase2Abilities = combat.bossPhase === 2 ? getPhase2Abilities(floor) : []
  const debuffPresets: EnemyAttackResult['debuffPresets'] = []
  let playerDmg = 0

  // Poison tick from previous turns
  if (state.dotTurns > 0 && state.dotDamage > 0) {
    playerDmg += state.dotDamage
    logs.push(log(`☠️ Яд: −${state.dotDamage} HP`, 'enemy'))
    state = { ...state, dotTurns: state.dotTurns - 1 }
  }

  const pattern = enemy.pattern
  let dmgMult = pattern === 'berserker' ? 1.25 : pattern === 'defensive' ? 0.65 : 1
  let defIgnore = 0
  let atkMult = 1
  let lifeDrain = false
  let enemyHeal = 0
  const isBoss = !!enemy.isBoss

  if (state.fearedTurns && state.fearedTurns > 0) {
    atkMult *= 0.72
    state = { ...state, fearedTurns: state.fearedTurns - 1 }
    logs.push(log(`😨 ${enemy.name} дрожит от страха`, 'system'))
  }

  if (abilities.some((a) => a.id === 'blood_frenzy') && combat.enemyHp <= combat.enemyMaxHp * 0.5) {
    if (!state.enraged) {
      state = { ...state, enraged: true }
      logs.push(log(`🔥 ${enemy.name} впадает в кровожадность!`, 'system'))
    }
    if (state.enraged) atkMult *= 1.4
  }

  for (const ability of abilities) {
    if (ability.cooldown > 0 && !canUseAbility(state, ability)) continue

    switch (ability.id) {
      case 'rage_strike':
        atkMult = applyAtkMult(atkMult, 1.35, isBoss)
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`⚡ ${enemy.name}: ${ability.nameRu}!`, 'enemy'))
        break
      case 'iron_shell':
        if (state.shieldRemaining <= 0) {
          const shield = Math.floor(combat.enemyMaxHp * 0.22)
          state = { ...setCooldown(state, ability.id, ability.cooldown), shieldRemaining: shield }
          logs.push(log(`🛡️ ${enemy.name}: ${ability.nameRu} (+${shield} щита)`, 'system'))
        }
        break
      case 'flame_burst':
        atkMult = applyAtkMult(atkMult, 1.45, isBoss)
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`🔥 ${enemy.name}: ${ability.nameRu}!`, 'enemy'))
        break
      case 'venom_bite':
        state = {
          ...setCooldown(state, ability.id, ability.cooldown),
          dotTurns: 3,
          dotDamage: Math.max(4, Math.floor(enemy.stats.atk * 0.35)),
        }
        logs.push(log(`☠️ ${enemy.name}: ${ability.nameRu} (яд на 3 хода)`, 'enemy'))
        break
      case 'armor_break':
        defIgnore = 0.3
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`💥 ${enemy.name}: ${ability.nameRu} (игнор 30% защиты)`, 'enemy'))
        break
      case 'life_drain':
        atkMult *= 1.15
        lifeDrain = true
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`🩸 ${enemy.name}: ${ability.nameRu}`, 'enemy'))
        break
      case 'shadow_strike':
        atkMult = applyAtkMult(atkMult, 1.5, isBoss)
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`👤 ${enemy.name}: ${ability.nameRu}!`, 'enemy'))
        break
      case 'crippling_strike':
        atkMult = applyAtkMult(atkMult, 1.25, isBoss)
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`🗡️ ${enemy.name}: ${ability.nameRu}`, 'enemy'))
        break
      default:
        break
    }
  }

  for (const ability of phase2Abilities) {
    if (ability.cooldown > 0 && !canUseAbility(state, ability)) continue

    switch (ability.id) {
      case 'molten_curse':
        atkMult = applyAtkMult(atkMult, 1.12, isBoss)
        debuffPresets.push({ preset: 'boss_atk_down', durationMs: PHASE2_DEBUFF_MS })
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`🔥 ${enemy.name}: ${ability.nameRu} (−атака)`, 'enemy'))
        break
      case 'armor_shatter':
        defIgnore = Math.max(defIgnore, 0.35)
        debuffPresets.push({ preset: 'boss_def_down', durationMs: PHASE2_DEBUFF_MS })
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`💥 ${enemy.name}: ${ability.nameRu} (−защита)`, 'enemy'))
        break
      case 'inferno_wave':
        atkMult = applyAtkMult(atkMult, 1.28, isBoss)
        debuffPresets.push({ preset: 'boss_burn', durationMs: PHASE2_DEBUFF_MS })
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`🔥 ${enemy.name}: ${ability.nameRu}!`, 'enemy'))
        break
      case 'dark_regen': {
        const heal = Math.floor(combat.enemyMaxHp * 0.08)
        const shield = Math.floor(combat.enemyMaxHp * 0.1)
        enemyHeal += heal
        if (state.shieldRemaining <= 0) {
          state = { ...setCooldown(state, ability.id, ability.cooldown), shieldRemaining: shield }
        } else {
          state = setCooldown(state, ability.id, ability.cooldown)
        }
        logs.push(log(`💚 ${enemy.name}: ${ability.nameRu} (+${heal} HP, щит)`, 'system'))
        break
      }
      case 'toxic_mist':
        state = {
          ...setCooldown(state, ability.id, ability.cooldown),
          dotTurns: 4,
          dotDamage: Math.max(6, Math.floor(enemy.stats.atk * 0.45)),
        }
        debuffPresets.push({ preset: 'boss_poison', durationMs: PHASE2_DEBUFF_MS })
        logs.push(log(`☠️ ${enemy.name}: ${ability.nameRu} (яд 4 хода)`, 'enemy'))
        break
      case 'void_rage':
        atkMult = applyAtkMult(atkMult, 1.35, isBoss)
        state = { ...setCooldown(state, ability.id, ability.cooldown), enraged: true }
        logs.push(log(`🌑 ${enemy.name}: ${ability.nameRu}!`, 'enemy'))
        break
      default:
        break
    }
  }

  const effectiveDef = Math.floor(playerStats.def * (1 - defIgnore))
  const enemyDmg = calcMitigatedDamage(
    enemy.stats.atk * atkMult * dmgMult,
    effectiveDef,
    PLAYER_DEF_MITIGATION,
  )

  const dodge = rollDodge(playerStats, classId)

  if (dodge) {
    logs.push(log(`💨 Вы уклонились от атаки ${enemy.name}!`, 'system'))
  } else {
    playerDmg += enemyDmg
    if (lifeDrain) enemyHeal += Math.floor(enemyDmg * 0.2)
    logs.push(log(`🔴 ${enemy.name} нанёс вам ${enemyDmg} урона`, 'enemy'))
  }

  return {
    playerDmg,
    enemyHeal,
    logs,
    enemyCombat: state,
    debuffPresets: debuffPresets.length ? debuffPresets : undefined,
  }
}

export function absorbEnemyShield(
  state: EnemyCombatState | undefined,
  damage: number,
): { damage: number; state: EnemyCombatState; absorbed: number } {
  const s = state ?? createEnemyCombatState()
  if (s.shieldRemaining <= 0) return { damage, state: s, absorbed: 0 }
  const absorbed = Math.min(s.shieldRemaining, damage)
  return {
    damage: damage - absorbed,
    absorbed,
    state: { ...s, shieldRemaining: s.shieldRemaining - absorbed },
  }
}

export function formatEnemyAbilityHint(enemy: FloorEnemy, floor: number): string | null {
  const abilities = getEnemyAbilities(enemy, floor)
  if (abilities.length === 0) return null
  return abilities.map((a) => a.nameRu).join(' · ')
}
