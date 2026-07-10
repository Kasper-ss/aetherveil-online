import type { Item, Player, ResourceId } from '@/types/game'
import {
  RAID_MOBS_REQUIRED,
  getRaidId,
  type RaidDefinition,
} from '@/data/raids'

export interface RaidProgress {
  raidId: string
  floor: number
  raidIndex: 0 | 1
  mobsKilled: number
  bossDefeated: boolean
  accumulatedExp: number
  accumulatedGold: number
  accumulatedLoot: Item[]
  accumulatedResources: Partial<Record<ResourceId, number>>
  startedAt: string
}

export function createRaidProgress(def: RaidDefinition): RaidProgress {
  return {
    raidId: def.id,
    floor: def.floor,
    raidIndex: def.index,
    mobsKilled: 0,
    bossDefeated: false,
    accumulatedExp: 0,
    accumulatedGold: 0,
    accumulatedLoot: [],
    accumulatedResources: {},
    startedAt: new Date().toISOString(),
  }
}

export function getRaidProgress(player: Player, raidId: string): RaidProgress | null {
  return player.raidProgress?.[raidId] ?? null
}

export function getRaidCooldownRemaining(player: Player, raidId: string): number {
  const until = player.raidDeathCooldowns?.[raidId]
  if (!until) return 0
  return Math.max(0, new Date(until).getTime() - Date.now())
}

export function isRaidComplete(progress: RaidProgress): boolean {
  return progress.mobsKilled >= RAID_MOBS_REQUIRED && progress.bossDefeated
}

export function getRaidFightType(progress: RaidProgress): 'mob' | 'boss' | 'done' {
  if (isRaidComplete(progress)) return 'done'
  if (progress.mobsKilled >= RAID_MOBS_REQUIRED) return 'boss'
  return 'mob'
}

export function canStartRaid(
  player: Player,
  raidId: string,
  floor: number,
): { ok: boolean; reason?: string } {
  if (floor > player.highestFloor) {
    return { ok: false, reason: `Сначала откройте этаж ${floor}` }
  }
  const cooldown = getRaidCooldownRemaining(player, raidId)
  if (cooldown > 0) {
    return { ok: false, reason: `Воскрешение через ${formatRaidCooldown(cooldown)}` }
  }
  const active = player.activeRaidId
  if (active && active !== raidId) {
    return { ok: false, reason: 'Завершите или прервите текущий рейд' }
  }
  const progress = getRaidProgress(player, raidId)
  if (progress && isRaidComplete(progress)) {
    return { ok: true }
  }
  return { ok: true }
}

export function formatRaidCooldown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0) return `${hours} ч ${mins} м`
  return `${mins} м`
}

export function mergeResources(
  base: Partial<Record<ResourceId, number>>,
  add: Partial<Record<ResourceId, number>>,
): Partial<Record<ResourceId, number>> {
  const merged = { ...base }
  for (const [k, v] of Object.entries(add)) {
    if (!v) continue
    const id = k as ResourceId
    merged[id] = (merged[id] ?? 0) + v
  }
  return merged
}

export function parseRaidId(raidId: string): { floor: number; index: 0 | 1 } | null {
  const m = /^raid_(\d+)_([01])$/.exec(raidId)
  if (!m) return null
  return { floor: Number(m[1]), index: Number(m[2]) as 0 | 1 }
}

export function ensureRaidId(floor: number, index: 0 | 1): string {
  return getRaidId(floor, index)
}
