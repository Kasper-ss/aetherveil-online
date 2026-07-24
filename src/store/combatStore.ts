import { create } from 'zustand'
import type { CombatState, CombatResult, FloorEnemy, SkillId, UniversalSkillId, CombatLogEntry } from '@/types/game'
import type { OnlinePlayerSnapshot } from '@/lib/multiplayer'
import { getLootMultiplier } from '@/lib/playerBuffs'
import { SKILLS, generateVictoryLoot, generateCombatResources } from '@/data/gameData'
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
  buildPortalEnemy,
  getPortalFightLabel,
  PORTAL_ENERGY_COST,
  rollPortalAfterVictory,
} from '@/data/portals'
import {
  buildRaidEnemy,
  generateRaidLoot,
  generateRaidResources,
  getRaidsForFloor,
  RAID_BOSS_ENERGY,
  RAID_MOB_ENERGY,
  type RaidDefinition,
} from '@/data/raids'
import { getRaidFightType, getRaidProgress, parseRaidId } from '@/lib/raidProgress'
import {
  getWeakSpotDamageMultiplier,
  canUseWeakSpot,
  getProfessionScaledSkill,
  getProfessionCombatDamageMult,
  getProfessionCritDamageMult,
  getDebuffDamageMult,
  getCombatHideBonus,
  getCombatAetherDustBonus,
  hasLegendaryHuntBossLoot,
  getPotionHealMult,
} from '@/lib/professionBonuses'
import { calcMitigatedDamage, ENEMY_DEF_MITIGATION, PLAYER_DEF_MITIGATION } from '@/lib/combatDamage'
import { applyPlayerSkillDebuff, applyRacialSkillDebuff, tickPlayerSkillDebuffs, SKILL_DEBUFF_MAP, applyUniversalSkillDebuff } from '@/lib/skillDebuffs'
import { UNIVERSAL_SKILLS, getScaledUniversalSkill, getUniversalPassiveBonuses } from '@/data/universalSkillTree'
import { getRaceData } from '@/data/races'
import { getArenaDailyStatus } from '@/data/arena'
import { settleArenaOnServer } from '@/lib/multiplayerSync'

/** Global boost to player outgoing damage in combat. */
const PLAYER_DAMAGE_MULT = 1.12

function combatDamageMult(player: import('@/types/game').Player, combat: CombatState): number {
  const isBeast = !combat.isBoss && !combat.isPvp && !combat.isRaid && !combat.isWorldBoss
  const uni = getUniversalPassiveBonuses(player.universalSkillLevels ?? {})
  return getProfessionCombatDamageMult(player, {
    isBoss: !!combat.isBoss || !!combat.isWorldBoss,
    isBeast,
    combo: combat.combo,
  }) * uni.damageMult
}

function critDamageMult(isCrit: boolean, player: import('@/types/game').Player): number {
  return isCrit ? getProfessionCritDamageMult(player) : 1
}

interface CombatStore {
  combat: CombatState | null
  isActive: boolean
  result: CombatResult | null
  showLootScreen: boolean
  showRaidComplete: boolean
  raidStepComplete: boolean
  showPortalComplete: boolean
  portalStepComplete: boolean
  tickInterval: ReturnType<typeof setInterval> | null

  startCombat: (enemy: FloorEnemy, floor: number, isBoss?: boolean) => void
  startPortalCombat: () => boolean
  startRaidCombat: (def: RaidDefinition) => boolean
  continueRaidCombat: () => boolean
  startWorldBossCombat: () => boolean
  startPvpCombat: (opponent: OnlinePlayerSnapshot) => boolean
  playerAttack: () => void
  playerWeakSpot: () => void
  playerSkill: (skillId: SkillId) => void
  playerUniversalSkill: (skillId: UniversalSkillId) => void
  useConsumableInCombat: (itemId: ConsumableId) => boolean
  eatFoodInCombat: (itemId: string) => boolean
  useRacialAbilityInCombat: () => boolean
  fleeCombat: () => void
  endCombat: (victory: boolean) => void
  claimLoot: () => void
  claimRaidComplete: () => void
  claimPortalComplete: () => void
  clearRaidStep: () => void
  clearPortalStep: () => void
  clearCombat: () => void
  tickCooldowns: () => void
}

