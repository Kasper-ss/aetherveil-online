import type { Item, ItemRarity, ItemSlot, Stats, EquippedItems } from '@/types/game'

export type EquipSlot = Exclude<ItemSlot, 'consumable'>

export const SLOT_LABELS_RU: Record<EquipSlot, string> = {
  helmet: 'Шлем',
  chestplate: 'Нагрудник',
  leggings: 'Поножи',
  boots: 'Ботинки',
  necklace: 'Ожерелье',
  ring: 'Кольцо',
  weapon: 'Оружие',
  pet: 'Питомец',
}

export const RARITY_LABELS_RU: Record<import('@/types/game').ItemRarity, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
}

const TIER_RARITIES: ItemRarity[] = [
  'common', 'common', 'common', 'common',
  'rare', 'rare',
  'epic', 'epic',
  'legendary', 'legendary',
]

const SLOT_ICONS: Record<EquipSlot, string[]> = {
  helmet: ['🪖', '⛑️', '🎩', '👑', '🦌', '🔮', '💀', '✨', '🌑', '👁️'],
  chestplate: ['🥋', '🛡️', '⛓️', '🧥', '🔷', '💠', '🌟', '🔥', '⚡', '💎'],
  leggings: ['👖', '🦵', '⛓️', '🩳', '🌿', '🔵', '💜', '🟡', '🔴', '⭐'],
  boots: ['👢', '🥾', '👟', '🦶', '💨', '❄️', '🔥', '⚡', '🌊', '🌟'],
  necklace: ['📿', '💎', '🔮', '✨', '🌙', '☀️', '💠', '🔱', '👁️', '⭐'],
  ring: ['💍', '💎', '🔮', '✨', '🌟', '🔥', '❄️', '⚡', '🌑', '👑'],
  weapon: ['🗡️', '⚔️', '🏹', '🔨', '🪓', '🔱', '💎', '✨', '🌟', '⚡'],
  pet: ['🐺', '🦊', '🐉', '🦅', '🐱', '🦁', '🐻', '🦇', '👻', '🌟'],
}

const SLOT_NAMES_RU: Record<EquipSlot, string[]> = {
  helmet: ['Кожаный шлем', 'Железный шлем', 'Стальной шлем', 'Шлем разведчика', 'Магический капюшон', 'Рунический шлем', 'Шлем теней', 'Шлем бури', 'Корона эфира', 'Шлем бездны'],
  chestplate: ['Кожаный нагрудник', 'Кольчуга', 'Латный доспех', 'Нагрудник охотника', 'Мантия мага', 'Руническая кираса', 'Кираса теней', 'Доспех бури', 'Латы эфира', 'Броня бездны'],
  leggings: ['Кожаные поножи', 'Железные поножи', 'Стальные поножи', 'Поножи разведчика', 'Штаны мага', 'Рунические поножи', 'Поножи теней', 'Поножи бури', 'Поножи эфира', 'Поножи бездны'],
  boots: ['Кожаные ботинки', 'Железные сапоги', 'Стальные сапоги', 'Сапоги разведчика', 'Сапоги мага', 'Рунические сапоги', 'Сапоги теней', 'Сапоги бури', 'Сапоги эфира', 'Сапоги бездны'],
  necklace: ['Медное ожерелье', 'Серебряное ожерелье', 'Золотое ожерелье', 'Ожерелье охотника', 'Амулет маны', 'Рунический амулет', 'Амулет теней', 'Амулет бури', 'Амулет эфира', 'Амулет бездны'],
  ring: ['Медное кольцо', 'Серебряное кольцо', 'Золотое кольцо', 'Кольцо охотника', 'Кольцо маны', 'Руническое кольцо', 'Кольцо теней', 'Кольцо бури', 'Кольцо эфира', 'Кольцо бездны'],
  weapon: ['Ржавый меч', 'Железный клинок', 'Стальной меч', 'Лук охотника', 'Посох мага', 'Рунический клинок', 'Клинок теней', 'Клинок бури', 'Клинок эфира', 'Клинок бездны'],
  pet: ['Волчонок', 'Лисица', 'Дракончик', 'Орлёнок', 'Котёнок', 'Львёнок', 'Медвежонок', 'Летучая мышь', 'Призрак', 'Эфирный зверь'],
}

