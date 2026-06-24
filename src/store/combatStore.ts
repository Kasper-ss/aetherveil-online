import { create } from 'zustand'
import type { CombatState, CombatResult, FloorEnemy, SkillId, CombatLogEntry } from '@/types/game'
import type { OnlinePlayerSnapshot } from '@/lib/multiplayer'
import { SKILLS, generateVictoryLoot, generateCombatResources } from '@/data/gameData'
import { usePlayerStore } from './playerStore'
import { getEffectiveStats, getCombatMaxHp, getPlayerCurrentHp } from '@/lib/playerStats'
import { randomInt } from '@/lib/utils'

interface CombatStore {
  combat: CombatState | null
  isActive: boolean
  result: CombatResult | null
  showLootScreen: boolean
  tickInterval: ReturnType<typeof setInterval> | null

  startCombat: (enemy: FloorEnemy, floor: number, isBoss?: boolean) => void
  startPvpCombat: (opponent: OnlinePlayerSnapshot) => void
  playerAttack: () => void
  playerSkill: (skillId: SkillId) => void
  endCombat: (victory: boolean) => void
  claimLoot: () => void
  clearCombat: () => void
  tickCooldowns: () => void
}

function logEntry(text: string, type: CombatLogEntry['type']): CombatLogEntry {
  return { text, type }
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  combat: null,
  isActive: false,
  result: null,
  showLootScreen: false,
  tickInterval: null,

  startCombat: (enemy, floor, isBoss = false) => {
    const player = usePlayerStore.getState().player
    if (!player) return

    const maxHp = getCombatMaxHp(player)
    const startHp = Math.max(1, getPlayerCurrentHp(player))

    const combat: CombatState = {
      enemy,
      playerHp: startHp,
      playerMaxHp: maxHp,
      enemyHp: enemy.stats.hp,
      enemyMaxHp: enemy.stats.hp,
      combo: 0,
      skillCooldowns: {},
      isBoss: isBoss ?? !!enemy.isBoss,
      floor,
      combatLog: [logEntry(`⚔️ Бой начался: ${enemy.name}!`, 'system')],
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, tickInterval })
  },

  startPvpCombat: (opponent) => {
    const player = usePlayerStore.getState().player
    if (!player) return

    const maxHp = getCombatMaxHp(player)
    const startHp = Math.max(1, getPlayerCurrentHp(player))
    const enemy: FloorEnemy = {
      id: `pvp_${opponent.telegramId}`,
      name: opponent.displayName,
      pattern: 'aggressive',
      stats: {
        hp: opponent.maxHp,
        atk: opponent.stats.atk,
        def: opponent.stats.def,
        crit: opponent.stats.crit,
        speed: opponent.stats.speed,
      },
      expReward: 20 + opponent.level * 5,
      goldReward: [25, 55],
      lootTable: [],
    }

    const combat: CombatState = {
      enemy,
      playerHp: startHp,
      playerMaxHp: maxHp,
      enemyHp: opponent.maxHp,
      enemyMaxHp: opponent.maxHp,
      combo: 0,
      skillCooldowns: {},
      isBoss: false,
      floor: player.farmFloor,
      isPvp: true,
      pvpOpponentId: opponent.telegramId,
      combatLog: [logEntry(`⚔️ PvP: бой против ${opponent.displayName} (Ур.${opponent.level})!`, 'system')],
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, tickInterval })
  },

  playerAttack: () => {
    const { combat, isActive } = get()
    if (!combat || !isActive) return

    const player = usePlayerStore.getState().player
    if (!player) return

    const stats = getEffectiveStats(player)
    const comboBonus = 1 + combat.combo * 0.04
    const isCrit = Math.random() * 100 < stats.crit
    const baseDmg = stats.atk * comboBonus
    const rawDmg = Math.floor(baseDmg * (isCrit ? 2.2 : 1) - combat.enemy.stats.def * 0.4)
    const finalDmg = Math.max(1, rawDmg)
    const newEnemyHp = combat.enemyHp - finalDmg
    const newCombo = combat.combo + 1
    const logs = [...combat.combatLog]

    if (isCrit) {
      logs.push(logEntry(`💥 КРИТ! Вы нанесли ${finalDmg} урона ${combat.enemy.name}`, 'crit'))
    } else {
      logs.push(logEntry(`🗡️ Вы атаковали и нанесли ${finalDmg} урона`, 'player'))
    }

    if (newEnemyHp <= 0) {
      logs.push(logEntry(`✅ ${combat.enemy.name} повержен!`, 'system'))
      set({ combat: { ...combat, enemyHp: 0, combo: newCombo, combatLog: logs } })
      get().endCombat(true)
      return
    }

    // Enemy counter-attack (slower, more deliberate)
    const enemyDmg = Math.max(1, Math.floor(combat.enemy.stats.atk - stats.def * 0.35))
    const pattern = combat.enemy.pattern
    const dmgMult = pattern === 'berserker' ? 1.25 : pattern === 'defensive' ? 0.65 : 1
    const dodge = Math.random() < stats.speed * 0.008 + stats.stealth * 0.012
    let playerDmg = 0
    if (dodge) {
      logs.push(logEntry(`💨 Вы уклонились от атаки ${combat.enemy.name}!`, 'system'))
    } else {
      playerDmg = Math.floor(enemyDmg * dmgMult)
      logs.push(logEntry(`🔴 ${combat.enemy.name} нанёс вам ${playerDmg} урона`, 'enemy'))
    }
    const newPlayerHp = combat.playerHp - playerDmg

    if (newPlayerHp <= 0) {
      logs.push(logEntry('💀 Вы пали в бою...', 'system'))
      set({ combat: { ...combat, enemyHp: newEnemyHp, playerHp: 0, combo: newCombo, combatLog: logs } })
      get().endCombat(false)
      return
    }

    set({
      combat: {
        ...combat,
        enemyHp: newEnemyHp,
        playerHp: newPlayerHp,
        combo: newCombo,
        combatLog: logs.slice(-30),
        turn: combat.turn + 1,
      },
    })
  },

  playerSkill: (skillId) => {
    const { combat, isActive } = get()
    if (!combat || !isActive) return

    const skill = SKILLS[skillId]
    if (!skill) return
    if ((combat.skillCooldowns[skillId] ?? 0) > 0) return

    const player = usePlayerStore.getState().player
    if (!player || player.energy < skill.energyCost) return

    usePlayerStore.getState().spendEnergy(skill.energyCost)
    const logs = [...combat.combatLog]

    if (skillId === 'healing_light') {
      const heal = Math.floor(combat.playerMaxHp * 0.25)
      logs.push(logEntry(`💚 Исцеление: +${heal} HP`, 'heal'))
      set({
        combat: {
          ...combat,
          playerHp: Math.min(combat.playerMaxHp, combat.playerHp + heal),
          skillCooldowns: { ...combat.skillCooldowns, [skillId]: skill.cooldown },
          combatLog: logs.slice(-30),
        },
      })
      return
    }

    const stats = getEffectiveStats(player)
    const isCrit = Math.random() * 100 < stats.crit + 10
    const damage = Math.floor(stats.atk * skill.damageMultiplier * (isCrit ? 2 : 1) - combat.enemy.stats.def * 0.3)
    const finalDmg = Math.max(1, damage)
    const newEnemyHp = combat.enemyHp - finalDmg

    logs.push(logEntry(
      `✨ ${skill.nameRu}! ${isCrit ? 'КРИТ! ' : ''}Урон: ${finalDmg}`,
      isCrit ? 'crit' : 'skill'
    ))

    if (newEnemyHp <= 0) {
      logs.push(logEntry(`✅ ${combat.enemy.name} повержен!`, 'system'))
      set({
        combat: {
          ...combat, enemyHp: 0, combo: combat.combo + 3,
          skillCooldowns: { ...combat.skillCooldowns, [skillId]: skill.cooldown },
          combatLog: logs,
        },
      })
      get().endCombat(true)
      return
    }

    // Enemy counter after skill
    const enemyDmg = Math.max(1, Math.floor(combat.enemy.stats.atk * 0.8 - stats.def * 0.3))
    logs.push(logEntry(`🔴 ${combat.enemy.name} контратакует: ${enemyDmg} урона`, 'enemy'))
    const newPlayerHp = combat.playerHp - enemyDmg

    if (newPlayerHp <= 0) {
      get().endCombat(false)
      return
    }

    set({
      combat: {
        ...combat,
        enemyHp: newEnemyHp,
        playerHp: newPlayerHp,
        combo: combat.combo + 3,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: skill.cooldown },
        combatLog: logs.slice(-30),
        turn: combat.turn + 1,
      },
    })
  },

  endCombat: (victory) => {
    const { combat, tickInterval } = get()
    if (!combat) return
    if (tickInterval) clearInterval(tickInterval)

    let exp = 0, gold = 0
    const loot: import('@/types/game').Item[] = []
    let resources: CombatResult['resources'] = {}

    if (victory) {
      if (combat.isPvp) {
        exp = combat.enemy.expReward
        gold = randomInt(combat.enemy.goldReward[0], combat.enemy.goldReward[1])
        const p = usePlayerStore.getState().player
        if (p) {
          usePlayerStore.getState().addExp(exp)
          usePlayerStore.getState().addGold(gold)
          usePlayerStore.getState().updatePlayer({ pvpWins: p.pvpWins + 1 })
        }
      } else {
        exp = combat.enemy.expReward
        gold = randomInt(combat.enemy.goldReward[0], combat.enemy.goldReward[1])
        loot.push(...generateVictoryLoot(combat.floor, combat.isBoss))
        resources = generateCombatResources(combat.floor, combat.isBoss)
      }
    } else if (combat.isPvp) {
      const p = usePlayerStore.getState().player
      if (p) usePlayerStore.getState().updatePlayer({ pvpLosses: p.pvpLosses + 1 })
    }

    const result: CombatResult = {
      victory, exp, gold, loot, resources,
      comboMax: combat.combo,
      isBoss: combat.isBoss,
      lootClaimed: combat.isPvp ? true : false,
      mobKilled: victory && !combat.isBoss && !combat.isPvp,
    }

    if (!victory && !combat.isPvp) {
      usePlayerStore.getState().applyDeathPenalty()
    }

    const playerStore = usePlayerStore.getState()
    const maxHp = combat.playerMaxHp
    if (victory) {
      playerStore.updatePlayer({
        currentHp: combat.playerHp,
        hpLastRegenAt: new Date().toISOString(),
      })
    } else {
      playerStore.updatePlayer({
        currentHp: Math.max(1, Math.floor(maxHp * 0.05)),
        hpLastRegenAt: new Date().toISOString(),
      })
    }

    set({ isActive: false, result, showLootScreen: victory && !combat.isPvp, tickInterval: null })
  },

  claimLoot: () => {
    const { result, combat } = get()
    if (!result || !result.victory || result.lootClaimed) return

    const playerStore = usePlayerStore.getState()
    playerStore.applyCombatResult(result)

    if (result.mobKilled) {
      playerStore.recordMobKill(combat?.floor ?? playerStore.player?.farmFloor ?? 1)
    }

    if (combat?.isBoss) {
      playerStore.advanceFloor()
    }

    set({ result: { ...result, lootClaimed: true }, showLootScreen: false })
  },

  clearCombat: () => {
    const { tickInterval } = get()
    if (tickInterval) clearInterval(tickInterval)
    set({ combat: null, isActive: false, result: null, showLootScreen: false, tickInterval: null })
  },

  tickCooldowns: () => {
    const { combat } = get()
    if (!combat) return
    const cds = { ...combat.skillCooldowns }
    let changed = false
    for (const key of Object.keys(cds) as SkillId[]) {
      if (cds[key]! > 0) { cds[key] = cds[key]! - 1; changed = true }
    }
    if (changed) set({ combat: { ...combat, skillCooldowns: cds } })
  },
}))
