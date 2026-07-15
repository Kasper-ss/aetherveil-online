import { create } from 'zustand'
import type { CombatState, CombatResult, FloorEnemy, SkillId, CombatLogEntry } from '@/types/game'
import type { OnlinePlayerSnapshot } from '@/lib/multiplayer'
import { getLootMultiplier } from '@/lib/playerBuffs'
import { SKILLS, generateVictoryLoot, generateCombatResources } from '@/data/gameData'
import { getScaledSkill } from '@/data/playerSkills'
import { usePlayerStore } from './playerStore'
import { getEffectiveStats, getCombatMaxHp, getPlayerCurrentHp, rollCrit, rollDodge } from '@/lib/playerStats'
import { getPlayerCurrentMana, usesMana } from '@/lib/mana'
import { randomInt } from '@/lib/utils'
import { CONSUMABLE_EFFECTS, type ConsumableId, isHpPotion, isEnergyDrink } from '@/lib/consumables'
import { formatFoodCombatLog } from '@/lib/foodBuffs'
import { FEATURES } from '@/lib/featureFlags'
import {
  absorbEnemyShield, createEnemyCombatState, executeEnemyAttack, formatEnemyAbilityHint,
} from '@/lib/enemyCombat'
import { handleBossDefeated } from '@/lib/bossPhases'
import { WORLD_BOSS_REWARDS, buildWorldBossEnemy, getWorldBossCooldown, isWorldBossUnlocked, getWorldBossRewardResources } from '@/data/worldBoss'
import { createItemInstance } from '@/data/items'
import { scaleEnemyForPlayerPower, getPlayerCombatEase, formatCombatEaseHint } from '@/lib/combatScaling'
import { applyCombatRewardEase } from '@/lib/combatRewards'
import { applyRacialAbility, canUseRacialAbility, rollDwarfTreasureFind, tickRacialCombatState } from '@/lib/racialAbilities'
import { applySetDamageMultipliers, getSetCombatEffects } from '@/lib/setCombatEffects'
import { rollSecretCaveAfterVictory } from '@/data/secretCave'
import {
  buildRaidEnemy,
  generateRaidLoot,
  generateRaidResources,
  RAID_BOSS_ENERGY,
  RAID_MOB_ENERGY,
  type RaidDefinition,
} from '@/data/raids'
import { getRaidFightType, getRaidProgress } from '@/lib/raidProgress'
import { getWeakSpotDamageMultiplier, canUseWeakSpot } from '@/lib/professionBonuses'
import { calcMitigatedDamage, ENEMY_DEF_MITIGATION, PLAYER_DEF_MITIGATION } from '@/lib/combatDamage'

/** Global boost to player outgoing damage in combat. */
const PLAYER_DAMAGE_MULT = 1.12

interface CombatStore {
  combat: CombatState | null
  isActive: boolean
  result: CombatResult | null
  showLootScreen: boolean
  showRaidComplete: boolean
  raidStepComplete: boolean
  tickInterval: ReturnType<typeof setInterval> | null

  startCombat: (enemy: FloorEnemy, floor: number, isBoss?: boolean) => void
  startRaidCombat: (def: RaidDefinition) => boolean
  startWorldBossCombat: () => boolean
  startPvpCombat: (opponent: OnlinePlayerSnapshot) => void
  playerAttack: () => void
  playerWeakSpot: () => void
  playerSkill: (skillId: SkillId) => void
  useConsumableInCombat: (itemId: ConsumableId) => boolean
  eatFoodInCombat: (itemId: string) => boolean
  useRacialAbilityInCombat: () => boolean
  fleeCombat: () => void
  endCombat: (victory: boolean) => void
  claimLoot: () => void
  claimRaidComplete: () => void
  clearRaidStep: () => void
  clearCombat: () => void
  tickCooldowns: () => void
}

function logEntry(text: string, type: CombatLogEntry['type']): CombatLogEntry {
  return { text, type }
}

