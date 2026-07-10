import type { ResourceId } from '@/types/game'
import { createItemInstance } from '@/data/items'
import { rollJewelLoot } from '@/lib/jewelResources'

export interface SecretCaveReward {
  resources: Partial<Record<ResourceId, number>>
  gold: number
  itemId?: string
  chestFound: boolean
}

export interface SecretCaveState {
  floor: number
  digsRemaining: number
  maxDigs: number
  rewards: SecretCaveReward[]
  chestFound: boolean
}

const CAVE_CHANCE = 0.12

const RESOURCE_POOL: ResourceId[] = [
  'iron_ore', 'herb', 'hide', 'meat', 'gem_shard', 'mana_crystal',
  'aether_dust', 'mithril_ore', 'adamantite', 'herb_lotus', 'herb_phoenix',
]

export function rollSecretCaveAfterVictory(floor: number, isBoss: boolean): SecretCaveState | null {
  const chance = isBoss ? CAVE_CHANCE * 1.5 : CAVE_CHANCE
  if (Math.random() > chance) return null

  const maxDigs = 3 + Math.floor(Math.random() * 3)
  const rewards: SecretCaveReward[] = []

  for (let i = 0; i < maxDigs; i++) {
    rewards.push(generateCaveDig(floor))
  }

  const chestFound = Math.random() < 0.35
  if (chestFound) {
    rewards.push(generateTreasureChest(floor))
  }

  return {
    floor,
    digsRemaining: maxDigs + (chestFound ? 1 : 0),
    maxDigs: maxDigs + (chestFound ? 1 : 0),
    rewards,
    chestFound,
  }
}

function generateCaveDig(floor: number): SecretCaveReward {
  const resId = RESOURCE_POOL[Math.floor(Math.random() * RESOURCE_POOL.length)]
  const amount = 1 + Math.floor(floor * 0.4) + Math.floor(Math.random() * 3)
  const resources: Partial<Record<ResourceId, number>> = { [resId]: amount }
  if (Math.random() < 0.12 + floor * 0.008) {
    Object.assign(resources, rollJewelLoot(1, 1, Math.random() < 0.35))
  }
  return {
    resources,
    gold: Math.floor(20 + floor * 8 + Math.random() * 40),
    chestFound: false,
  }
}

function generateTreasureChest(floor: number): SecretCaveReward {
  const roll = Math.random()
  if (roll < 0.45) {
    const res: Partial<Record<ResourceId, number>> = {}
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const id = RESOURCE_POOL[Math.floor(Math.random() * RESOURCE_POOL.length)]
      res[id] = (res[id] ?? 0) + 1 + Math.floor(floor * 0.3)
    }
    return { resources: res, gold: 100 + floor * 30, chestFound: true }
  }
  if (roll < 0.75) {
    const tier = Math.min(8, 3 + Math.floor(floor / 4))
    const slots = ['helmet', 'chestplate', 'leggings', 'boots', 'weapon', 'ring', 'necklace'] as const
    const slot = slots[Math.floor(Math.random() * slots.length)]
    const itemId = `${slot}_t${tier}`
    if (createItemInstance(itemId)) {
      return { resources: {}, gold: 50 + floor * 15, itemId, chestFound: true }
    }
  }
  return {
    resources: { gem_shard: 2 + Math.floor(floor / 3), aether_dust: 1 },
    gold: 200 + floor * 50,
    chestFound: true,
  }
}

export function claimCaveReward(reward: SecretCaveReward): {
  resources: Partial<Record<ResourceId, number>>
  gold: number
  itemId?: string
} {
  return {
    resources: reward.resources,
    gold: reward.gold,
    itemId: reward.itemId,
  }
}
