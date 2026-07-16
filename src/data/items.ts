import type { Item, ItemRarity, ItemSlot, Stats, EquippedItems } from '@/types/game'
import { ensureItemDurability, getDurabilityStatMult, getMaxDurability } from '@/lib/equipmentDurability'
import { LUCKY_SETS } from '@/data/luckySets'
import { CLASS_COMMON_SETS, SET_CLASS_MAP } from '@/data/classSets'
import { MAXIMIT_ITEMS } from '@/data/maximitSet'
import { RAID_EXCLUSIVE_ITEMS } from '@/data/raidExclusiveGear'

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

export const RARITY_ORDER: Record<import('@/types/game').ItemRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
}

const EQUIP_SLOT_ORDER: EquipSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet',
]

export type GearSortMode = 'type' | 'rarity'

export function sortGearItems(items: Item[], mode: GearSortMode): Item[] {
  const sorted = [...items]
  const slotIndex = (slot: Item['slot']) => {
    if (slot === 'consumable') return 99
    return EQUIP_SLOT_ORDER.indexOf(slot as EquipSlot)
  }
  if (mode === 'type') {
    sorted.sort((a, b) => {
      const slotDiff = slotIndex(a.slot) - slotIndex(b.slot)
      if (slotDiff !== 0) return slotDiff
      return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]
    })
  } else {
    sorted.sort((a, b) => {
      const rarityDiff = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]
      if (rarityDiff !== 0) return rarityDiff
      return slotIndex(a.slot) - slotIndex(b.slot)
    })
  }
  return sorted
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
    const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
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

