import type { Item, ItemRarity, Stats } from '@/types/game'
import { getFloorData, MAX_FLOOR } from '@/data/floors'

export type RaidExclusiveSlot = 'helmet' | 'chestplate' | 'leggings' | 'boots' | 'necklace' | 'ring' | 'weapon'

export const RAID_EXCLUSIVE_SLOTS: RaidExclusiveSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon',
]

export const RAID_EXCLUSIVE_DROP_CHANCE = 0.06

const SLOT_LABELS_RU: Record<RaidExclusiveSlot, string> = {
  helmet: 'Шлем',
  chestplate: 'Нагрудник',
  leggings: 'Поножи',
  boots: 'Сапоги',
  necklace: 'Ожерелье',
  ring: 'Кольцо',
  weapon: 'Оружие',
}

const SLOT_ICONS: Record<RaidExclusiveSlot, string[]> = {
  helmet: ['🪖', '⛑️', '👑', '🔮', '💀', '✨', '🌑'],
  chestplate: ['🥋', '🛡️', '⛓️', '💠', '🌟', '🔥', '💎'],
  leggings: ['👖', '🦵', '⛓️', '🔵', '💜', '🟡', '🔴'],
  boots: ['👢', '🥾', '💨', '❄️', '🔥', '⚡', '🌊'],
  necklace: ['📿', '💎', '🔮', '✨', '🌙', '💠', '🔱'],
  ring: ['💍', '💎', '🔮', '✨', '🌟', '🔥', '⚡'],
  weapon: ['🗡️', '⚔️', '🏹', '🔱', '💎', '✨', '🌟'],
}

const STAT_BOOST = 1.48

function floorToTier(floor: number): number {
  return Math.min(10, Math.max(1, 1 + Math.floor((floor - 1) / 10)))
}

function rarityForFloor(floor: number): ItemRarity {
  if (floor >= 71) return 'legendary'
  if (floor >= 31) return 'epic'
  return 'rare'
}

function baseSlotStats(slot: RaidExclusiveSlot, tier: number): Partial<Stats> {
  const t = tier
  switch (slot) {
    case 'helmet': return { def: 2 + t * 2, hp: 8 + t * 6 }
    case 'chestplate': return { def: 4 + t * 3, hp: 15 + t * 10 }
    case 'leggings': return { def: 2 + t * 2, speed: 1 + t }
    case 'boots': return { speed: 2 + t, def: 1 + t }
    case 'necklace': return { atk: 1 + t, crit: 1 + t * 2 }
    case 'ring': return { crit: 2 + t * 2, atk: 1 + Math.floor(t / 2) }
    case 'weapon': return { atk: 5 + t * 4, crit: 1 + t * 2 }
  }
}

function boostStats(stats: Partial<Stats>): Partial<Stats> {
  const result: Partial<Stats> = {}
  for (const [k, v] of Object.entries(stats)) {
    result[k as keyof Stats] = Math.max(1, Math.floor((v as number) * STAT_BOOST))
  }
  return result
}

function buildRaidExclusiveItem(floor: number, slot: RaidExclusiveSlot): Item {
  const tier = floorToTier(floor)
  const floorData = getFloorData(floor)
  const stats = boostStats(baseSlotStats(slot, tier))
  const rarity = rarityForFloor(floor)
  const id = `raid_gear_${floor}_${slot}`
  const iconIdx = (floor + RAID_EXCLUSIVE_SLOTS.indexOf(slot)) % SLOT_ICONS[slot].length
  const statDesc = Object.entries(stats).map(([k, v]) => {
    const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
    return `${labels[k] ?? k} +${v}`
  }).join(', ')

  return {
    id,
    name: `${SLOT_LABELS_RU[slot]} «${floorData.name}»`,
    description: `Рейдовый трофей этажа ${floor}. Универсальное снаряжение — подходит всем классам. Нельзя купить или скрафтить. Бонусы: ${statDesc}`,
    slot,
    rarity,
    stats,
    icon: SLOT_ICONS[slot][iconIdx],
    sellPrice: 120 + floor * 35 + tier * 80,
    tier,
    raidExclusive: true,
    exclusiveFloor: floor,
    upgradeLevel: 1,
    starLevel: 0,
  }
}

function buildAllRaidExclusiveItems(): Record<string, Item> {
  const items: Record<string, Item> = {}
  for (let floor = 1; floor <= MAX_FLOOR; floor++) {
    for (const slot of RAID_EXCLUSIVE_SLOTS) {
      const item = buildRaidExclusiveItem(floor, slot)
      items[item.id] = item
    }
  }
  return items
}

export const RAID_EXCLUSIVE_ITEMS: Record<string, Item> = buildAllRaidExclusiveItems()

export function isRaidExclusiveItem(itemOrId: Item | string): boolean {
  if (typeof itemOrId === 'string') {
    return itemOrId.startsWith('raid_gear_') || !!RAID_EXCLUSIVE_ITEMS[itemOrId]?.raidExclusive
  }
  return !!itemOrId.raidExclusive || itemOrId.id.startsWith('raid_gear_')
}

export function rollRaidExclusiveItemId(
  floor: number,
  isBoss: boolean,
  lootMult = 1,
): string | null {
  if (!isBoss || floor < 1 || floor > MAX_FLOOR) return null
  const chance = Math.min(0.12, RAID_EXCLUSIVE_DROP_CHANCE * lootMult)
  if (Math.random() > chance) return null
  const slot = RAID_EXCLUSIVE_SLOTS[Math.floor(Math.random() * RAID_EXCLUSIVE_SLOTS.length)]
  return `raid_gear_${floor}_${slot}`
}