function applyDamageToEnemy(
  combat: CombatState,
  rawDmg: number,
  fearChance = 0,
): {
  enemyHp: number
  enemyCombat: CombatState['enemyCombat']
  logs: CombatLogEntry[]
} {
  const shielded = absorbEnemyShield(combat.enemyCombat, rawDmg)
  const logs: CombatLogEntry[] = []
  if (shielded.absorbed > 0) {
    logs.push(logEntry(`🛡️ Щит поглотил ${shielded.absorbed} урона`, 'system'))
  }
  let enemyCombat = shielded.state
  if (fearChance > 0 && Math.random() < fearChance) {
    enemyCombat = { ...enemyCombat, fearedTurns: 3 }
    logs.push(logEntry(`😨 ${combat.enemy.name} охвачен страхом!`, 'system'))
  }
  return {
    enemyHp: combat.enemyHp - shielded.damage,
    enemyCombat,
    logs,
  }
}

function resolveEnemyTurn(combat: CombatState, stats: ReturnType<typeof getEffectiveStats>): {
  playerHp: number
  enemyHp: number
  enemyCombat: CombatState['enemyCombat']
  logs: CombatLogEntry[]
} {
  if (combat.isPvp) {
    const enemyDmg = calcMitigatedDamage(combat.enemy.stats.atk, stats.def, PLAYER_DEF_MITIGATION)
    const dodge = rollDodge(stats, usePlayerStore.getState().player?.classId)
    if (dodge) {
      return {
        playerHp: combat.playerHp,
        enemyHp: combat.enemyHp,
        enemyCombat: combat.enemyCombat,
        logs: [logEntry(`💨 Вы уклонились от атаки ${combat.enemy.name}!`, 'system')],
      }
    }
    return {
      playerHp: combat.playerHp - enemyDmg,
      enemyHp: combat.enemyHp,
      enemyCombat: combat.enemyCombat,
      logs: [logEntry(`🔴 ${combat.enemy.name} нанёс вам ${enemyDmg} урона`, 'enemy')],
    }
  }

  const result = executeEnemyAttack(combat, stats, usePlayerStore.getState().player?.classId)
  if (result.debuffPresets?.length) {
    const store = usePlayerStore.getState()
    for (const d of result.debuffPresets) {
      store.grantEffectPreset(d.preset, d.durationMs)
    }
  }
  const enemyHp = Math.min(combat.enemyMaxHp, combat.enemyHp + result.enemyHeal)
  return {
    playerHp: combat.playerHp - result.playerDmg,
    enemyHp,
    enemyCombat: result.enemyCombat,
    logs: result.logs,
  }
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  combat: null,
  isActive: false,
  result: null,
  showLootScreen: false,
  showRaidComplete: false,
  raidStepComplete: false,
  tickInterval: null,

  startCombat: (enemy, floor, isBoss = false) => {
    const player = usePlayerStore.getState().player
    if (!player) return

    const maxHp = getCombatMaxHp(player)
    const startHp = Math.max(1, getPlayerCurrentHp(player))

    const scaledEnemy = scaleEnemyForPlayerPower(enemy, player, floor)
    const easeHint = formatCombatEaseHint(player, floor)

    const startLogs: CombatLogEntry[] = [
      logEntry(
        scaledEnemy.isMiniBoss
          ? `👹 Мини-босс: ${scaledEnemy.name}!`
          : scaledEnemy.isEpic
            ? `⚡ Эпический противник: ${scaledEnemy.name}!`
            : `⚔️ Бой начался: ${scaledEnemy.name}!`,
        'system',
      ),
    ]
    if (easeHint) {
      startLogs.push(logEntry(`📈 ${easeHint}`, 'system'))
    }
    const abilityHint = formatEnemyAbilityHint(scaledEnemy, floor)
    if (abilityHint) {
      startLogs.push(logEntry(`⚠️ Способности: ${abilityHint}`, 'system'))
    }

    const combat: CombatState = {
      enemy: scaledEnemy,
      playerHp: startHp,
      playerMaxHp: maxHp,
      enemyHp: scaledEnemy.stats.hp,
      enemyMaxHp: scaledEnemy.stats.hp,
      combo: 0,
      skillCooldowns: {},
      isBoss: isBoss ?? !!scaledEnemy.isBoss,
      isEpic: !!scaledEnemy.isEpic,
      isMiniBoss: !!scaledEnemy.isMiniBoss,
      floor,
      bossPhase: (isBoss ?? !!scaledEnemy.isBoss) && floor >= 5 ? 1 : undefined,
      enemyCombat: createEnemyCombatState(),
      combatLog: startLogs,
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, tickInterval })
  },

  startRaidCombat: (def) => {
    const playerStore = usePlayerStore.getState()
    const player = playerStore.player
    if (!player) return false
    if (getPlayerCurrentHp(player) < 1) return false

    if (!playerStore.beginRaid(def)) return false

    const freshPlayer = playerStore.player!
    const current = getRaidProgress(freshPlayer, def.id)
    if (!current) return false

    const fightType = getRaidFightType(current)
    if (fightType === 'done') return false

    const isBoss = fightType === 'boss'
    const energyCost = isBoss ? RAID_BOSS_ENERGY : RAID_MOB_ENERGY
    if (!playerStore.spendEnergy(energyCost)) return false

    const enemy = buildRaidEnemy(def.floor, def.index, isBoss)
    const maxHp = getCombatMaxHp(freshPlayer)
    const startHp = Math.max(1, getPlayerCurrentHp(freshPlayer))

    const scaledEnemy = scaleEnemyForPlayerPower(enemy, freshPlayer, def.floor)
    const startLogs: CombatLogEntry[] = [
      logEntry(`🏰 Рейд: ${def.nameRu}`, 'system'),
      logEntry(
        isBoss
          ? `👑 Финальный босс рейда!`
          : `⚔️ Моб рейда · ${current.mobsKilled + 1}/50`,
        'system',
      ),
    ]
    const abilityHint = formatEnemyAbilityHint(scaledEnemy, def.floor)
    if (abilityHint) startLogs.push(logEntry(`⚠️ Способности: ${abilityHint}`, 'system'))

    const combat: CombatState = {
      enemy: scaledEnemy,
      playerHp: startHp,
      playerMaxHp: maxHp,
      enemyHp: scaledEnemy.stats.hp,
      enemyMaxHp: scaledEnemy.stats.hp,
      combo: 0,
      skillCooldowns: {},
      isBoss,
      isRaid: true,
      raidId: def.id,
      floor: def.floor,
      bossPhase: isBoss && def.floor >= 5 ? 1 : undefined,
      enemyCombat: createEnemyCombatState(),
      combatLog: startLogs,
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, tickInterval })
    return true
  },

  startWorldBossCombat: () => {
    const player = usePlayerStore.getState().player
    if (!player) return false
    if (!isWorldBossUnlocked(player)) return false
    if (!getWorldBossCooldown(player).canFight) return false
    if (getPlayerCurrentHp(player) < 1) return false
    if (!usePlayerStore.getState().spendEnergy(15)) return false

    const enemy = buildWorldBossEnemy(player)
    const scaleFloor = Math.max(25, player.highestFloor)
    const maxHp = getCombatMaxHp(player)
    const startHp = Math.max(1, getPlayerCurrentHp(player))
    const startLogs: CombatLogEntry[] = [
      logEntry('🌌 Мировой Босс: Архонт Эфирной Бездны!', 'system'),
      logEntry('⚠️ Двухфазный бой — вторая фаза с дебаффами и усилениями!', 'system'),
    ]
    const abilityHint = formatEnemyAbilityHint(enemy, scaleFloor)
    if (abilityHint) startLogs.push(logEntry(`⚠️ Способности: ${abilityHint}`, 'system'))

    const combat: CombatState = {
      enemy,
      playerHp: startHp,
      playerMaxHp: maxHp,
      enemyHp: enemy.stats.hp,
      enemyMaxHp: enemy.stats.hp,
      combo: 0,
      skillCooldowns: {},
      isBoss: true,
      isWorldBoss: true,
      bossPhase: 1,
      floor: scaleFloor,
      enemyCombat: createEnemyCombatState(),
      combatLog: startLogs,
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, tickInterval })
    return true
  },

  startPvpCombat: (opponent) => {
    if (!FEATURES.pvpArena) return
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
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, tickInterval })
  },

  playerAttack: () => {
    const { combat, isActive } = get()
    if (!combat || !isActive) return

    const player = usePlayerStore.getState().player
    if (!player) return

    const stats = getEffectiveStats(player)
    const setEffects = getSetCombatEffects(player)
    const comboBonus = 1 + combat.combo * 0.04
    const isCrit = rollCrit(Math.floor(stats.crit * setEffects.critChanceMult), player.classId)
    const levelEase = getPlayerCombatEase(player, combat.floor)
    const baseDmg = stats.atk * comboBonus * levelEase.playerDamageMult * PLAYER_DAMAGE_MULT
    const rawDmg = calcMitigatedDamage(
      baseDmg * (isCrit ? 2.2 : 1),
      combat.enemy.stats.def,
      ENEMY_DEF_MITIGATION,
    )
    const finalDmg = applySetDamageMultipliers(rawDmg, stats, setEffects)
    const hit = applyDamageToEnemy(combat, finalDmg, setEffects.fearOnHitChance)
    const newEnemyHp = hit.enemyHp
    const newCombo = combat.combo + 1
    const logs = [...combat.combatLog, ...hit.logs]

    if (isCrit) {
      logs.push(logEntry(`💥 КРИТ! Вы нанесли ${finalDmg} урона ${combat.enemy.name}`, 'crit'))
    } else {
      logs.push(logEntry(`🗡️ Вы атаковали и нанесли ${finalDmg} урона`, 'player'))
    }

    if (newEnemyHp <= 0) {
      if (handleBossDefeated(get, set, combat, logs, { enemyHp: 0, combo: newCombo, enemyCombat: hit.enemyCombat })) {
        return
      }
    }

    const afterHit = { ...combat, enemyHp: newEnemyHp, enemyCombat: hit.enemyCombat }
    const enemyTurn = resolveEnemyTurn(afterHit, stats)
    logs.push(...enemyTurn.logs)
    const newPlayerHp = enemyTurn.playerHp

    if (newPlayerHp <= 0) {
      logs.push(logEntry('💀 Вы пали в бою...', 'system'))
      set({
        combat: {
          ...afterHit,
          enemyHp: enemyTurn.enemyHp,
          playerHp: 0,
          combo: newCombo,
          enemyCombat: enemyTurn.enemyCombat,
          combatLog: logs,
        },
      })
      get().endCombat(false)
      return
    }

    set({
      combat: {
        ...afterHit,
        enemyHp: enemyTurn.enemyHp,
        playerHp: newPlayerHp,
        combo: newCombo,
        enemyCombat: enemyTurn.enemyCombat,
        combatLog: logs.slice(-30),
        turn: combat.turn + 1,
      },
    })
  },

  playerWeakSpot: () => {
    const { combat, isActive } = get()
    if (!combat || !isActive || combat.weakSpotUsed || combat.isPvp) return

    const player = usePlayerStore.getState().player
    if (!player) return
    if (!canUseWeakSpot(player)) return

    const stats = getEffectiveStats(player)
    const setEffects = getSetCombatEffects(player)
    const mult = getWeakSpotDamageMultiplier(player)
    const rawDmg = calcMitigatedDamage(
      stats.atk * mult * 1.8 * getPlayerCombatEase(player, combat.floor).playerDamageMult * PLAYER_DAMAGE_MULT,
      combat.enemy.stats.def * 0.65,
      ENEMY_DEF_MITIGATION,
    )
    const finalDmg = applySetDamageMultipliers(rawDmg, stats, setEffects)
    const hit = applyDamageToEnemy(combat, finalDmg, setEffects.fearOnHitChance)
    const logs = [
      ...combat.combatLog,
      ...hit.logs,
      logEntry(`🎯 Слабое место! Критический удар: ${finalDmg} урона`, 'crit'),
    ]

    if (hit.enemyHp <= 0) {
      if (handleBossDefeated(get, set, { ...combat, weakSpotUsed: true }, logs, { enemyHp: 0, combo: combat.combo + 1, enemyCombat: hit.enemyCombat })) {
        return
      }
    }

    const afterHit = { ...combat, enemyHp: hit.enemyHp, enemyCombat: hit.enemyCombat, weakSpotUsed: true }
    const enemyTurn = resolveEnemyTurn(afterHit, stats)
    logs.push(...enemyTurn.logs)

    if (enemyTurn.playerHp <= 0) {
      get().endCombat(false)
      return
    }

    set({
      combat: {
        ...afterHit,
        enemyHp: enemyTurn.enemyHp,
        playerHp: enemyTurn.playerHp,
        combo: combat.combo + 1,
        enemyCombat: enemyTurn.enemyCombat,
        combatLog: logs.slice(-30),
        turn: combat.turn + 1,
        weakSpotUsed: true,
      },
    })
  },

  playerSkill: (skillId) => {
    const { combat, isActive } = get()
    if (!combat || !isActive) return

    const skill = SKILLS[skillId]
    if (!skill) return
    const player = usePlayerStore.getState().player
    const skillLevel = player?.skillLevels[skillId] ?? 1
    const scaled = getScaledSkill(skill, skillLevel)
    if ((combat.skillCooldowns[skillId] ?? 0) > 0) return

    const manaCost = scaled.energyCost
    if (!player) return
    if (usesMana(player)) {
      if (getPlayerCurrentMana(player) < manaCost) return
    } else if (player.energy < manaCost) {
      return
    }

    const playerStore = usePlayerStore.getState()
    if (usesMana(player)) {
      if (!playerStore.spendMana(manaCost)) return
    } else {
      playerStore.spendEnergy(manaCost)
    }
    const logs = [...combat.combatLog]

    if (scaled.healPercent > 0 && skill.damageMultiplier === 0) {
      const heal = Math.floor(combat.playerMaxHp * scaled.healPercent)
      logs.push(logEntry(`💚 ${skill.nameRu}: +${heal} HP`, 'heal'))
      set({
        combat: {
          ...combat,
          playerHp: Math.min(combat.playerMaxHp, combat.playerHp + heal),
          skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
          combatLog: logs.slice(-30),
        },
      })
      return
    }

    const stats = getEffectiveStats(player)
    const setEffects = getSetCombatEffects(player)
    const isCrit = rollCrit(Math.floor((stats.crit + 10) * setEffects.critChanceMult), player.classId)
    const levelEase = getPlayerCombatEase(player, combat.floor)
    let damage = calcMitigatedDamage(
      stats.atk * scaled.damageMultiplier * levelEase.playerDamageMult * PLAYER_DAMAGE_MULT * (isCrit ? 2 : 1),
      combat.enemy.stats.def,
      ENEMY_DEF_MITIGATION,
    )
    const finalDmg = applySetDamageMultipliers(damage, stats, setEffects)
    const hit = applyDamageToEnemy(combat, finalDmg, setEffects.fearOnHitChance)
    logs.push(...hit.logs)
    const newEnemyHp = hit.enemyHp
    let playerHpAfter = combat.playerHp

    if (scaled.healPercent > 0 && skill.damageMultiplier > 0) {
      const heal = Math.floor(combat.playerMaxHp * scaled.healPercent)
      playerHpAfter = Math.min(combat.playerMaxHp, combat.playerHp + heal)
      logs.push(logEntry(`💚 +${heal} HP`, 'heal'))
    }

    logs.push(logEntry(
      `✨ ${skill.nameRu}! ${isCrit ? 'КРИТ! ' : ''}Урон: ${finalDmg}`,
      isCrit ? 'crit' : 'skill'
    ))

    if (newEnemyHp <= 0) {
      if (handleBossDefeated(get, set, combat, logs, {
        enemyHp: 0,
        playerHp: playerHpAfter,
        combo: combat.combo + 3,
        enemyCombat: hit.enemyCombat,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
      })) {
        return
      }
    }

    const afterHit = { ...combat, enemyHp: newEnemyHp, enemyCombat: hit.enemyCombat, playerHp: playerHpAfter }
    const enemyTurn = resolveEnemyTurn(afterHit, stats)
    logs.push(...enemyTurn.logs)

    if (enemyTurn.playerHp <= 0) {
      logs.push(logEntry('💀 Вы пали в бою...', 'system'))
      set({
        combat: {
          ...afterHit,
          enemyHp: enemyTurn.enemyHp,
          playerHp: 0,
          combo: combat.combo + 3,
          enemyCombat: enemyTurn.enemyCombat,
          skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
          combatLog: logs,
        },
      })
      get().endCombat(false)
      return
    }

    set({
      combat: {
        ...afterHit,
        enemyHp: enemyTurn.enemyHp,
        playerHp: enemyTurn.playerHp,
        combo: combat.combo + 3,
        enemyCombat: enemyTurn.enemyCombat,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
        combatLog: logs.slice(-30),
        turn: combat.turn + 1,
      },
    })
  },

  useConsumableInCombat: (itemId) => {
    const { combat, isActive } = get()
    if (!combat || !isActive || combat.isPvp) return false

    const effect = CONSUMABLE_EFFECTS[itemId]
    if (!effect) return false

    const playerStore = usePlayerStore.getState()
    const player = playerStore.player
    if (!player) return false

    if (isHpPotion(itemId)) {
      if (combat.playerHp >= combat.playerMaxHp) return false
      const consumed = playerStore.consumeConsumable(itemId as ConsumableId, {
        combatHp: combat.playerHp,
        combatMaxHp: combat.playerMaxHp,
      })
      if (!consumed?.healHp) return false
      const heal = Math.min(consumed.healHp, combat.playerMaxHp - combat.playerHp)
      const pct = Math.round((CONSUMABLE_EFFECTS[itemId as ConsumableId]?.healPercent ?? 0.5) * 100)
      const logs = [...combat.combatLog, logEntry(`🧪 Зелье HP (+${pct}%): +${heal} HP`, 'heal')]
      set({
        combat: {
          ...combat,
          playerHp: combat.playerHp + heal,
          combatLog: logs.slice(-30),
        },
      })
      return true
    }

    if (isEnergyDrink(itemId)) {
      const consumed = playerStore.consumeConsumable(itemId as ConsumableId)
      if (!consumed?.energy) return false
      const logs = [...combat.combatLog, logEntry(`⚡ Энергетик: +${consumed.energy} энергии`, 'heal')]
      set({ combat: { ...combat, combatLog: logs.slice(-30) } })
      return true
    }

    return false
  },

  eatFoodInCombat: (itemId) => {
    const { combat, isActive } = get()
    if (!combat || !isActive || combat.isPvp) return false

    const playerStore = usePlayerStore.getState()
    if (!playerStore.eatFood(itemId)) return false

    const player = playerStore.player!
    const newMaxHp = getCombatMaxHp(player)
    const hpGain = Math.max(0, newMaxHp - combat.playerMaxHp)
    const logs = [...combat.combatLog, logEntry(formatFoodCombatLog(itemId, hpGain), 'heal')]

    set({
      combat: {
        ...combat,
        playerMaxHp: newMaxHp,
        playerHp: Math.min(newMaxHp, combat.playerHp + hpGain),
        combatLog: logs.slice(-30),
      },
    })
    return true
  },

  useRacialAbilityInCombat: () => {
    const { combat, isActive } = get()
    if (!combat || !isActive || combat.isPvp) return false
    const playerStore = usePlayerStore.getState()
    const player = playerStore.player
    if (!player || !canUseRacialAbility(player)) return false
    const applied = applyRacialAbility(player)
    playerStore.updatePlayer(applied.player)
    const logs = [...combat.combatLog, logEntry(applied.log, 'skill')]
    set({ combat: { ...combat, combatLog: logs.slice(-30) } })
    return true
  },

  fleeCombat: () => {
    const { combat, isActive, tickInterval } = get()
    if (!combat || !isActive || combat.isPvp || combat.isWorldBoss) return
    if (combat.isBoss && !combat.isRaid) return
    if (combat.isRaid && combat.isBoss) return
    if (tickInterval) clearInterval(tickInterval)

    const playerStore = usePlayerStore.getState()
    playerStore.updatePlayer({
      currentHp: combat.playerHp,
      hpLastRegenAt: new Date().toISOString(),
    })

    const result: CombatResult = {
      victory: false,
      exp: 0,
      gold: 0,
      loot: [],
      resources: {},
      comboMax: combat.combo,
      fled: true,
    }

    set({ isActive: false, result, showLootScreen: false, tickInterval: null })
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
          usePlayerStore.getState().trackQuestEvent('pvp_win', 1)
        }
      } else if (combat.isWorldBoss) {
        exp = combat.enemy.expReward
        gold = WORLD_BOSS_REWARDS.gold
        const sword = createItemInstance('aether_worldbreaker')
        const p = usePlayerStore.getState().player
        const hasSword = p && (
          p.inventory.some((i) => i.id === 'aether_worldbreaker')
          || p.equipped.weapon?.id === 'aether_worldbreaker'
        )
        if (sword && !hasSword) loot.push(sword)
        resources = getWorldBossRewardResources()
      } else if (combat.isRaid && combat.raidId) {
        const pvePlayer = usePlayerStore.getState().player
        const isBoss = combat.isBoss
        const rawExp = combat.enemy.expReward
        const rawGold = randomInt(combat.enemy.goldReward[0], combat.enemy.goldReward[1])
        const eased = pvePlayer
          ? applyCombatRewardEase(rawExp, rawGold, pvePlayer.level, combat.floor)
          : { exp: rawExp, gold: rawGold }
        exp = eased.exp
        gold = eased.gold
        const lootMult = pvePlayer ? getLootMultiplier(pvePlayer) : 1
        loot.push(...generateRaidLoot(combat.floor, isBoss, lootMult))
        resources = generateRaidResources(combat.floor, isBoss, lootMult)
      } else {
        const pvePlayer = usePlayerStore.getState().player
        const rawExp = combat.enemy.expReward
        const rawGold = randomInt(combat.enemy.goldReward[0], combat.enemy.goldReward[1])
        const eased = pvePlayer
          ? applyCombatRewardEase(rawExp, rawGold, pvePlayer.level, combat.floor)
          : { exp: rawExp, gold: rawGold }
        exp = eased.exp
        gold = eased.gold
        if (pvePlayer?.raceId === 'dwarf') {
          const treasure = rollDwarfTreasureFind('dwarf')
          if (treasure) gold += treasure.gold
        }
        const lootMult = pvePlayer ? getLootMultiplier(pvePlayer) : 1
        const isEpic = !!combat.enemy.isEpic
        const isMiniBoss = !!combat.enemy.isMiniBoss
        loot.push(...generateVictoryLoot(combat.floor, combat.isBoss, lootMult, isEpic, isMiniBoss))
        resources = generateCombatResources(combat.floor, combat.isBoss, isEpic, isMiniBoss, lootMult)
      }
    } else if (combat.isPvp) {
      const p = usePlayerStore.getState().player
      if (p) usePlayerStore.getState().updatePlayer({ pvpLosses: p.pvpLosses + 1 })
    }

    let raidComplete = false
    if (victory && combat.isRaid && combat.raidId) {
      raidComplete = usePlayerStore.getState().recordRaidFightVictory(combat.raidId, {
        exp, gold, loot, resources, isBoss: !!combat.isBoss,
      })
    }

    const result: CombatResult = {
      victory, exp, gold, loot, resources,
      comboMax: combat.combo,
      isBoss: combat.isBoss,
      isWorldBoss: combat.isWorldBoss,
      isRaid: combat.isRaid,
      raidId: combat.raidId,
      raidComplete,
      lootClaimed: combat.isPvp ? true : false,
      mobKilled: victory && !combat.isBoss && !combat.isPvp && !combat.isRaid,
      killedBy: !victory ? combat.enemy.name : undefined,
      isEpic: combat.isEpic,
      isMiniBoss: combat.isMiniBoss,
    }

    if (!victory && combat.isRaid && combat.raidId) {
      usePlayerStore.getState().failRaid(combat.raidId)
    }

    if (!victory && !combat.isPvp && !combat.isRaid) {
      usePlayerStore.getState().applyDeathPenalty(combat.enemy.name)
    } else if (!victory && !combat.isPvp && combat.isRaid) {
      usePlayerStore.getState().applyDeathPenalty(combat.enemy.name)
    }

    if (victory && !combat.isPvp && !combat.isBoss && !combat.isRaid) {
      const p = usePlayerStore.getState().player
      if (p) {
        const racialTick = tickRacialCombatState(p)
        const updates = { ...racialTick } as Partial<import('@/types/game').Player>
        if (p.raceId === 'undead') updates.pendingCannibalize = true
        usePlayerStore.getState().updatePlayer(updates)
      }
    }

    if (!combat.isPvp) {
      usePlayerStore.getState().applyCombatDurabilityWear(victory, combat.isBoss)
    }

    const playerStore = usePlayerStore.getState()
    if (victory) {
      const player = playerStore.player
      if (player) {
        const newMaxHp = getCombatMaxHp(player)
        const tookDamage = combat.playerHp < combat.playerMaxHp
        const newCurrentHp = tookDamage
          ? Math.max(1, Math.min(newMaxHp, Math.round((combat.playerHp / combat.playerMaxHp) * newMaxHp)))
          : newMaxHp
        playerStore.updatePlayer({
          currentHp: newCurrentHp,
          hpLastRegenAt: new Date().toISOString(),
        })
      }
    }
    // Death penalty handler sets full HP respawn

    const showRaidComplete = victory && !!combat.isRaid && raidComplete
    const raidStepComplete = victory && !!combat.isRaid && !raidComplete

    set({
      isActive: false,
      result,
      showLootScreen: victory && !combat.isPvp && !combat.isRaid,
      showRaidComplete,
      raidStepComplete,
      tickInterval: null,
    })

    if (victory && !combat.isPvp && !combat.isRaid) {
      const cave = rollSecretCaveAfterVictory(combat.floor, combat.isBoss)
      if (cave) {
        usePlayerStore.getState().updatePlayer({
          pendingSecretCave: { ...cave, claimedIndices: [] },
        })
      }
    }
  },

  claimLoot: () => {
    const { result, combat } = get()
    if (!result || !result.victory || result.lootClaimed) return

    const playerStore = usePlayerStore.getState()
    playerStore.applyCombatResult(result)

    if (result.mobKilled) {
      playerStore.recordMobKill(combat?.floor ?? playerStore.player?.farmFloor ?? 1)
    }

    if (result.isMiniBoss && combat?.floor) {
      playerStore.recordMiniBossKill(combat.floor)
    }

    if (combat?.isBoss && !combat.isWorldBoss && combat.floor) {
      playerStore.advanceFloor(combat.floor)
      playerStore.awardBossTrophy(combat.floor)
    }

    if (combat?.isWorldBoss) {
      playerStore.applyWorldBossVictory()
    }

    set({ result: { ...result, lootClaimed: true }, showLootScreen: false })
  },

  claimRaidComplete: () => {
    const { result } = get()
    if (!result?.victory || !result.raidComplete || !result.raidId || result.lootClaimed) return
    usePlayerStore.getState().claimRaidRewards(result.raidId)
    set({ result: { ...result, lootClaimed: true }, showRaidComplete: false })
  },

  clearRaidStep: () => {
    set({ raidStepComplete: false, result: null })
  },

  clearCombat: () => {
    const { tickInterval } = get()
    if (tickInterval) clearInterval(tickInterval)
    set({
      combat: null, isActive: false, result: null,
      showLootScreen: false, showRaidComplete: false, raidStepComplete: false,
      tickInterval: null,
    })
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
