import type { Item } from '@/types/game'

export type ConsumableId =
  | 'hp_potion'
  | 'hp_potion_rare'
  | 'hp_potion_epic'
  | 'hp_potion_legendary'
  | 'energy_drink'
  | 'energy_drink_rare'

export interface ConsumableEffect {
  healPercent: number
  energy: number
}

export const CONSUMABLE_EFFECTS: Record<ConsumableId, ConsumableEffect> = {
  hp_potion: { healPercent: 0.5, energy: 0 },
  hp_potion_rare: { healPercent: 0.65, energy: 0 },
  hp_potion_epic: { healPercent: 0.8, energy: 0 },
  hp_potion_legendary: { healPercent: 1, energy: 0 },
  energy_drink: { healPercent: 0, energy: 30 },
  energy_drink_rare: { healPercent: 0, energy: 50 },
}

export interface ConsumableStack {
  itemId: ConsumableId
  name: string
  icon: string
  count: number
  instanceId: string
}

export function groupConsumableStacks(inventory: Item[]): ConsumableStack[] {
  const map = new Map<ConsumableId, ConsumableStack>()
  for (const item of inventory) {
    if (item.slot !== 'consumable') continue
    const id = item.id as ConsumableId
    if (!CONSUMABLE_EFFECTS[id]) continue
    const existing = map.get(id)
    if (existing) {
      existing.count++
    } else {
      map.set(id, {
        itemId: id,
        name: item.name,
        icon: item.icon,
        count: 1,
        instanceId: item.instanceId!,
      })
    }
  }
  return Array.from(map.values())
}

export function findConsumableInstance(inventory: Item[], itemId: ConsumableId): Item | undefined {
  return inventory.find((i) => i.slot === 'consumable' && i.id === itemId)
}

export function isHpPotion(itemId: string): boolean {
  return itemId === 'hp_potion' || itemId === 'hp_potion_rare'
    || itemId === 'hp_potion_epic' || itemId === 'hp_potion_legendary'
}

export function isEnergyDrink(itemId: string): boolean {
  return itemId === 'energy_drink' || itemId === 'energy_drink_rare'
}
