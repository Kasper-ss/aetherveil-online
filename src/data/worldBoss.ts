import type { FloorEnemy, Player } from '@/types/game'
import { makeEnemy } from '@/data/floors'

export const WORLD_BOSS_UNLOCK_FLOOR = 25
export const WORLD_BOSS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
export const WORLD_BOSS_TITLE_ID = 'world_boss_slayer'
export const WORLD_BOSS_SWORD_ID = 'aether_worldbreaker'

export function isWorldBossUnlocked(player: Player): boolean {
  return player.highestFloor >= WORLD_BOSS_UNLOCK_FLOOR
}

export function getWorldBossCooldown(player: Player): {
  canFight: boolean
  nextAvailableAt: string | null
  remainingMs: number
} {
  const last = player.worldBossLastKillAt
  if (!last) return { canFight: true, nextAvailableAt: null, remainingMs: 0 }
  const next = new Date(last).getTime() + WORLD_BOSS_COOLDOWN_MS
  const remaining = next - Date.now()
  if (remaining <= 0) return { canFight: true, nextAvailableAt: null, remainingMs: 0 }
  return { canFight: false, nextAvailableAt: new Date(next).toISOString(), remainingMs: remaining }
}

export function formatCooldownRemaining(ms: number): string {
  if (ms <= 0) return ''
  const totalMin = Math.ceil(ms / 60_000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60
  if (days > 0) return `${days} д ${hours} ч`
  if (hours > 0) return `${hours} ч ${mins} м`
  return `${mins} м`
}

/** Scales with player's highest floor reached */
export function buildWorldBossEnemy(player: Player): FloorEnemy {
  const scaleFloor = Math.max(WORLD_BOSS_UNLOCK_FLOOR, player.highestFloor)
  const base = makeEnemy(scaleFloor, 'Архонт Эфирной Бездны', 'boss', true)
  const tierMult = 1 + (scaleFloor - WORLD_BOSS_UNLOCK_FLOOR) * 0.04
  return {
    ...base,
    id: 'world_boss_archon',
    name: 'Архонт Эфирной Бездны',
    isBoss: true,
    stats: {
      hp: Math.floor(base.stats.hp * tierMult * 2.2),
      atk: Math.floor(base.stats.atk * tierMult * 1.6),
      def: Math.floor(base.stats.def * tierMult * 1.5),
      crit: Math.min(35, base.stats.crit + 8),
      speed: Math.min(28, base.stats.speed + 6),
    },
    expReward: Math.floor(base.expReward * 3),
    goldReward: [
      Math.floor(base.goldReward[0] * 12),
      Math.floor(base.goldReward[1] * 18),
    ],
  }
}

export const WORLD_BOSS_REWARDS = {
  gold: 15000,
  gems: 80,
  resources: {
    star_shard: 5,
    aether_dust: 12,
    abyssal_pearl: 4,
    raw_diamond: 3,
    upgrade_core: 5,
  } as const,
}
