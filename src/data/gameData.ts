import type { FloorData, ShopItem, DailyReward, ResourceId, Item } from '@/types/game'
import { EMPTY_EQUIPPED, getMobsRequiredForFloor, rollEquipmentDrop, ALL_ITEMS } from '@/data/items'
import { EMPTY_ALLOCATED, getMaxEnergy } from '@/lib/playerStats'
import { GUILD_ID } from '@/lib/multiplayer'

export { ALL_ITEMS as ITEMS, rollEquipmentDrop, getMobsRequiredForFloor } from '@/data/items'

export const SKILLS = {
  dual_blades: {
    id: 'dual_blades' as const, name: 'Dual Blades', nameRu: 'Двойные клинки',
    description: 'Rapid strikes', descriptionRu: 'Быстрые удары. +50% урон, наращивает комбо.',
    damageMultiplier: 1.5, cooldown: 4, energyCost: 10, icon: '⚔️',
  },
  sword_skill: {
    id: 'sword_skill' as const, name: 'Sword Skill', nameRu: 'Мечевой навык',
    description: 'Ultimate attack', descriptionRu: 'Мощная атака в стиле SAO. Огромный урон.',
    damageMultiplier: 3.0, cooldown: 14, energyCost: 30, icon: '✨',
  },
  dash_strike: {
    id: 'dash_strike' as const, name: 'Dash Strike', nameRu: 'Рывок',
    description: 'Counter attack', descriptionRu: 'Уклонение и контратака.',
    damageMultiplier: 2.0, cooldown: 6, energyCost: 15, icon: '💨',
  },
  healing_light: {
    id: 'healing_light' as const, name: 'Healing Light', nameRu: 'Исцеление',
    description: 'Restore HP', descriptionRu: 'Восстанавливает 25% HP.',
    damageMultiplier: 0, cooldown: 16, energyCost: 20, icon: '💚',
  },
}

function makeEnemy(floor: number, name: string, pattern: FloorData['enemies'][0]['pattern'], isBoss = false) {
  const mult = isBoss ? 5 : 1
  const baseHp = (180 + floor * 90) * mult
  const baseAtk = (6 + floor * 3) * (isBoss ? 1.4 : 1)
  return {
    id: `${floor}_${name.toLowerCase().replace(/\s/g, '_')}`,
    name,
    pattern,
    stats: {
      hp: Math.floor(baseHp),
      atk: Math.floor(baseAtk),
      def: Math.floor((4 + floor * 2) * (isBoss ? 2 : 1)),
      crit: isBoss ? 12 : 5,
      speed: isBoss ? 6 : 4 + floor,
    },
    expReward: Math.floor((25 + floor * 20) * (isBoss ? 8 : 1)),
    goldReward: [Math.floor((8 + floor * 5) * (isBoss ? 5 : 1)), Math.floor((20 + floor * 12) * (isBoss ? 8 : 1))] as [number, number],
    lootTable: [],
    isBoss,
  }
}

export const FLOORS: FloorData[] = [
  {
    floor: 1, name: 'Город Начала', description: 'Стартовый этаж. Луга и слабые монстры.',
    theme: '#1a3a2a',
    enemies: [makeEnemy(1, 'Френбор', 'aggressive'), makeEnemy(1, 'Непент', 'defensive'), makeEnemy(1, 'Кобольд', 'aggressive')],
    boss: makeEnemy(1, 'Иллфанг — Повелитель кобольдов', 'boss', true),
    mobsRequired: 100, idleGoldPerHour: 50, idleExpPerHour: 30,
  },
  {
    floor: 2, name: 'Кристальные пещеры', description: 'Светящиеся пещеры под Башней.',
    theme: '#1a2a4a',
    enemies: [makeEnemy(2, 'Кристальная летучая мышь', 'aggressive'), makeEnemy(2, 'Пещерная слизь', 'defensive'), makeEnemy(2, 'Каменный голем', 'berserker')],
    boss: makeEnemy(2, 'Кристальный страж', 'boss', true),
    mobsRequired: 200, idleGoldPerHour: 80, idleExpPerHour: 50,
  },
  {
    floor: 3, name: 'Лес Шёпотов', description: 'Древние деревья скрывают хищников.',
    theme: '#1a3a1a',
    enemies: [makeEnemy(3, 'Теневой волк', 'aggressive'), makeEnemy(3, 'Древень', 'defensive'), makeEnemy(3, 'Ядовитый спрайт', 'berserker')],
    boss: makeEnemy(3, 'Древний треант', 'boss', true),
    mobsRequired: 300, idleGoldPerHour: 120, idleExpPerHour: 75,
  },
  {
    floor: 4, name: 'Пепельные пустоши', description: 'Выжженная земля и огненные элементали.',
    theme: '#3a1a1a',
    enemies: [makeEnemy(4, 'Огненный дух', 'aggressive'), makeEnemy(4, 'Пепельный пёс', 'berserker'), makeEnemy(4, 'Магмовый краб', 'defensive')],
    boss: makeEnemy(4, 'Инферно-дрейк', 'boss', true),
    mobsRequired: 400, idleGoldPerHour: 170, idleExpPerHour: 100,
  },
  {
    floor: 5, name: 'Эфирный шпиль', description: 'Первый серьёзный рубеж. Только сильные пройдут.',
    theme: '#2a1a4a',
    enemies: [makeEnemy(5, 'Эфирный рыцарь', 'defensive'), makeEnemy(5, 'Сталкер пустоты', 'aggressive'), makeEnemy(5, 'Фантом разлома', 'berserker')],
    boss: makeEnemy(5, 'Эфирный страж', 'boss', true),
    mobsRequired: 500, idleGoldPerHour: 250, idleExpPerHour: 150,
  },
]

