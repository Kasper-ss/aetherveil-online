import type { Item, ItemRarity, ResourceId } from '@/types/game'
import { ALL_ITEMS } from '@/data/items'

export const PET_REWARD_INTERVAL_MS = 3 * 60 * 60 * 1000
export const MAX_PET_REWARD_CYCLES = 8

export interface PetRewardItem {
  itemId: string
  name: string
  icon: string
  count: number
}

export interface PetReward {
  petName: string
  petIcon: string
  cycles: number
  gold: number
  resources: Partial<Record<ResourceId, number>>
  items: PetRewardItem[]
}

const RARITY_MULT: Record<ItemRarity, number> = {
  common: 1,
  rare: 1.35,
  epic: 1.7,
  legendary: 2.2,
  mythic: 3,
  divine: 4,
}

const RESOURCE_POOL: ResourceId[] = [
  'herb', 'meat', 'hide', 'iron_ore', 'gem_shard', 'mana_crystal', 'fishing_junk',
]

const ITEM_POOL: { itemId: string; weight: number; minRarity?: ItemRarity }[] = [
  { itemId: 'hp_potion', weight: 30 },
  { itemId: 'energy_drink', weight: 25 },
  { itemId: 'fishing_bait', weight: 20 },
  { itemId: 'food_roast_meat', weight: 12, minRarity: 'rare' },
  { itemId: 'food_herb_soup', weight: 10, minRarity: 'rare' },
  { itemId: 'food_fish_grill', weight: 6, minRarity: 'epic' },
]

const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'divine']

function rarityAtLeast(have: ItemRarity, need: ItemRarity): boolean {
  return RARITY_ORDER.indexOf(have) >= RARITY_ORDER.indexOf(need)
}

function rollCycle(rarity: ItemRarity): Omit<PetReward, 'petName' | 'petIcon' | 'cycles'> {
  const mult = RARITY_MULT[rarity]
  const gold = Math.floor((35 + Math.random() * 45) * mult)

  const resources: Partial<Record<ResourceId, number>> = {}
  const resCount = 1 + (Math.random() < 0.4 ? 1 : 0)
  for (let i = 0; i < resCount; i++) {
    const rid = RESOURCE_POOL[Math.floor(Math.random() * RESOURCE_POOL.length)]
    resources[rid] = (resources[rid] ?? 0) + Math.max(1, Math.floor((2 + Math.random() * 4) * mult))
  }

  const items: PetRewardItem[] = []
  const itemRoll = Math.random()
  const itemChance = 0.35 + mult * 0.08
  if (itemRoll < itemChance) {
    const pool = ITEM_POOL.filter((e) => !e.minRarity || rarityAtLeast(rarity, e.minRarity))
    const totalW = pool.reduce((s, e) => s + e.weight, 0)
    let roll = Math.random() * totalW
    let pick = pool[0]
    for (const entry of pool) {
      roll -= entry.weight
      if (roll <= 0) { pick = entry; break }
    }
    if (pick) {
      const def = ALL_ITEMS[pick.itemId]
      items.push({
        itemId: pick.itemId,
        name: def?.name ?? pick.itemId,
        icon: def?.icon ?? '📦',
        count: 1,
      })
    }
  }

  return { gold, resources, items }
}

export function buildPetReward(pet: Item, cycles: number): PetReward {
  let gold = 0
  const resources: Partial<Record<ResourceId, number>> = {}
  const itemMap = new Map<string, PetRewardItem>()

  for (let c = 0; c < cycles; c++) {
    const roll = rollCycle(pet.rarity)
    gold += roll.gold
    for (const [rid, amount] of Object.entries(roll.resources)) {
      if (!amount) continue
      resources[rid as ResourceId] = (resources[rid as ResourceId] ?? 0) + amount
    }
    for (const item of roll.items) {
      const existing = itemMap.get(item.itemId)
      if (existing) existing.count++
      else itemMap.set(item.itemId, { ...item, count: 1 })
    }
  }

  return {
    petName: pet.name,
    petIcon: pet.icon,
    cycles,
    gold,
    resources,
    items: Array.from(itemMap.values()),
  }
}

export function getPetRewardCycles(player: { equipped: { pet?: Item | null }; petLastRewardAt?: string; lastOnlineAt: string }): number {
  if (!player.equipped.pet) return 0
  const last = new Date(player.petLastRewardAt ?? player.lastOnlineAt).getTime()
  const elapsed = Date.now() - last
  return Math.min(MAX_PET_REWARD_CYCLES, Math.floor(elapsed / PET_REWARD_INTERVAL_MS))
}

export function getPetRewardTimeRemaining(
  player: { equipped: { pet?: Item | null }; petLastRewardAt?: string; lastOnlineAt: string },
): number | null {
  if (!player.equipped.pet) return null
  const last = new Date(player.petLastRewardAt ?? player.lastOnlineAt).getTime()
  return Math.max(0, last + PET_REWARD_INTERVAL_MS - Date.now())
}

export function formatPetRewardCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`
  }
  return `${totalMin}м`
}