// Legendary sets — craft-only in forge
const SETS: Array<{
  id: string
  name: string
  bonus: string
  classId?: import('@/types/game').PlayerClass
  pieces: Array<{ slot: EquipSlot; name: string; icon: string; stats: Partial<Stats> }>
}> = [
  {
    id: 'shadow_ascension',
    classId: 'rogue',
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
    classId: 'mage',
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
    classId: 'monk',
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
    classId: 'hunter',
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

// Эпические сеты — отдельные от легендарных (Тени, Одиночка, Ванпанчмен)
const EPIC_SETS: Array<{
  id: string
  name: string
  bonus: string
  classId?: import('@/types/game').PlayerClass
  pieces: Array<{ slot: EquipSlot; name: string; icon: string; stats: Partial<Stats> }>
}> = [
  {
    id: 'storm_breaker',
    classId: 'warrior',
    name: 'Громобой',
    bonus: 'Полный сет: +12% ATK, +8% крит, +5% скорость',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Шлем Громобоя', icon: '⚡', stats: { def: 18, atk: 6, crit: 8 } },
      { slot: 'chestplate' as EquipSlot, name: 'Кираса Громобоя', icon: '⚡', stats: { def: 30, hp: 90, atk: 5 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи Громобоя', icon: '⚡', stats: { def: 16, speed: 10, atk: 4 } },
      { slot: 'boots' as EquipSlot, name: 'Сапоги Громобоя', icon: '⚡', stats: { speed: 14, def: 10, crit: 5 } },
      { slot: 'necklace' as EquipSlot, name: 'Амулет бури', icon: '⚡', stats: { atk: 12, crit: 10 } },
      { slot: 'ring' as EquipSlot, name: 'Кольцо молнии', icon: '⚡', stats: { atk: 10, crit: 12 } },
      { slot: 'weapon' as EquipSlot, name: 'Молот грома', icon: '⚡', stats: { atk: 38, crit: 14, speed: 6 } },
    ],
  },
  {
    id: 'crystal_guard',
    classId: 'paladin',
    name: 'Кристальный Страж',
    bonus: 'Полный сет: +15% DEF, +80 HP, +6% сопротивление',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Корона кристалла', icon: '💠', stats: { def: 22, hp: 50, crit: 4 } },
      { slot: 'chestplate' as EquipSlot, name: 'Кираса кристалла', icon: '💠', stats: { def: 36, hp: 110 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи кристалла', icon: '💠', stats: { def: 20, hp: 40, speed: 6 } },
      { slot: 'boots' as EquipSlot, name: 'Сапоги кристалла', icon: '💠', stats: { def: 14, speed: 8, hp: 30 } },
      { slot: 'necklace' as EquipSlot, name: 'Ожерелье стража', icon: '💠', stats: { def: 8, hp: 45, atk: 6 } },
      { slot: 'ring' as EquipSlot, name: 'Кольцо стража', icon: '💠', stats: { def: 10, hp: 35, crit: 6 } },
      { slot: 'weapon' as EquipSlot, name: 'Клинок кристалла', icon: '💠', stats: { atk: 28, def: 8, hp: 40 } },
    ],
  },
  {
    id: 'beast_master',
    classId: 'hunter',
    name: 'Повелитель Зверей',
    bonus: 'Полный сет: +10% урон питомцу, +12% дроп, +8% скорость',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Маска охотника', icon: '🐺', stats: { def: 16, speed: 10, crit: 6 } },
      { slot: 'chestplate' as EquipSlot, name: 'Шкура альфы', icon: '🐺', stats: { def: 28, hp: 85, atk: 6 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи следопыта', icon: '🐺', stats: { def: 18, speed: 12, atk: 4 } },
      { slot: 'boots' as EquipSlot, name: 'Сапоги следопыта', icon: '🐺', stats: { speed: 16, def: 8, crit: 5 } },
      { slot: 'necklace' as EquipSlot, name: 'Клык зверя', icon: '🐺', stats: { atk: 14, crit: 8, speed: 4 } },
      { slot: 'ring' as EquipSlot, name: 'Коготь зверя', icon: '🐺', stats: { atk: 12, crit: 10 } },
      { slot: 'weapon' as EquipSlot, name: 'Копьё повелителя', icon: '🐺', stats: { atk: 34, crit: 12, speed: 8 } },
    ],
  },
  {
    id: 'assassin',
    classId: 'rogue',
    name: 'Ассасин',
    bonus: 'Полный сет: +35% к шансу крита и +20% к урону от скрытых атак',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Капюшон Ассасина', icon: '🗡️', stats: { def: 14, atk: 8, crit: 10, stealth: 6 } },
      { slot: 'chestplate' as EquipSlot, name: 'Плащ Ассасина', icon: '🗡️', stats: { def: 20, atk: 12, crit: 8, stealth: 5 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи Ассасина', icon: '🗡️', stats: { def: 12, atk: 6, crit: 12, stealth: 10 } },
      { slot: 'boots' as EquipSlot, name: 'Сапоги Ассасина', icon: '🗡️', stats: { speed: 16, atk: 8, crit: 8, stealth: 12 } },
      { slot: 'necklace' as EquipSlot, name: 'Амулет тени', icon: '🗡️', stats: { atk: 16, crit: 14, stealth: 8 } },
      { slot: 'ring' as EquipSlot, name: 'Кольцо убийцы', icon: '🗡️', stats: { atk: 12, crit: 16, stealth: 6 } },
      { slot: 'weapon' as EquipSlot, name: 'Клинок Ассасина', icon: '🗡️', stats: { atk: 42, crit: 18, stealth: 10 } },
    ],
  },
]

const MYTHIC_SETS = [
  {
    id: 'penivise',
    classId: 'warlock' as import('@/types/game').PlayerClass,
    name: 'Пенивайз',
    bonus: 'Полный сет: +50% урон по одной цели, +25% восстановление энергии, страх на врагов',
    pieces: [
      { slot: 'helmet' as EquipSlot, name: 'Маска Пенивайза', icon: '👁️', stats: { def: 32, atk: 22, stealth: 18, crit: 12 } },
      { slot: 'chestplate' as EquipSlot, name: 'Мантия Пенивайза', icon: '👁️', stats: { def: 48, atk: 28, stealth: 14, hp: 120 } },
      { slot: 'leggings' as EquipSlot, name: 'Поножи Пенивайза', icon: '👁️', stats: { def: 26, atk: 18, stealth: 20, crit: 10 } },
      { slot: 'boots' as EquipSlot, name: 'Сапоги Пенивайза', icon: '👁️', stats: { speed: 22, atk: 16, stealth: 24, crit: 12 } },
      { slot: 'necklace' as EquipSlot, name: 'Око Пенивайза', icon: '👁️', stats: { atk: 32, crit: 20, stealth: 16 } },
      { slot: 'ring' as EquipSlot, name: 'Печать Пенивайза', icon: '👁️', stats: { atk: 28, crit: 22, stealth: 14 } },
      { slot: 'weapon' as EquipSlot, name: 'Клинок Пенивайза', icon: '👁️', stats: { atk: 95, crit: 28, stealth: 22 } },
    ],
  },
]

for (const set of SETS) {
  for (const piece of set.pieces) {
    const id = `${set.id}_${piece.slot}`
    const statDesc = Object.entries(piece.stats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
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
      requiredClass: set.classId ?? SET_CLASS_MAP[set.id],
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

for (const set of EPIC_SETS) {
  for (const piece of set.pieces) {
    const id = `${set.id}_${piece.slot}`
    const statDesc = Object.entries(piece.stats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
      return `${labels[k] ?? k} +${v}`
    }).join(', ')
    generated[id] = {
      id,
      name: piece.name,
      description: `Эпический сет «${set.name}». ${statDesc}. ${set.bonus}`,
      slot: piece.slot,
      rarity: 'epic',
      stats: piece.stats,
      icon: piece.icon,
      sellPrice: 900,
      setId: set.id,
      setName: set.name,
      requiredClass: set.classId ?? SET_CLASS_MAP[set.id],
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

for (const set of MYTHIC_SETS) {
  for (const piece of set.pieces) {
    const id = `${set.id}_${piece.slot}`
    const statDesc = Object.entries(piece.stats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
      return `${labels[k] ?? k} +${v}`
    }).join(', ')
    generated[id] = {
      id,
      name: piece.name,
      description: `Мифический сет «${set.name}». ${statDesc}. ${set.bonus}`,
      slot: piece.slot,
      rarity: 'mythic',
      stats: piece.stats,
      icon: piece.icon,
      sellPrice: 5000,
      setId: set.id,
      setName: set.name,
      requiredClass: set.classId ?? SET_CLASS_MAP[set.id],
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

for (const set of LUCKY_SETS) {
  for (const piece of set.pieces) {
    const id = `${set.id}_${piece.slot}`
    const statDesc = Object.entries(piece.stats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
      return `${labels[k] ?? k} +${v}`
    }).join(', ')
    generated[id] = {
      id,
      name: piece.name,
      description: `Lucky-сет «${set.classLabel}». ${statDesc}. ${set.bonus}`,
      slot: piece.slot,
      rarity: 'legendary',
      stats: piece.stats,
      icon: piece.icon,
      sellPrice: 3500,
      setId: set.id,
      setName: set.name,
      requiredClass: set.classId,
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

for (const set of CLASS_COMMON_SETS) {
  for (const piece of set.pieces) {
    const id = `${set.id}_${piece.slot}`
    const statDesc = Object.entries(piece.stats).map(([k, v]) => {
      const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
      return `${labels[k] ?? k} +${v}`
    }).join(', ')
    generated[id] = {
      id,
      name: piece.name,
      description: `Сет «${set.name}». ${statDesc}. ${set.bonus}`,
      slot: piece.slot,
      rarity: 'common',
      stats: piece.stats,
      icon: piece.icon,
      sellPrice: 80,
      setId: set.id,
      setName: set.name,
      requiredClass: set.classId,
      upgradeLevel: 1,
      starLevel: 0,
    }
  }
}

export const SET_DATA = [...SETS, ...EPIC_SETS, ...MYTHIC_SETS, ...LUCKY_SETS, ...CLASS_COMMON_SETS]

export const CONSUMABLES: Record<string, Item> = {
  hp_potion: {
    id: 'hp_potion', name: 'Зелье HP', description: 'Восстанавливает 50% HP в бою.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '🧪', sellPrice: 25, upgradeLevel: 1, starLevel: 0,
  },
  hp_potion_rare: {
    id: 'hp_potion_rare', name: 'Сильное зелье HP', description: 'Восстанавливает 65% HP в бою.',
    slot: 'consumable', rarity: 'rare', stats: {}, icon: '🧪', sellPrice: 55, upgradeLevel: 1, starLevel: 0,
  },
  hp_potion_epic: {
    id: 'hp_potion_epic', name: 'Эпическое зелье HP', description: 'Восстанавливает 80% HP в бою.',
    slot: 'consumable', rarity: 'epic', stats: {}, icon: '🧪', sellPrice: 120, upgradeLevel: 1, starLevel: 0,
  },
  hp_potion_legendary: {
    id: 'hp_potion_legendary', name: 'Легендарное зелье жизни', description: 'Полностью восстанавливает HP в бою.',
    slot: 'consumable', rarity: 'legendary', stats: {}, icon: '🧪', sellPrice: 250, upgradeLevel: 1, starLevel: 0,
  },
  energy_drink: {
    id: 'energy_drink', name: 'Энергетик', description: 'Восстанавливает 30 энергии.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '⚡', sellPrice: 30, upgradeLevel: 1, starLevel: 0,
  },
  energy_drink_rare: {
    id: 'energy_drink_rare', name: 'Мощный энергетик', description: 'Восстанавливает 50 энергии.',
    slot: 'consumable', rarity: 'rare', stats: {}, icon: '⚡', sellPrice: 60, upgradeLevel: 1, starLevel: 0,
  },
  fishing_bait: {
    id: 'fishing_bait', name: 'Наживка', description: 'Расходник для рыбалки.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '🪱', sellPrice: 5, upgradeLevel: 1, starLevel: 0,
  },
  food_roast_meat: {
    id: 'food_roast_meat', name: 'Жареное мясо', description: 'Еда: +10% ATK на 20 мин.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '🍖', sellPrice: 30, upgradeLevel: 1, starLevel: 0,
  },
  food_herb_soup: {
    id: 'food_herb_soup', name: 'Травяной суп', description: 'Еда: +15% HP на 25 мин.',
    slot: 'consumable', rarity: 'common', stats: {}, icon: '🍲', sellPrice: 35, upgradeLevel: 1, starLevel: 0,
  },
  food_fish_grill: {
    id: 'food_fish_grill', name: 'Рыбный гриль', description: 'Еда: +12% скорость на 20 мин.',
    slot: 'consumable', rarity: 'rare', stats: {}, icon: '🐟', sellPrice: 55, upgradeLevel: 1, starLevel: 0,
  },
  food_sea_feast: {
    id: 'food_sea_feast', name: 'Морской пир', description: 'Еда: +15% CRIT на 30 мин.',
    slot: 'consumable', rarity: 'epic', stats: {}, icon: '🦞', sellPrice: 90, upgradeLevel: 1, starLevel: 0,
  },
  food_mana_brew: {
    id: 'food_mana_brew', name: 'Мана-отвар', description: 'Еда: +12% ко всем статам на 25 мин.',
    slot: 'consumable', rarity: 'rare', stats: {}, icon: '🧪', sellPrice: 70, upgradeLevel: 1, starLevel: 0,
  },
  food_aether_sushi: {
    id: 'food_aether_sushi', name: 'Эфирное суши', description: 'Еда: +18% ко всем статам на 40 мин.',
    slot: 'consumable', rarity: 'legendary', stats: {}, icon: '✨', sellPrice: 200, upgradeLevel: 1, starLevel: 0,
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
  keeper_medallion: {
    id: 'keeper_medallion',
    name: 'Медальон Древних Традиций',
    description: 'Награда хранителя за обнаружение священной реликвии башни.',
    slot: 'necklace',
    rarity: 'legendary',
    stats: { atk: 15, def: 10, hp: 50, crit: 5 },
    icon: '🏅',
    sellPrice: 0,
    upgradeLevel: 1,
    starLevel: 0,
  },
  aether_worldbreaker: {
    id: 'aether_worldbreaker',
    name: 'Клинок Разлома Миров',
    description: 'Легендарный меч, выкованный из сердца Архонта. Нельзя купить или скрафтить.',
    slot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 88, def: 12, hp: 120, crit: 18, speed: 10 },
    icon: '🗡️',
    sellPrice: 0,
    upgradeLevel: 1,
    starLevel: 0,
  },
}

export const ALL_ITEMS: Record<string, Item> = { ...generated, ...CONSUMABLES, ...RAID_EXCLUSIVE_ITEMS, ...MAXIMIT_ITEMS }

export function getItemTemplate(id: string): Item | undefined {
  return ALL_ITEMS[id]
}

export function createItemInstance(templateId: string): Item | null {
  const template = ALL_ITEMS[templateId]
  if (!template) return null
  const base: Item = {
    ...template,
    instanceId: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    upgradeLevel: template.upgradeLevel ?? 1,
    starLevel: template.starLevel ?? 0,
  }
  return ensureItemDurability(base)
}

export const UPGRADE_LEVEL_STEP_PERCENT = 3

export function getUpgradeLevelStepPercent(_level: number): number {
  return UPGRADE_LEVEL_STEP_PERCENT
}

export function getUpgradeLevelStatBonus(level: number): number {
  if (level <= 1) return 0
  return (level - 1) * (UPGRADE_LEVEL_STEP_PERCENT / 100)
}

/** Per-star quality leap — each star compounds (significant stat tier jump). */
const STAR_TIER_STEP_MULT = [1.82, 1.55, 1.45, 1.38, 1.32, 1.28, 1.24, 1.22, 1.20, 1.18]

export function getStarStepTierMult(star: number): number {
  if (star <= 0) return 1
  return STAR_TIER_STEP_MULT[Math.min(star, STAR_TIER_STEP_MULT.length) - 1]
}

export function getStarTierMult(stars: number): number {
  let mult = 1
  for (let i = 0; i < Math.min(stars, STAR_TIER_STEP_MULT.length); i++) {
    mult *= STAR_TIER_STEP_MULT[i]
  }
  return mult
}

/** @deprecated Use getStarStepTierMult — kept for UI percent labels. */
export function getStarStepPercent(star: number): number {
  return Math.round((getStarStepTierMult(star) - 1) * 100)
}

export function getStarStatBonus(stars: number): number {
  return getStarTierMult(stars) - 1
}

export function getItemStatMultiplier(item: Item): number {
  const lvl = item.upgradeLevel ?? 1
  const stars = item.starLevel ?? 0
  return (1 + getUpgradeLevelStatBonus(lvl)) * getStarTierMult(stars)
}

export function getItemStatDeltaPreview(item: Item, kind: 'level' | 'star'): Partial<Stats> {
  const current = getEffectiveItemStats(item)
  const nextItem = kind === 'level'
    ? { ...item, upgradeLevel: Math.min(10, (item.upgradeLevel ?? 1) + 1) }
    : { ...item, starLevel: Math.min(10, (item.starLevel ?? 0) + 1) }
  const next = getEffectiveItemStats(nextItem)
  const delta: Partial<Stats> = {}
  for (const key of Object.keys(next) as (keyof Stats)[]) {
    const diff = (next[key] ?? 0) - (current[key] ?? 0)
    if (diff > 0) delta[key] = diff
  }
  return delta
}

export function formatStatDelta(delta: Partial<Stats>): string {
  const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
  const parts = Object.entries(delta)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `+${v} ${labels[k] ?? k}`)
  return parts.length ? parts.join(', ') : ''
}

export function getEffectiveItemStats(item: Item): Partial<Stats> {
  const mult = getItemStatMultiplier(item)
  const duraMult = getDurabilityStatMult(item)
  const maxDura = item.maxDurability ?? getMaxDurability(item)
  const currentDura = item.durability ?? maxDura
  const broken = maxDura > 0 && currentDura <= 0
  const result: Partial<Stats> = {}
  for (const [k, v] of Object.entries(item.stats ?? {})) {
    // HP bonus only drops when gear is fully broken — not from normal post-fight wear
    const effectiveDura = k === 'hp' && !broken ? 1 : duraMult
    result[k as keyof Stats] = Math.floor((v as number) * mult * effectiveDura)
  }
  return result
}

export function formatItemStats(item: Item): string {
  const stats = getEffectiveItemStats(item)
  const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР', stealth: 'СКРЫТ' }
  return Object.entries(stats).map(([k, v]) => `${labels[k] ?? k} +${v}`).join(' · ')
}

export function getBaseItemName(item: Item): string {
  const template = ALL_ITEMS[item.id]
  if (template) return template.name
  return item.name
    .replace(/^✦ /, '')
    .replace(/\s+\+\d+/g, '')
    .replace(/\s+★+/g, '')
    .trim()
}

export function formatItemDisplayName(item: Item): string {
  const base = getBaseItemName(item)
  const lvl = item.upgradeLevel ?? 1
  const stars = item.starLevel ?? 0
  let name = item.rarity === 'mythic' ? `✦ ${base}` : base
  if (lvl > 1) name += ` +${lvl}`
  if (stars > 0) name += ` ${'★'.repeat(stars)}`
  return name
}

export function buildItemBonusDescription(item: Item): string {
  const template = ALL_ITEMS[item.id]
  const prefix = template?.description?.split('Бонусы:')[0]?.trim()
    ?? template?.description?.split('.')[0]?.trim()
    ?? item.name
  const mythicTag = item.rarity === 'mythic' ? ' [Мифический]' : ''
  return `${prefix}. Бонусы: ${formatItemStats(item)}.${mythicTag}`
}

export function refreshItemMeta(item: Item): Item {
  return {
    ...item,
    name: formatItemDisplayName(item),
    description: buildItemBonusDescription(item),
  }
}

export function clearItemClassBinding(item: Item): Item {
  if (!item.requiredClass) return item
  const { requiredClass: _rc, ...rest } = item
  return rest as Item
}

export function resolveItemRequiredClass(
  item: Pick<Item, 'id' | 'requiredClass' | 'setId' | 'slot'>,
): import('@/types/game').PlayerClass | undefined {
  if (item.requiredClass) return item.requiredClass
  const template = ALL_ITEMS[item.id]
  if (template?.requiredClass) return template.requiredClass
  const setId = item.setId ?? template?.setId
  if (setId && SET_CLASS_MAP[setId]) return SET_CLASS_MAP[setId]
  return undefined
}

export function stampItemClassBinding(item: Item): Item {
  if (item.slot === 'consumable') return item
  const requiredClass = resolveItemRequiredClass(item)
  if (!requiredClass || item.requiredClass === requiredClass) return item
  return { ...item, requiredClass }
}

export function getLootTableForFloor(floor: number): string[] {
  const tier = Math.min(9, Math.floor((floor - 1) / 1))
  const slots: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet']
  return slots.map((s) => `${s}_t${Math.max(1, Math.min(10, tier + Math.floor(Math.random() * 2) + 1))}`)
}

export function rollEquipmentDrop(
  floor: number,
  isBoss: boolean,
  lootMult = 1,
): Item | null {
  const chance = Math.min(0.98, (isBoss ? 0.85 : 0.45) * lootMult)
  if (Math.random() > chance) return null

  if (Math.random() < 0.18 && CLASS_COMMON_SETS.length > 0) {
    const set = CLASS_COMMON_SETS[Math.floor(Math.random() * CLASS_COMMON_SETS.length)]
    const piece = set.pieces[Math.floor(Math.random() * set.pieces.length)]
    const inst = createItemInstance(`${set.id}_${piece.slot}`)
    if (inst) return inst
  }

  const dropTier = Math.floor(Math.random() * 4) + Math.min(8, Math.floor(floor / 4))
  const tier = Math.min(10, Math.max(1, dropTier))
  const slots: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet']
  const slot = slots[Math.floor(Math.random() * slots.length)]
  const id = `${slot}_t${tier + 1}`
  return createItemInstance(id)
}

export const EMPTY_EQUIPPED: EquippedItems = {
  helmet: null, chestplate: null, leggings: null, boots: null,
  necklace: null, ring: null, weapon: null, pet: null,
}

export function getEquipSlotsForClass(_classId?: string): EquipSlot[] {
  const base: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring']
  return [...base, 'weapon', 'pet']
}

export function getMobsRequiredForFloor(_floor: number): number {
  return 100
}
