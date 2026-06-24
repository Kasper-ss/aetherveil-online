import type { ShopItem, DailyReward, ResourceId, Item } from '@/types/game'
import { EMPTY_EQUIPPED, rollEquipmentDrop, ALL_ITEMS } from '@/data/items'
import { EMPTY_ALLOCATED, getMaxEnergy } from '@/lib/playerStats'
import { GUILD_ID } from '@/lib/multiplayer'
import { syncPlayerSkills } from '@/data/playerSkills'

export { ALL_ITEMS as ITEMS, rollEquipmentDrop, getMobsRequiredForFloor } from '@/data/items'
export { FLOORS, getFloorData, MAX_FLOOR } from '@/data/floors'
export { SKILLS, CLASS_SKILL_TREES, getSkillUpgradeCost, getScaledSkill, SKILL_MAX_LEVEL } from '@/data/playerSkills'

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
  const synced = syncPlayerSkills(
    player.classId,
    player.level ?? 1,
    player.skills ?? [],
    player.skillLevels ?? {},
  )
  return {
    ...player,
    ...synced,
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
    hpLastRegenAt: player.hpLastRegenAt ?? new Date().toISOString(),
    currentHp: player.currentHp,
    maxEnergy: getMaxEnergy({ ...player, allocatedStats: { ...EMPTY_ALLOCATED, ...player.allocatedStats } }),
    resources: {
      iron_ore: 5, herb: 3, hide: 2, upgrade_core: 1,
      ...player.resources,
    },
    marketListings: player.marketListings ?? [],
    expEasterEggClaimed: player.expEasterEggClaimed ?? false,
    underwearEasterEggClaimed: player.underwearEasterEggClaimed ?? false,
    bankBalance: player.bankBalance ?? 0,
    bankLastInterestAt: player.bankLastInterestAt ?? new Date().toISOString(),
    guildId: player.guildId ?? GUILD_ID,
    buffInfiniteEnergyUntil: player.buffInfiniteEnergyUntil,
    buffDoubleExpUntil: player.buffDoubleExpUntil,
    buffTripleGoldUntil: player.buffTripleGoldUntil,
    buffDailyBonusUntil: player.buffDailyBonusUntil,
    auraEffectId: player.auraEffectId,
    cosmeticAvatarId: player.cosmeticAvatarId,
    friendIds: player.friendIds ?? [],
  }
}

export function createDefaultPlayer(telegramId: number, displayName: string, username: string): import('@/types/game').Player {
  return {
    telegramId, username, displayName,
    level: 1, exp: 0, gold: 200, gems: 5,
    energy: 100, maxEnergy: 100,
    energyLastRegenAt: new Date().toISOString(),
    hpLastRegenAt: new Date().toISOString(),
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
    underwearEasterEggClaimed: false,
    bankBalance: 0,
    bankLastInterestAt: new Date().toISOString(),
    guildId: GUILD_ID,
    friendIds: [],
  }
}
