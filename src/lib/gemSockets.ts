import type { Item, Player, SocketGemId, Stats, ItemRarity } from '@/types/game'
import { getGemStatValue, getMaxSockets, getSocketGemDef, SOCKET_GEMS } from '@/data/socketGems'
import { RARITY_LABELS_RU } from '@/data/items'
import { jewelResourceId } from '@/lib/jewelResources'
import { isGemStudied } from '@/lib/gemStudy'

export function getItemSockets(item: Item): SocketGemId[] {
  return item.socketedGems ?? []
}

export function getItemMaxGemSockets(item: Item): number {
  if (item.slot === 'consumable' || item.slot === 'pet') return 0
  return getMaxSockets(item.slot as import('@/data/items').EquipSlot, item.rarity)
}

export function countEmptySockets(item: Item): number {
  return Math.max(0, getItemMaxGemSockets(item) - getItemSockets(item).length)
}

export function gemMatchesItemRarity(gemId: SocketGemId, itemRarity: ItemRarity): boolean {
  return getSocketGemDef(gemId).rarity === itemRarity
}

export function canSocketGem(item: Item, gemId: SocketGemId): boolean {
  if (item.slot === 'consumable' || item.slot === 'pet') return false
  if (!gemMatchesItemRarity(gemId, item.rarity)) return false
  if (countEmptySockets(item) <= 0) return false
  const sockets = getItemSockets(item)
  return !sockets.includes(gemId)
}

export function getSocketGemRarityMismatchReason(gemId: SocketGemId, item: Item): string | null {
  const gemRarity = getSocketGemDef(gemId).rarity
  if (gemRarity === item.rarity) return null
  return `Камень «${getSocketGemDef(gemId).nameRu}» (${RARITY_LABELS_RU[gemRarity]}) подходит только для ${RARITY_LABELS_RU[gemRarity].toLowerCase()} снаряжения`
}

export function formatGemSocketSummary(item: Item): string {
  const max = getItemMaxGemSockets(item)
  if (max <= 0) return 'без слотов'
  const used = getItemSockets(item).length
  const empty = max - used
  return `💎 ${empty}/${max}`
}

export function getSocketableGemIdsForItem(
  player: Player,
  item: Item,
  options?: { studiedOnly?: boolean },
): SocketGemId[] {
  if (countEmptySockets(item) <= 0) return []
  return SOCKET_GEMS
    .filter((g) => !options?.studiedOnly || isGemStudied(player, g.id))
    .filter((g) => (player.resources?.[jewelResourceId(g.id)] ?? 0) > 0)
    .filter((g) => canSocketGem(item, g.id))
    .map((g) => g.id)
}

export function getEquippedItemsWithEmptyGemSockets(player: Player): Item[] {
  return (Object.values(player.equipped).filter(Boolean) as Item[])
    .filter((item) => getItemMaxGemSockets(item) > 0 && countEmptySockets(item) > 0)
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
