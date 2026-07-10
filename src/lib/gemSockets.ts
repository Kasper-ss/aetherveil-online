import type { Item, Player, SocketGemId, Stats } from '@/types/game'
import { getGemStatValue, getMaxSockets, getSocketGemDef } from '@/data/socketGems'

export function getItemSockets(item: Item): SocketGemId[] {
  return item.socketedGems ?? []
}

export function countEmptySockets(item: Item): number {
  const max = getMaxSockets(item.slot as import('@/data/items').EquipSlot, item.rarity)
  return Math.max(0, max - getItemSockets(item).length)
}

export function canSocketGem(item: Item, gemId: SocketGemId): boolean {
  if (item.slot === 'consumable' || item.slot === 'pet') return false
  if (countEmptySockets(item) <= 0) return false
  const sockets = getItemSockets(item)
  return !sockets.includes(gemId)
}

export function applySocketGemStats(base: Stats, player: Player, item: Item): Stats {
  const result = { ...base }
  const sockets = getItemSockets(item)
  for (const gemId of sockets) {
    const level = player.socketGemLevels?.[gemId] ?? 1
    const val = getGemStatValue(gemId, level)
    const stat = getSocketGemDef(gemId).stat
    if (stat === 'atk' || stat === 'def' || stat === 'hp' || stat === 'crit') {
      result[stat] = (result[stat] ?? 0) + val
    }
  }
  return result
}

export function getTotalSocketGemStats(player: Player, items: Item[]): Partial<Stats> {
  const totals: Partial<Stats> = {}
  for (const item of items) {
    for (const gemId of getItemSockets(item)) {
      const level = player.socketGemLevels?.[gemId] ?? 1
      const val = getGemStatValue(gemId, level)
      const stat = getSocketGemDef(gemId).stat
      totals[stat] = (totals[stat] ?? 0) + val
    }
  }
  return totals
}
