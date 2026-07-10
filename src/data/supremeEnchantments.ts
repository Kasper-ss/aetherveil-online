import type { EquipSlot, Item } from '@/types/game'

export interface SupremeEnchantment {
  id: string
  nameRu: string
  descriptionRu: string
  goldCost: number
  stat: 'atk' | 'def' | 'hp' | 'crit'
  value: number
  slots: EquipSlot[]
}

export const SUPREME_ENCHANTMENTS: SupremeEnchantment[] = [
  { id: 'se_flame', nameRu: 'Пламя Башни', descriptionRu: '+12 ATK на оружии', goldCost: 2500, stat: 'atk', value: 12, slots: ['weapon'] },
  { id: 'se_aegis', nameRu: 'Эгида Эфира', descriptionRu: '+10 DEF на нагруднике', goldCost: 2200, stat: 'def', value: 10, slots: ['chestplate'] },
  { id: 'se_vitality', nameRu: 'Живучесть', descriptionRu: '+80 HP на шлеме', goldCost: 1800, stat: 'hp', value: 80, slots: ['helmet'] },
  { id: 'se_precision', nameRu: 'Точность', descriptionRu: '+5% крит на кольце', goldCost: 3000, stat: 'crit', value: 5, slots: ['ring', 'necklace'] },
  { id: 'se_fortress', nameRu: 'Крепость', descriptionRu: '+8 DEF на поножах', goldCost: 2000, stat: 'def', value: 8, slots: ['leggings', 'boots'] },
]

export function getEnchantmentsForItem(item: Item): SupremeEnchantment[] {
  if (item.slot === 'consumable' || item.slot === 'pet') return []
  return SUPREME_ENCHANTMENTS.filter((e) => e.slots.includes(item.slot as EquipSlot))
}

export function applySupremeEnchantment(item: Item, enchantId: string): Item {
  const enc = SUPREME_ENCHANTMENTS.find((e) => e.id === enchantId)
  if (!enc) return item
  const stats = { ...item.stats }
  stats[enc.stat] = (stats[enc.stat] ?? 0) + enc.value
  return { ...item, stats }
}
