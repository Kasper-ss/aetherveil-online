import type { EquipSlot, ItemRarity, SocketGemId } from '@/types/game'

export interface SocketGemDef {
  id: SocketGemId
  nameRu: string
  icon: string
  stat: 'atk' | 'def' | 'hp' | 'crit'
  baseValue: number
  perLevel: number
  rarity: ItemRarity
}

export const SOCKET_GEMS: SocketGemDef[] = [
  { id: 'ruby', nameRu: 'Рубин', icon: '🔴', stat: 'atk', baseValue: 3, perLevel: 2, rarity: 'rare' },
  { id: 'sapphire', nameRu: 'Сапфир', icon: '🔵', stat: 'def', baseValue: 2, perLevel: 2, rarity: 'rare' },
  { id: 'emerald', nameRu: 'Изумруд', icon: '🟢', stat: 'hp', baseValue: 15, perLevel: 10, rarity: 'epic' },
  { id: 'topaz', nameRu: 'Топаз', icon: '🟡', stat: 'crit', baseValue: 1, perLevel: 1, rarity: 'rare' },
  { id: 'amethyst', nameRu: 'Аметист', icon: '🟣', stat: 'atk', baseValue: 2, perLevel: 1, rarity: 'rare' },
  { id: 'onyx', nameRu: 'Оникс', icon: '⚫', stat: 'def', baseValue: 3, perLevel: 2, rarity: 'epic' },
  { id: 'opal', nameRu: 'Опал', icon: '⚪', stat: 'crit', baseValue: 2, perLevel: 1, rarity: 'epic' },
  { id: 'jade', nameRu: 'Нефрит', icon: '🟩', stat: 'hp', baseValue: 20, perLevel: 12, rarity: 'legendary' },
  { id: 'garnet', nameRu: 'Гранат', icon: '🟥', stat: 'atk', baseValue: 4, perLevel: 2, rarity: 'rare' },
  { id: 'diamond', nameRu: 'Алмаз', icon: '💎', stat: 'crit', baseValue: 3, perLevel: 2, rarity: 'mythic' },
]

export const MAX_SOCKET_GEM_LEVEL = 10

export function getSocketGemDef(id: SocketGemId): SocketGemDef {
  return SOCKET_GEMS.find((g) => g.id === id)!
}

export function getGemStatValue(gemId: SocketGemId, level: number): number {
  const def = getSocketGemDef(gemId)
  return def.baseValue + def.perLevel * Math.max(0, level - 1)
}

/** Слоты для вставки камней по редкости и типу. */
export function getMaxSockets(slot: EquipSlot, rarity: ItemRarity): number {
  const base: Record<ItemRarity, number> = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3,
    mythic: 4,
    divine: 4,
  }
  const slotBonus = (slot === 'weapon' || slot === 'chestplate') ? 1 : 0
  return Math.min(4, base[rarity] + (rarity !== 'common' ? slotBonus : 0))
}