function logEntry(text: string, type: CombatLogEntry['type']): CombatLogEntry {
  return { text, type }
}

function clearCombatTimer(tickInterval: ReturnType<typeof setInterval> | null) {
  if (tickInterval) clearInterval(tickInterval)
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
  showPortalComplete: false,
  portalStepComplete: false,
  tickInterval: null,

  startCombat: (enemy, floor, isBoss = false) => {
    const prev = get()
    clearCombatTimer(prev.tickInterval)

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
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, showPortalComplete: false, portalStepComplete: false, tickInterval })
  },

  startPortalCombat: () => {
    clearCombatTimer(get().tickInterval)

    const playerStore = usePlayerStore.getState()
    const player = playerStore.player
    if (!player?.portalRun) return false
    if (getPlayerCurrentHp(player) < 1) return false

    const run = player.portalRun
    const isBoss = run.mobsKilled >= run.mobsRequired
    if (run.bossDefeated) return false
    if (!playerStore.spendEnergy(PORTAL_ENERGY_COST)) return false

    const enemy = buildPortalEnemy(run.floor, run.type, isBoss, run.mobsKilled)
    const maxHp = getCombatMaxHp(player)
    const startHp = Math.max(1, getPlayerCurrentHp(player))
    const scaledEnemy = scaleEnemyForPlayerPower(enemy, player, run.floor)
    const label = getPortalFightLabel(run.type, run.mobsKilled, run.mobsRequired, isBoss)

    const startLogs: CombatLogEntry[] = [
      logEntry(
        run.type === 'blue' ? '🌀 Синий портал' : '🔥 Красный портал',
        'system',
      ),
      logEntry(`${label}: ${scaledEnemy.name}!`, 'system'),
    ]
    const abilityHint = formatEnemyAbilityHint(scaledEnemy, run.floor)
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
      isPortal: true,
      portalType: run.type,
      floor: run.floor,
      bossPhase: isBoss && run.floor >= 5 ? 1 : undefined,
      enemyCombat: createEnemyCombatState(),
      combatLog: startLogs,
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, showPortalComplete: false, portalStepComplete: false, tickInterval })
    return true
  },

  startRaidCombat: (def) => {
    clearCombatTimer(get().tickInterval)

    const playerStore = usePlayerStore.getState()
    const player = playerStore.player
    if (!player) return false
    if (getPlayerCurrentHp(player) < 1) return false

    const preview = getRaidProgress(player, def.id)
    if (preview && getRaidFightType(preview) === 'done') return false

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
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, showPortalComplete: false, portalStepComplete: false, tickInterval })
    return true
  },

  continueRaidCombat: () => {
    const { combat, tickInterval } = get()
    if (!combat?.isRaid || !combat.raidId) return false

    const parsed = parseRaidId(combat.raidId)
    if (!parsed) return false

    const def = getRaidsForFloor(parsed.floor)[parsed.index]
    if (!def) return false

    if (tickInterval) clearInterval(tickInterval)
    set({ raidStepComplete: false, result: null, tickInterval: null })

    return get().startRaidCombat(def)
  },

  startWorldBossCombat: () => {
    clearCombatTimer(get().tickInterval)

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
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, showPortalComplete: false, portalStepComplete: false, tickInterval })
    return true
  },

  startPvpCombat: (opponent) => {
    if (!FEATURES.pvpArena) return false
    clearCombatTimer(get().tickInterval)

    const player = usePlayerStore.getState().player
    if (!player) return false

    const arenaStatus = getArenaDailyStatus(player)
    if (!arenaStatus.canFight) return false
    if (opponent.telegramId === player.telegramId) return false
    if (!usePlayerStore.getState().recordArenaFight()) return false

    const maxHp = getCombatMaxHp(player)
    const startHp = Math.max(1, getPlayerCurrentHp(player))
    const opponentGold = opponent.gold ?? 0
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
      goldReward: [0, 0],
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
      pvpOpponentGold: opponentGold,
      combatLog: [logEntry(`⚔️ PvP: бой против ${opponent.displayName} (Ур.${opponent.level})!`, 'system')],
      turn: 1,
    }

    const tickInterval = setInterval(() => get().tickCooldowns(), 1000)
    set({ combat, isActive: true, result: null, showLootScreen: false, showRaidComplete: false, raidStepComplete: false, showPortalComplete: false, portalStepComplete: false, tickInterval })
    return true
  },

  playerAttack: () => {
    const { combat, isActive } = get()
    if (!combat || !isActive) return

    const player = usePlayerStore.getState().player
    if (!player) return

    const stats = getEffectiveStats(player)
    const setEffects = getSetCombatEffects(player)
    const comboBonus = 1 + combat.combo * 0.04
    const profDmg = combatDamageMult(player, combat)
    const isCrit = rollCrit(Math.floor(stats.crit * setEffects.critChanceMult), player.classId)
    const levelEase = getPlayerCombatEase(player, combat.floor)
    const baseDmg = stats.atk * comboBonus * levelEase.playerDamageMult * PLAYER_DAMAGE_MULT * profDmg
    const rawDmg = calcMitigatedDamage(
      baseDmg * (isCrit ? 2.2 * critDamageMult(true, player) : 1),
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
    const profDmg = combatDamageMult(player, combat)
    const rawDmg = calcMitigatedDamage(
      stats.atk * mult * 1.8 * getPlayerCombatEase(player, combat.floor).playerDamageMult * PLAYER_DAMAGE_MULT * profDmg,
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
    if (!player) return
    const skillLevel = player.skillLevels[skillId] ?? 1
    const scaled = getProfessionScaledSkill(player, skill, skillLevel)
    if ((combat.skillCooldowns[skillId] ?? 0) > 0) return

    const manaCost = scaled.energyCost
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
      const stats = getEffectiveStats(player)
      const debuffType = SKILL_DEBUFF_MAP[skillId]
      const debuff = applyPlayerSkillDebuff(
        combat.enemyCombat,
        skillId,
        skillLevel,
        stats.atk,
        Math.max(scaled.healPercent, 0.5),
        debuffType ? getDebuffDamageMult(player, debuffType) : 1,
      )
      logs.push(logEntry(`💚 ${skill.nameRu}: +${heal} HP`, 'heal'))
      logs.push(logEntry(`✨ ${debuff.log}`, 'skill'))

      const afterHeal = {
        ...combat,
        playerHp: Math.min(combat.playerMaxHp, combat.playerHp + heal),
        enemyCombat: debuff.state,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
        combatLog: logs.slice(-30),
      }
      const enemyTurn = resolveEnemyTurn(afterHeal, stats)
      logs.push(...enemyTurn.logs)

      if (enemyTurn.playerHp <= 0) {
        get().endCombat(false)
        return
      }

      set({
        combat: {
          ...afterHeal,
          playerHp: enemyTurn.playerHp,
          enemyHp: enemyTurn.enemyHp,
          enemyCombat: enemyTurn.enemyCombat,
          combatLog: logs.slice(-30),
          turn: combat.turn + 1,
        },
      })
      return
    }

    const stats = getEffectiveStats(player)
    const setEffects = getSetCombatEffects(player)
    const isCrit = rollCrit(Math.floor((stats.crit + 10) * setEffects.critChanceMult), player.classId)
    const levelEase = getPlayerCombatEase(player, combat.floor)
    const profDmg = combatDamageMult(player, combat)
    let damage = calcMitigatedDamage(
      stats.atk * scaled.damageMultiplier * levelEase.playerDamageMult * PLAYER_DAMAGE_MULT * profDmg * (isCrit ? 2 * critDamageMult(true, player) : 1),
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

    const debuffType = SKILL_DEBUFF_MAP[skillId]
    const debuff = applyPlayerSkillDebuff(
      hit.enemyCombat,
      skillId,
      skillLevel,
      stats.atk,
      scaled.damageMultiplier,
      debuffType ? getDebuffDamageMult(player, debuffType) : 1,
    )
    logs.push(logEntry(debuff.log, 'skill'))

    if (newEnemyHp <= 0) {
      if (handleBossDefeated(get, set, combat, logs, {
        enemyHp: 0,
        playerHp: playerHpAfter,
        combo: combat.combo + 3,
        enemyCombat: debuff.state,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
      })) {
        return
      }
    }

    const afterHit = { ...combat, enemyHp: newEnemyHp, enemyCombat: debuff.state, playerHp: playerHpAfter }
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

  playerUniversalSkill: (skillId) => {
    const { combat, isActive } = get()
    if (!combat || !isActive) return

    const def = UNIVERSAL_SKILLS[skillId]
    if (!def || def.effect === 'passive') return
    const player = usePlayerStore.getState().player
    if (!player) return

    const skillLevel = player.universalSkillLevels?.[skillId] ?? 0
    if (skillLevel <= 0) return
    const scaled = getScaledUniversalSkill(def, skillLevel)
    if ((combat.skillCooldowns[skillId] ?? 0) > 0) return

    const manaCost = scaled.energyCost
    if (usesMana(player)) {
      if (getPlayerCurrentMana(player) < manaCost) return
    } else if (player.energy < manaCost) return

    const playerStore = usePlayerStore.getState()
    if (usesMana(player)) {
      if (!playerStore.spendMana(manaCost)) return
    } else {
      playerStore.spendEnergy(manaCost)
    }

    const logs = [...combat.combatLog]
    const stats = getEffectiveStats(player)

    if (scaled.healPercent > 0 && scaled.damageMultiplier === 0) {
      const heal = Math.floor(combat.playerMaxHp * scaled.healPercent)
      const debuff = applyUniversalSkillDebuff(combat.enemyCombat, skillId, skillLevel, stats.atk, Math.max(scaled.healPercent, 0.5))
      logs.push(logEntry(`💚 ${def.nameRu}: +${heal} HP`, 'heal'))
      logs.push(logEntry(`✨ ${debuff.log}`, 'skill'))
      const afterHeal = {
        ...combat,
        playerHp: Math.min(combat.playerMaxHp, combat.playerHp + heal),
        enemyCombat: debuff.state,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
      }
      const enemyTurn = resolveEnemyTurn(afterHeal, stats)
      logs.push(...enemyTurn.logs)
      if (enemyTurn.playerHp <= 0) { get().endCombat(false); return }
      set({ combat: { ...afterHeal, playerHp: enemyTurn.playerHp, enemyHp: enemyTurn.enemyHp, enemyCombat: enemyTurn.enemyCombat, combatLog: logs.slice(-30), turn: combat.turn + 1 } })
      return
    }

    const setEffects = getSetCombatEffects(player)
    const isCrit = rollCrit(Math.floor((stats.crit + 15) * setEffects.critChanceMult), player.classId)
    const levelEase = getPlayerCombatEase(player, combat.floor)
    const profDmg = combatDamageMult(player, combat)
    const defMult = skillId === 'u_rupture' || skillId === 'u_reality_rift' ? 0.6 : 1
    const rawDmg = calcMitigatedDamage(
      stats.atk * scaled.damageMultiplier * levelEase.playerDamageMult * PLAYER_DAMAGE_MULT * profDmg * (isCrit ? 2 * critDamageMult(true, player) : 1),
      combat.enemy.stats.def * defMult,
      ENEMY_DEF_MITIGATION,
    )
    const finalDmg = applySetDamageMultipliers(rawDmg, stats, setEffects)
    const hit = applyDamageToEnemy(combat, finalDmg, setEffects.fearOnHitChance)
    logs.push(...hit.logs)
    let playerHpAfter = combat.playerHp

    if (scaled.healPercent > 0 && scaled.damageMultiplier > 0) {
      const heal = skillId === 'u_vampirism' || skillId === 'u_mirror'
        ? Math.floor(finalDmg * (skillId === 'u_vampirism' ? 0.25 : 0.5) * (1 + (skillLevel - 1) * 0.1))
        : Math.floor(combat.playerMaxHp * scaled.healPercent)
      playerHpAfter = Math.min(combat.playerMaxHp, combat.playerHp + heal)
      if (heal > 0) logs.push(logEntry(`💚 +${heal} HP`, 'heal'))
    }

    logs.push(logEntry(`✨ ${def.nameRu}! ${isCrit ? 'КРИТ! ' : ''}Урон: ${finalDmg}`, isCrit ? 'crit' : 'skill'))
    const debuff = applyUniversalSkillDebuff(hit.enemyCombat, skillId, skillLevel, stats.atk, scaled.damageMultiplier)
    logs.push(logEntry(debuff.log, 'skill'))

    if (hit.enemyHp <= 0) {
      if (handleBossDefeated(get, set, combat, logs, {
        enemyHp: 0, playerHp: playerHpAfter, combo: combat.combo + 3,
        enemyCombat: debuff.state,
        skillCooldowns: { ...combat.skillCooldowns, [skillId]: scaled.cooldown },
      })) return
    }

    const afterHit = { ...combat, enemyHp: hit.enemyHp, enemyCombat: debuff.state, playerHp: playerHpAfter }
    const enemyTurn = resolveEnemyTurn(afterHit, stats)
    logs.push(...enemyTurn.logs)
    if (enemyTurn.playerHp <= 0) { get().endCombat(false); return }
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
      const heal = Math.min(
        Math.floor(consumed.healHp * getPotionHealMult(player)),
        combat.playerMaxHp - combat.playerHp,
      )
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

    if (player.raceId) {
      const raceData = getRaceData(player.raceId)
      const stats = getEffectiveStats(player)
      const debuff = applyRacialSkillDebuff(
        combat.enemyCombat,
        player.raceId,
        stats.atk,
        player.level,
        raceData?.abilityNameRu ?? 'Расовая способность',
      )
      logs.push(logEntry(debuff.log, 'skill'))
      set({ combat: { ...combat, enemyCombat: debuff.state, combatLog: logs.slice(-30) } })
      return true
    }

    set({ combat: { ...combat, combatLog: logs.slice(-30) } })
    return true
  },

  fleeCombat: () => {
    const { combat, isActive, tickInterval } = get()
    if (!combat || !isActive || combat.isPvp || combat.isWorldBoss) return
    if (combat.isBoss && !combat.isRaid && !combat.isPortal) return
    if (combat.isRaid && combat.isBoss) return
    if (tickInterval) clearInterval(tickInterval)

    const playerStore = usePlayerStore.getState()
    playerStore.updatePlayer({
      currentHp: combat.playerHp,
      hpLastRegenAt: new Date().toISOString(),
    })
    if (combat.isPortal) playerStore.failPortalRun()

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
        gold = 0
        const p = usePlayerStore.getState().player
        if (p) {
          usePlayerStore.getState().addExp(exp)
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
        const lootMult = pvePlayer ? getLootMultiplier(pvePlayer, isBoss) : 1
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
        const lootMultBase = pvePlayer ? getLootMultiplier(pvePlayer, combat.isBoss) : 1
        const isEpic = !!combat.enemy.isEpic
        const isMiniBoss = !!combat.enemy.isMiniBoss
        const portalMult = combat.isPortal
          ? (combat.portalType === 'red' ? 1.6 : 1.25)
          : 1
        const lootMult = lootMultBase * portalMult
        const treatAsEpic = isEpic || (combat.isPortal && combat.portalType === 'red' && !combat.isBoss)
        loot.push(...generateVictoryLoot(combat.floor, combat.isBoss, lootMult, treatAsEpic, isMiniBoss))
        resources = generateCombatResources(combat.floor, combat.isBoss, treatAsEpic, isMiniBoss, lootMult)
        if (pvePlayer) {
          const hideBonus = getCombatHideBonus(pvePlayer)
          if (hideBonus > 0 && resources.hide) resources.hide += hideBonus
          const dustBonus = getCombatAetherDustBonus(pvePlayer)
          if (dustBonus > 0) resources.aether_dust = (resources.aether_dust ?? 0) + dustBonus
          if (combat.isBoss && hasLegendaryHuntBossLoot(pvePlayer) && loot.length === 0) {
            const rare = generateVictoryLoot(combat.floor, true, lootMult * 1.5, true, false)
            if (rare.length) loot.push(rare[0])
          }
        }
      }
    } else if (combat.isPvp) {
      const p = usePlayerStore.getState().player
      if (p) usePlayerStore.getState().updatePlayer({ pvpLosses: p.pvpLosses + 1 })
      if (combat.pvpOpponentId) {
        void settleArenaOnServer({
          opponentId: combat.pvpOpponentId,
          victory: false,
          attackerName: p?.displayName,
        })
      }
    }

    let raidComplete = false
    let portalComplete = false
    if (victory && combat.isRaid && combat.raidId) {
      raidComplete = usePlayerStore.getState().recordRaidFightVictory(combat.raidId, {
        exp, gold, loot, resources, isBoss: !!combat.isBoss,
      })
    }
    if (victory && combat.isPortal) {
      portalComplete = usePlayerStore.getState().recordPortalFightVictory({
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
      isPortal: combat.isPortal,
      portalComplete,
      isPvp: combat.isPvp,
      pvpOpponentId: combat.pvpOpponentId,
      lootClaimed: combat.isPvp ? false : undefined,
      mobKilled: victory && !combat.isBoss && !combat.isPvp && !combat.isRaid && !combat.isPortal,
      killedBy: !victory ? combat.enemy.name : undefined,
      isEpic: combat.isEpic,
      isMiniBoss: combat.isMiniBoss,
    }

    if (!victory && combat.isRaid && combat.raidId) {
      usePlayerStore.getState().failRaid(combat.raidId)
    }
    if (!victory && combat.isPortal) {
      usePlayerStore.getState().failPortalRun()
    }

    if (!victory && !combat.isPvp && !combat.isRaid && !combat.isPortal) {
      usePlayerStore.getState().applyDeathPenalty(combat.enemy.name)
    }

    if (victory && combat.isWorldBoss) {
      usePlayerStore.getState().applyWorldBossVictory()
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
    const showPortalComplete = victory && !!combat.isPortal && portalComplete
    const portalStepComplete = victory && !!combat.isPortal && !portalComplete

    set({
      isActive: false,
      result,
      showLootScreen: victory && !combat.isPvp && !combat.isRaid && !combat.isPortal,
      showRaidComplete,
      raidStepComplete,
      showPortalComplete,
      portalStepComplete,
      tickInterval: null,
    })

    if (victory && !combat.isPvp && !combat.isRaid && !combat.isPortal) {
      const cave = rollSecretCaveAfterVictory(combat.floor, combat.isBoss)
      if (cave) {
        usePlayerStore.getState().updatePlayer({
          pendingSecretCave: { ...cave, claimedIndices: [] },
        })
      }
      const portal = rollPortalAfterVictory({
        floor: combat.floor,
        isBoss: !!combat.isBoss,
        isEpic: !!combat.isEpic,
        isMiniBoss: !!combat.isMiniBoss,
      })
      if (portal) {
        usePlayerStore.getState().updatePlayer({ pendingPortal: portal })
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

    set({ result: { ...result, lootClaimed: true }, showLootScreen: false })
  },

  claimRaidComplete: () => {
    const { result } = get()
    if (!result?.victory || !result.raidComplete || !result.raidId || result.lootClaimed) return
    usePlayerStore.getState().claimRaidRewards(result.raidId)
    set({ result: { ...result, lootClaimed: true }, showRaidComplete: false })
  },

  claimPortalComplete: () => {
    const { result } = get()
    if (!result?.victory || !result.portalComplete || result.lootClaimed) return
    usePlayerStore.getState().claimPortalRewards()
    set({ result: { ...result, lootClaimed: true }, showPortalComplete: false })
  },

  clearPortalStep: () => {
    set({ portalStepComplete: false, result: null })
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
      showPortalComplete: false, portalStepComplete: false,
      tickInterval: null,
    })
  },

  tickCooldowns: () => {
    const { combat, isActive } = get()
    if (!combat || !isActive || combat.isPvp) return

    const cds = { ...combat.skillCooldowns }
    let cdChanged = false
    for (const key of Object.keys(cds) as SkillId[]) {
      if (cds[key]! > 0) { cds[key] = cds[key]! - 1; cdChanged = true }
    }

    const debuffTick = tickPlayerSkillDebuffs(combat.enemyHp, combat.enemyCombat)
    if (!cdChanged && debuffTick.totalDamage === 0) return

    const logs = [...combat.combatLog, ...debuffTick.logs]
    let nextCombat: CombatState = {
      ...combat,
      skillCooldowns: cds,
      enemyHp: debuffTick.enemyHp,
      enemyCombat: debuffTick.state,
      combatLog: logs.slice(-30),
    }

    if (debuffTick.enemyHp <= 0 && debuffTick.totalDamage > 0) {
      if (handleBossDefeated(get, set, nextCombat, logs, {
        enemyHp: 0,
        enemyCombat: debuffTick.state,
        skillCooldowns: cds,
      })) {
        return
      }
    }

    set({ combat: nextCombat })
  },
}))