function slotStats(slot: EquipSlot, tier: number): Partial<Stats> {
  const t = tier + 1
  switch (slot) {
    case 'helmet': return { def: 2 + t * 2, hp: 8 + t * 6 }
    case 'chestplate': return { def: 4 + t * 3, hp: 15 + t * 10 }
    case 'leggings': return { def: 2 + t * 2, speed: 1 + t }
    case 'boots': return { speed: 2 + t, def: 1 + t }
    case 'necklace': return { atk: 1 + t, crit: 1 + t * 2 }
    case 'ring': return { crit: 2 + t * 2, atk: 1 + Math.floor(t / 2) }
    case 'weapon': return { atk: 5 + t * 4, crit: 1 + t * 2 }
    case 'pet': return { atk: 3 + t * 3, hp: 10 + t * 8 }
  }
}

function buildItem(slot: EquipSlot, tier: number): Item {
  const id = `${slot}_t${tier + 1}`
  const rarity = TIER_RARITIES[tier]
  const stats = slotStats(slot, tier)
  const name = SLOT_NAMES_RU[slot][tier]
  const statDesc = Object.entries(stats).map(([k, v]) => {
    const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР' }
    return `${labels[k] ?? k} +${v}`
  }).join(', ')

  return {
    id,
    name,
    description: `${SLOT_LABELS_RU[slot]} ${tier + 1} ур. Бонусы: ${statDesc}`,
    slot,
    rarity,
    stats,
    icon: SLOT_ICONS[slot][tier],
    sellPrice: 30 + tier * 40,
    tier: tier + 1,
    upgradeLevel: 1,
    starLevel: 0,
  }
}

// 10 items per equipment slot
const generated: Record<string, Item> = {}
for (const slot of Object.keys(SLOT_NAMES_RU) as EquipSlot[]) {
  for (let i = 0; i < 10; i++) {
    const item = buildItem(slot, i)
    generated[item.id] = item
  }
}