const BASE_SHOP: ShopItem[] = [
  { id: 'shop_hp_potion', name: 'HP Potion x5', nameRu: 'Зелье HP x5', description: '5 healing potions', descriptionRu: 'Набор из 5 зелий лечения.', type: 'consumable', goldPrice: 100, icon: '🧪', itemId: 'hp_potion' },
  { id: 'shop_energy', name: 'Energy x3', nameRu: 'Энергетик x3', description: 'Restore energy', descriptionRu: 'Восстановление энергии.', type: 'convenience', goldPrice: 75, icon: '⚡', itemId: 'energy_drink' },
  { id: 'shop_aether_skin', name: 'Aether Skin', nameRu: 'Эфирная аура', description: 'Cosmetic', descriptionRu: 'Косметический эффект ауры.', type: 'cosmetic', starsPrice: 100, icon: '✨' },
  { id: 'shop_idle_boost', name: 'Idle Boost', nameRu: 'Буст простоя', description: '2x idle 24h', descriptionRu: 'x2 награды простоя на 24ч.', type: 'convenience', gemsPrice: 30, icon: '📈' },
]

const EQUIPMENT_SHOP: ShopItem[] = Object.values(ALL_ITEMS)
  .filter((i) => (i.rarity === 'common' || i.rarity === 'rare') && i.slot !== 'consumable')
  .map((i) => ({
    id: `shop_${i.id}`,
    name: i.name,
    nameRu: i.name,
    description: i.description,
    descriptionRu: i.description,
    type: 'equipment' as const,
    goldPrice: Math.ceil(i.sellPrice * 1.65),
    icon: i.icon,
    itemId: i.id,
  }))

export const SHOP_ITEMS: ShopItem[] = [...BASE_SHOP, ...EQUIPMENT_SHOP]

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gold: 150, gems: 0 },
  { day: 2, gold: 200, gems: 2 },
  { day: 3, gold: 300, gems: 3, itemId: 'hp_potion' },
  { day: 4, gold: 400, gems: 5 },
  { day: 5, gold: 500, gems: 8, itemId: 'energy_drink' },
  { day: 6, gold: 600, gems: 10 },
  { day: 7, gold: 1000, gems: 15, itemId: 'weapon_t2' },
]

export function getFloorData(floor: number): FloorData {
  const f = FLOORS.find((fl) => fl.floor === floor) ?? FLOORS[0]
  return { ...f, mobsRequired: getMobsRequiredForFloor(floor) }
}

export function generateCombatResources(floor: number, isBoss: boolean): Partial<Record<ResourceId, number>> {
  const mult = isBoss ? 3 : 1
  const res: Partial<Record<ResourceId, number>> = {
    iron_ore: Math.max(1, Math.floor((2 + floor) * mult * 0.5)),
    herb: Math.max(1, Math.floor((1 + floor * 0.5) * mult)),
    hide: Math.max(1, Math.floor((1 + floor * 0.6) * mult)),
    upgrade_core: isBoss ? 1 + Math.floor(floor / 2) : Math.random() > 0.7 ? 1 : 0,
  }
  if (floor >= 2) res.gem_shard = Math.max(1, Math.floor(mult * (1 + Math.random() * 2)))
  if (floor >= 3) res.mana_crystal = Math.max(1, Math.floor(mult * Math.random() * 2))
  if (isBoss) {
    res.aether_dust = 2 + Math.floor(Math.random() * 3)
    res.star_shard = 1 + Math.floor(Math.random() * 2)
  } else if (Math.random() > 0.85) {
    res.star_shard = 1
  }
  return Object.fromEntries(Object.entries(res).filter(([, v]) => v > 0)) as Partial<Record<ResourceId, number>>
}

