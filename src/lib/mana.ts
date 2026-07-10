import type { Player } from '@/types/game'
import { isManaClass } from '@/lib/classCompat'

export const BASE_MAX_MANA = 100
export const BASE_MANA_REGEN_MS = 12_000

export function usesMana(player: Player): boolean {
  return isManaClass(player.classId)
}

export function getMaxMana(player: Player): number {
  if (!usesMana(player)) return 0
  return BASE_MAX_MANA + player.level * 8
}

export function getManaRegenIntervalMs(player: Player): number {
  return Math.max(4_000, BASE_MANA_REGEN_MS - player.level * 80)
}

export function getPlayerCurrentMana(player: Player): number {
  const max = getMaxMana(player)
  if (!usesMana(player)) return 0
  if (player.currentMana == null) return max
  return Math.min(max, Math.max(0, player.currentMana))
}

export function getManaFullInMs(player: Player): number {
  if (!usesMana(player)) return 0
  const max = getMaxMana(player)
  const current = getPlayerCurrentMana(player)
  if (current >= max) return 0
  const interval = getManaRegenIntervalMs(player)
  const missing = max - current
  return Math.ceil((missing / max) * interval)
}