// 3 legendary sets — craft-only in forge
const SETS = [
  {
    id: 'shadow_ascension',
    name: 'Восхождение в Тени',
    bonus: 'Полный сет: +25% крит, +15% уклонение, +10% урон из тени',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Шлем Восхождения в Тени', icon: '🌑', stats: { def: 28, crit: 12, hp: 80 } },
      { slot: 'chestplate' as EquipSlot, name: 'Нагрудник Восхождения в Тени', icon: '🌑', stats: { def: 45, hp: 150, atk: 8 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи Восхождения в Тени', icon: '🌑', stats: { def: 25, speed: 15, crit: 5 } },
      { slot: 'boots' as EquipSlot, name: 'Ботинки Восхождения в Тени', icon: '🌑', stats: { speed: 18, def: 12, crit: 8 } },
      { slot: 'necklace' as EquipSlot, name: 'Ожерелье Восхождения в Тени', icon: '🌑', stats: { atk: 15, crit: 18, speed: 5 } },
      { slot: 'ring' as EquipSlot, name: 'Кольцо Восхождения в Тени', icon: '🌑', stats: { crit: 20, atk: 12 } },
      { slot: 'weapon' as EquipSlot, name: 'Клинок Восхождения в Тени', icon: '🌑', stats: { atk: 55, crit: 25, speed: 8 } },
    ],
  },
  {
    id: 'solo_leveling',
    name: 'Поднятие уровня в одиночку',
    bonus: 'Полный сет: +20% опыт, +15% ATK, +10% HP за каждый уровень выше врага',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Шлем Одиночки', icon: '💙', stats: { def: 30, hp: 100, atk: 5 } },
      { slot: 'chestplate' as EquipSlot, name: 'Нагрудник Одиночки', icon: '💙', stats: { def: 50, hp: 180, atk: 8 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи Одиночки', icon: '💙', stats: { def: 28, speed: 12, hp: 60 } },
      { slot: 'boots' as EquipSlot, name: 'Ботинки Одиночки', icon: '💙', stats: { speed: 16, def: 15, atk: 5 } },
      { slot: 'necklace' as EquipSlot, name: 'Ожерелье Одиночки', icon: '💙', stats: { atk: 18, crit: 10, hp: 50 } },
      { slot: 'ring' as EquipSlot, name: 'Кольцо Одиночки', icon: '💙', stats: { atk: 15, crit: 12, speed: 5 } },
      { slot: 'weapon' as EquipSlot, name: 'Клинок Одиночки', icon: '💙', stats: { atk: 60, crit: 15, speed: 10 } },
    ],
  },
  {
    id: 'one_punch',
    name: 'Ванпанчмен',
    bonus: 'Полный сет: +50% ATK, шанс мгновенного убийства обычных мобов (5%)',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Плащ Ванпанчмена', icon: '👊', stats: { def: 15, atk: 20, crit: 10 } },
      { slot: 'chestplate' as EquipSlot, name: 'Костюм Ванпанчмена', icon: '👊', stats: { def: 35, atk: 25, hp: 120 } },
      { slot: 'leggings' as EquipSlot, name: 'Штаны Ванпанчмена', icon: '👊', stats: { def: 20, speed: 20, atk: 10 } },
      { slot: 'boots' as EquipSlot, name: 'Ботинки Ванпанчмена', icon: '👊', stats: { speed: 25, atk: 15, crit: 8 } },
      { slot: 'necklace' as EquipSlot, name: 'Значок героя', icon: '👊', stats: { atk: 30, crit: 15 } },
      { slot: 'ring' as EquipSlot, name: 'Перчатка Ванпанчмена', icon: '👊', stats: { atk: 35, crit: 20 } },
      { slot: 'weapon' as EquipSlot, name: 'Кулак справедливости', icon: '👊', stats: { atk: 80, crit: 30, speed: 15 } },
    ],
  },
  {
    id: 'telegram_hero',
    name: 'Герой Телеграм',
    bonus: 'Полный сет: +20% ATK, +15% CRIT, уникальная аура ✈️',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Корона Героя Телеграм', icon: '✈️', stats: { def: 32, atk: 12, crit: 12, hp: 90 } },
      { slot: 'chestplate' as EquipSlot, name: 'Мантия Героя Телеграм', icon: '✈️', stats: { def: 52, hp: 190, atk: 10, crit: 8 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи Героя Телеграм', icon: '✈️', stats: { def: 30, speed: 14, atk: 8 } },
      { slot: 'boots' as EquipSlot, name: 'Сапоги Героя Телеграм', icon: '✈️', stats: { speed: 20, def: 18, crit: 10 } },
      { slot: 'necklace' as EquipSlot, name: 'Амулет Telegram', icon: '✈️', stats: { atk: 20, crit: 18, hp: 60 } },
      { slot: 'ring' as EquipSlot, name: 'Кольцо Звёзд', icon: '⭐', stats: { atk: 18, crit: 22, speed: 6 } },
      { slot: 'weapon' as EquipSlot, name: 'Клинок Мессенджера', icon: '✈️', stats: { atk: 65, crit: 20, speed: 12 } },
    ],
  },
]

for (const set of SETS) {
  for (const piece of set.pieces) {
    const id = `${set.id}_${piece.slot}`
    const statDesc = Object.entries(piece.stats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР' }
      return `${labels[k] ?? k} +${v}`
    }).join(', ')
    generated[id] = {
      id,
      name: piece.name,
      description: `Сет «${set.name}». ${statDesc}. ${set.bonus}`,
      slot: piece.slot,
      rarity: 'legendary',
      stats: piece.stats,
      icon: piece.icon,
      sellPrice: 2000,
      setId: set.id,
      setName: set.name,
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

const CRAFTABLE_SET_IDS = ['shadow_ascension', 'solo_leveling', 'one_punch'] as const
for (const set of SETS) {
  if (!CRAFTABLE_SET_IDS.includes(set.id as typeof CRAFTABLE_SET_IDS[number])) continue
  for (const piece of set.pieces) {
    const id = `${set.id}_epic_${piece.slot}`
    const epicStats: Partial<Stats> = {}
    for (const [k, v] of Object.entries(piece.stats)) {
      epicStats[k as keyof Stats] = Math.max(1, Math.floor((v as number) * 0.55))
    }
    const statDesc = Object.entries(epicStats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР' }
      return `${labels[k] ?? k} +${v}`
    }).join(', ')
    generated[id] = {
      id,
      name: piece.name,
      description: `Эпический сет «${set.name}». ${statDesc}. ${set.bonus}`,
      slot: piece.slot,
      rarity: 'epic',
      stats: epicStats,
      icon: piece.icon,
      sellPrice: 800,
      setId: `${set.id}_epic`,
      setName: `${set.name} · Эпический`,
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

export const SET_DATA = SETS

export const CONSUMABLES: Record<string, Item> = {
  hp_potion: {
    id: 'hp_potion', name: 'Зелье HP', description: 'Восстанавливает 50% HP в бою.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '🧪', sellPrice: 25, upgradeLevel: 1, starLevel: 0,
  },
  energy_drink: {
    id: 'energy_drink', name: 'Энергетик', description: 'Восстанавливает 30 энергии.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '⚡', sellPrice: 30, upgradeLevel: 1, starLevel: 0,
  },
  legendary_underwear: {
    id: 'legendary_underwear',
    name: 'Легендарные Трусы Неуязвимости',
    description: '«Эти священные трусы видели уже тысячи героев. Говорят, тот, кто их носит, получает иммунитет удара по самолюбию.»',
    slot: 'leggings',
    rarity: 'legendary',
    stats: {},
    icon: '🩲',
    sellPrice: 0,
    upgradeLevel: 1,
    starLevel: 0,
  },
}

export const ALL_ITEMS: Record<string, Item> = { ...generated, ...CONSUMABLES }

export function getItemTemplate(id: string): Item | undefined {
  return ALL_ITEMS[id]
}

export function createItemInstance(templateId: string): Item | null {
  const template = ALL_ITEMS[templateId]
  if (!template) return null
  return {
    ...template,
    instanceId: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    upgradeLevel: template.upgradeLevel ?? 1,
    starLevel: template.starLevel ?? 0,
  }
}

export function getEffectiveItemStats(item: Item): Partial<Stats> {
  const lvl = item.upgradeLevel ?? 1
  const stars = item.starLevel ?? 0
  const mult = 1 + (lvl - 1) * 0.08 + stars * 0.05
  const result: Partial<Stats> = {}
  for (const [k, v] of Object.entries(item.stats ?? {})) {
    result[k as keyof Stats] = Math.floor((v as number) * mult)
  }
  return result
}

export function formatItemStats(item: Item): string {
  const stats = getEffectiveItemStats(item)
  const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР' }
  return Object.entries(stats).map(([k, v]) => `${labels[k] ?? k} +${v}`).join(' · ')
}

export function getLootTableForFloor(floor: number): string[] {
  const tier = Math.min(9, Math.floor((floor - 1) / 1))
  const slots: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet']
  return slots.map((s) => `${s}_t${Math.max(1, Math.min(10, tier + Math.floor(Math.random() * 2) + 1))}`)
}

export function rollEquipmentDrop(floor: number, isBoss: boolean): Item | null {
  const chance = isBoss ? 0.85 : 0.45
  if (Math.random() > chance) return null
  const dropTier = Math.floor(Math.random() * 6) + Math.min(2, Math.floor(floor / 2))
  const tier = Math.min(5, dropTier)
  const slots: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet']
  const slot = slots[Math.floor(Math.random() * slots.length)]
  const id = `${slot}_t${tier + 1}`
  return createItemInstance(id)
}

export const EMPTY_EQUIPPED: EquippedItems = {
  helmet: null, chestplate: null, leggings: null, boots: null,
  necklace: null, ring: null, weapon: null, pet: null,
}

export function getEquipSlotsForClass(classId?: string): EquipSlot[] {
  const base: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring']
  if (classId === 'summoner') return [...base, 'pet']
  return [...base, 'weapon']
}

export function getMobsRequiredForFloor(floor: number): number {
  return floor * 100
}