export function generateVictoryLoot(floor: number, isBoss: boolean): Item[] {
  const loot: Item[] = []
  const drop = rollEquipmentDrop(floor, isBoss)
  if (drop) loot.push(drop)
  if (isBoss && Math.random() > 0.4) {
    const bonus = rollEquipmentDrop(floor, true)
    if (bonus) loot.push(bonus)
  } else if (Math.random() > 0.55) {
    const bonus = rollEquipmentDrop(floor, false)
    if (bonus) loot.push(bonus)
  }
  return loot
}

function sanitizeItem(i: import('@/types/game').Item): import('@/types/game').Item {
  return {
    ...i,
    stats: i.stats ?? {},
    rarity: (i.rarity as string) === 'uncommon' ? 'rare' : i.rarity,
    upgradeLevel: i.upgradeLevel ?? 1,
    starLevel: i.starLevel ?? 0,
  }
}

function sanitizeEquipped(equipped: Partial<import('@/types/game').EquippedItems>): import('@/types/game').EquippedItems {
  const result = { ...EMPTY_EQUIPPED }
  for (const slot of Object.keys(EMPTY_EQUIPPED) as (keyof import('@/types/game').EquippedItems)[]) {
    const item = equipped[slot]
    result[slot] = item ? sanitizeItem(item) : null
  }
  return result
}

export function migratePlayer(player: import('@/types/game').Player): import('@/types/game').Player {
  return {
    ...player,
    stats: player.stats ?? { atk: 10, def: 5, hp: 100, crit: 5, speed: 10 },
    classSelected: player.classSelected ?? !!player.classId,
    farmFloor: player.farmFloor ?? player.currentFloor ?? 1,
    floorMobKills: player.floorMobKills ?? {},
    equipped: sanitizeEquipped(player.equipped ?? {}),
    inventory: (player.inventory ?? []).filter((i) => {
      const valid = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet', 'consumable']
      return valid.includes(i.slot)
    }).map(sanitizeItem),
    statPoints: player.statPoints ?? 0,
    allocatedStats: { ...EMPTY_ALLOCATED, ...player.allocatedStats },
    professionLevels: player.professionLevels ?? {},
    professionMythicLevels: player.professionMythicLevels ?? {},
    energyLastRegenAt: player.energyLastRegenAt ?? new Date().toISOString(),
    maxEnergy: getMaxEnergy({ ...player, allocatedStats: { ...EMPTY_ALLOCATED, ...player.allocatedStats } }),
    resources: {
      iron_ore: 5, herb: 3, hide: 2, upgrade_core: 1,
      ...player.resources,
    },
    marketListings: player.marketListings ?? [],
    expEasterEggClaimed: player.expEasterEggClaimed ?? false,
    guildId: player.guildId ?? GUILD_ID,
    buffInfiniteEnergyUntil: player.buffInfiniteEnergyUntil,
    buffDoubleExpUntil: player.buffDoubleExpUntil,
    buffTripleGoldUntil: player.buffTripleGoldUntil,
    buffDailyBonusUntil: player.buffDailyBonusUntil,
    auraEffectId: player.auraEffectId,
    cosmeticAvatarId: player.cosmeticAvatarId,
  }
}

export function createDefaultPlayer(telegramId: number, displayName: string, username: string): import('@/types/game').Player {
  return {
    telegramId, username, displayName,
    level: 1, exp: 0, gold: 200, gems: 5,
    energy: 100, maxEnergy: 100,
    energyLastRegenAt: new Date().toISOString(),
    currentFloor: 1, highestFloor: 1, farmFloor: 1,
    floorMobKills: {},
    stats: { atk: 10, def: 5, hp: 100, crit: 5, speed: 10 },
    statPoints: 0,
    allocatedStats: { ...EMPTY_ALLOCATED },
    equipped: { ...EMPTY_EQUIPPED },
    inventory: [],
    skills: [], skillLevels: {},
    tutorialCompleted: false, dailyRewardStreak: 0,
    referralCode: `AV${telegramId.toString(36).toUpperCase()}`,
    lastOnlineAt: new Date().toISOString(),
    totalPlayTime: 0, pvpWins: 0, pvpLosses: 0,
    classSelected: false, professionLevels: {}, professionMythicLevels: {},
    resources: { iron_ore: 5, herb: 3, hide: 2, upgrade_core: 1 },
    marketListings: [],
    expEasterEggClaimed: false,
    guildId: GUILD_ID,
  }
}
