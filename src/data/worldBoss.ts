import type { FloorEnemy, Player } from '@/types/game'
import { makeEnemy } from '@/data/floors'
import {
  canFightWorldBoss,
  formatWorldBossCountdown,
  getWorldBossSchedule,
} from '@/lib/worldBossSchedule'
import { jewelResourceId, rollRandomJewelResource } from '@/lib/jewelResources'
import { rollElementParticles } from '@/lib/elementDrops'
import type { ResourceId } from '@/types/game'

export const WORLD_BOSS_UNLOCK_FLOOR = 25
export const WORLD_BOSS_TITLE_ID = 'world_boss_slayer'
export const WORLD_BOSS_SWORD_ID = 'aether_worldbreaker'

export function isWorldBossUnlocked(player: Player): boolean {
  return player.highestFloor >= WORLD_BOSS_UNLOCK_FLOOR
}

export function getWorldBossCooldown(player: Player): {
  canFight: boolean
  isActive: boolean
  nextAvailableAt: string | null
  remainingMs: number
  daysUntilNext: number
} {
  const schedule = getWorldBossSchedule()
  return {
    canFight: canFightWorldBoss(player),
    isActive: schedule.isActive,
    nextAvailableAt: new Date(schedule.nextSpawnAt).toISOString(),
    remainingMs: schedule.msUntilNext,
    daysUntilNext: schedule.daysUntilNext,
  }
}

export function formatCooldownRemaining(ms: number): string {
  return formatWorldBossCountdown(ms)
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

export function getWorldBossRewardResources(): Partial<Record<ResourceId, number>> {
  const rewards: Partial<Record<ResourceId, number>> = {
    star_shard: 5,
    aether_dust: 12,
    abyssal_pearl: 4,
    raw_diamond: 3,
    upgrade_core: 5,
  }
  for (let i = 0; i < 3; i++) {
    const id = rollRandomJewelResource({ rareOnly: true })
    rewards[id] = (rewards[id] ?? 0) + 1
  }
  const diamond = jewelResourceId('diamond')
  rewards[diamond] = (rewards[diamond] ?? 0) + 1
  Object.assign(rewards, rollElementParticles(true, 2))
  return rewards
}

export const WORLD_BOSS_REWARDS = {
  gold: 200_000,
  gems: 100,
}
