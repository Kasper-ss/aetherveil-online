import type { Player } from '@/types/game'

/** Мировой босс появляется каждые 3 дня; окно боя — 24 часа. */
export const WORLD_BOSS_CYCLE_MS = 3 * 24 * 60 * 60 * 1000
export const WORLD_BOSS_ACTIVE_MS = 24 * 60 * 60 * 1000
const WORLD_BOSS_EPOCH = Date.UTC(2026, 0, 1, 12, 0, 0)

export interface WorldBossSchedule {
  spawnIndex: number
  isActive: boolean
  spawnAt: number
  windowEndsAt: number
  nextSpawnAt: number
  daysUntilNext: number
  msUntilNext: number
}

export function getWorldBossSpawnIndex(now = Date.now()): number {
  return Math.floor((now - WORLD_BOSS_EPOCH) / WORLD_BOSS_CYCLE_MS)
}

export function getWorldBossSpawnTime(spawnIndex: number): number {
  return WORLD_BOSS_EPOCH + spawnIndex * WORLD_BOSS_CYCLE_MS
}

export function getWorldBossSchedule(now = Date.now()): WorldBossSchedule {
  const spawnIndex = getWorldBossSpawnIndex(now)
  const spawnAt = getWorldBossSpawnTime(spawnIndex)
  const windowEndsAt = spawnAt + WORLD_BOSS_ACTIVE_MS
  const isActive = now >= spawnAt && now < windowEndsAt
  const nextSpawnAt = isActive ? getWorldBossSpawnTime(spawnIndex + 1) : (now < spawnAt ? spawnAt : getWorldBossSpawnTime(spawnIndex + 1))
  const msUntilNext = Math.max(0, nextSpawnAt - now)
  const daysUntilNext = Math.ceil(msUntilNext / (24 * 60 * 60 * 1000))
  return { spawnIndex, isActive, spawnAt, windowEndsAt, nextSpawnAt, daysUntilNext, msUntilNext }
}

export function canFightWorldBoss(player: Player, now = Date.now()): boolean {
  if (player.highestFloor < 25) return false
  const schedule = getWorldBossSchedule(now)
  if (!schedule.isActive) return false
  return (player.worldBossLastSpawnIndex ?? -1) !== schedule.spawnIndex
}

export function getWorldBossNotification(now = Date.now()): { key: string; text: string } | null {
  const schedule = getWorldBossSchedule(now)
  const nextIndex = schedule.isActive ? schedule.spawnIndex : getWorldBossSpawnIndex(schedule.nextSpawnAt)

  if (schedule.isActive) {
    return {
      key: `wb_today_${schedule.spawnIndex}`,
      text: 'Сегодня будет Мировой Босс! Архонт Эфирной Бездны открыт для боя.',
    }
  }

  const days = schedule.daysUntilNext
  if (days === 3) {
    return { key: `wb_d3_${nextIndex}`, text: 'Через 3 дня появится Мировой Босс — Архонт Эфирной Бездны!' }
  }
  if (days === 2) {
    return { key: `wb_d2_${nextIndex}`, text: 'Через 2 дня появится Мировой Босс!' }
  }
  if (days === 1) {
    return { key: `wb_d1_${nextIndex}`, text: 'Через 1 день появится Мировой Босс!' }
  }
  return null
}

export function formatWorldBossCountdown(ms: number): string {
  if (ms <= 0) return 'Сейчас'
  const totalMin = Math.ceil(ms / 60_000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  if (days > 0) return `${days} д ${hours} ч`
  if (hours > 0) return `${hours} ч`
  return `${totalMin % 60} м`
}
