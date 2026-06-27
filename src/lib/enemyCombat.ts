import type { CombatLogEntry, CombatState, FloorEnemy } from '@/types/game'
import type { EffectiveStats } from '@/lib/playerStats'

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
}

export function executeEnemyAttack(
  combat: CombatState,
  playerStats: EffectiveStats,
): EnemyAttackResult {
  const enemy = combat.enemy
  const floor = combat.floor
  let state = tickCooldowns(combat.enemyCombat ?? createEnemyCombatState())
  const logs: CombatLogEntry[] = []
  const abilities = getEnemyAbilities(enemy, floor)
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
        atkMult *= 1.65
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
        atkMult *= 1.75
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
        atkMult *= 2.1
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`👤 ${enemy.name}: ${ability.nameRu}!`, 'enemy'))
        break
      case 'crippling_strike':
        atkMult *= 1.35
        state = setCooldown(state, ability.id, ability.cooldown)
        logs.push(log(`🗡️ ${enemy.name}: ${ability.nameRu}`, 'enemy'))
        break
      default:
        break
    }
  }

  const effectiveDef = Math.floor(playerStats.def * (1 - defIgnore))
  const enemyDmg = Math.max(1, Math.floor(enemy.stats.atk * atkMult * dmgMult - effectiveDef * 0.35))

  const dodge = Math.random() < playerStats.speed * 0.008 + playerStats.stealth * 0.012
  let enemyHeal = 0

  if (dodge) {
    logs.push(log(`💨 Вы уклонились от атаки ${enemy.name}!`, 'system'))
  } else {
    playerDmg += enemyDmg
    if (lifeDrain) enemyHeal = Math.floor(enemyDmg * 0.2)
    logs.push(log(`🔴 ${enemy.name} нанёс вам ${enemyDmg} урона`, 'enemy'))
  }

  return { playerDmg, enemyHeal, logs, enemyCombat: state }
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
