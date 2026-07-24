import type { Player } from '@/types/game'
import { todayKey } from '@/lib/quests'

export const ARENA_DAILY_LIMIT = 10
export const ARENA_GOLD_STEAL_PCT = 0.01
/** Пауза между боями на арене */
export const ARENA_FIGHT_COOLDOWN_MS = 3 * 60 * 1000

export interface ArenaDailyStatus {
  fightsToday: number
  fightsLeft: number
  canFight: boolean
  cooldownMs: number
  dailyLimitReached: boolean
  nextDailyResetMs: number
  reason?: string
}

function msUntilUtcMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return tomorrow.getTime() - now.getTime()
}

export function normalizeArenaFields(player: Player): Pick<Player, 'arenaFightsToday' | 'arenaDayKey' | 'pvpGoldEarned'> {
  const today = todayKey()
  if (player.arenaDayKey !== today) {
    return {
      arenaFightsToday: 0,
      arenaDayKey: today,
      pvpGoldEarned: player.pvpGoldEarned ?? 0,
    }
  }
  return {
    arenaFightsToday: player.arenaFightsToday ?? 0,
    arenaDayKey: today,
    pvpGoldEarned: player.pvpGoldEarned ?? 0,
  }
}

export function getArenaDailyStatus(player: Player): ArenaDailyStatus {
  const state = normalizeArenaFields(player)
  const fightsToday = state.arenaFightsToday ?? 0
  const fightsLeft = Math.max(0, ARENA_DAILY_LIMIT - fightsToday)
  const dailyLimitReached = fightsLeft <= 0

  let fightCooldownMs = 0
  if (player.arenaLastFightAt) {
    const elapsed = Date.now() - new Date(player.arenaLastFightAt).getTime()
    fightCooldownMs = Math.max(0, ARENA_FIGHT_COOLDOWN_MS - elapsed)
  }

  const nextDailyResetMs = msUntilUtcMidnight()
  const cooldownMs = dailyLimitReached ? nextDailyResetMs : fightCooldownMs
  const canFight = fightsLeft > 0 && fightCooldownMs <= 0

  let reason: string | undefined
  if (dailyLimitReached) reason = 'Дневной лимит исчерпан'
  else if (fightCooldownMs > 0) reason = 'Подождите перед следующим боем'

  return {
    fightsToday,
    fightsLeft,
    canFight,
    cooldownMs,
    dailyLimitReached,
    nextDailyResetMs,
    reason,
  }
}

export function calcArenaGoldSteal(opponentGold: number): number {
  if (opponentGold <= 0) return 0
  return Math.max(1, Math.floor(opponentGold * ARENA_GOLD_STEAL_PCT))
}

export function formatArenaCountdown(ms: number): string {
  if (ms <= 0) return 'Готово'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}ч ${m}м ${s}с`
  if (m > 0) return `${m}м ${s}с`
  return `${s}с`
}
