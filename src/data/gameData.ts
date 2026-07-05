import type { ShopItem, DailyReward, ResourceId, Item } from '@/types/game'
import { EMPTY_EQUIPPED, rollEquipmentDrop, ALL_ITEMS, refreshItemMeta } from '@/data/items'
import { EMPTY_ALLOCATED, getMaxEnergy } from '@/lib/playerStats'
import { ensureItemDurability } from '@/lib/equipmentDurability'
import { getMaxMana, usesMana } from '@/lib/mana'
import { GUILD_ID } from '@/lib/multiplayer'
import { syncPlayerSkills } from '@/data/playerSkills'
import { TOOL_SHOP_ITEMS } from '@/data/tools'
import { SCROLL_SHOP_ITEMS, migrateUnlockedSetScrolls } from '@/data/setScrolls'
import { RESOURCE_SHOP_ITEMS } from '@/data/resourceShop'
import { BASE_PROFESSION_SLOTS } from '@/lib/professionProgress'
import { defaultQuestState } from '@/lib/quests'
import { defaultMonthlyStats, monthKey } from '@/lib/monthlyStats'
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/vitalNotifications'
import { SAVE_VERSION } from '@/lib/playerMigration'

export { ALL_ITEMS as ITEMS, rollEquipmentDrop, getMobsRequiredForFloor } from '@/data/items'
export { FLOORS, getFloorData, MAX_FLOOR } from '@/data/floors'
export { SKILLS, CLASS_SKILL_TREES, getSkillUpgradeCost, getScaledSkill, SKILL_MAX_LEVEL } from '@/data/playerSkills'

const BASE_SHOP: ShopItem[] = [
  { id: 'shop_hp_potion', name: 'HP Potion x5', nameRu: 'Зелье HP x5', description: '5 healing potions', descriptionRu: 'Набор из 5 зелий лечения.', type: 'consumable', goldPrice: 100, icon: '🧪', itemId: 'hp_potion', bundleCount: 5 },
  { id: 'shop_hp_potion_big', name: 'Big HP Potion x5', nameRu: 'Большое зелье HP x5', description: '5 epic healing potions', descriptionRu: 'Набор из 5 больших зелий (80% HP).', type: 'consumable', goldPrice: 420, icon: '🧪', itemId: 'hp_potion_epic', bundleCount: 5 },
  { id: 'shop_energy', name: 'Energy x3', nameRu: 'Энергетик x3', description: 'Restore energy', descriptionRu: 'Восстановление энергии.', type: 'convenience', goldPrice: 75, icon: '⚡', itemId: 'energy_drink', bundleCount: 3 },
  { id: 'shop_energy_big', name: 'Big Energy x3', nameRu: 'Большой энергетик x3', description: '3 powerful energy drinks', descriptionRu: 'Набор из 3 мощных энергетиков (+50).', type: 'convenience', goldPrice: 165, icon: '⚡', itemId: 'energy_drink_rare', bundleCount: 3 },
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

export const SHOP_ITEMS: ShopItem[] = [
  ...BASE_SHOP,
  ...TOOL_SHOP_ITEMS,
  ...RESOURCE_SHOP_ITEMS,
  ...SCROLL_SHOP_ITEMS,
  ...EQUIPMENT_SHOP,
]

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gold: 150, gems: 0 },
  { day: 2, gold: 200, gems: 2 },
  { day: 3, gold: 300, gems: 3, itemId: 'hp_potion' },
  { day: 4, gold: 400, gems: 5 },
  { day: 5, gold: 500, gems: 8, itemId: 'energy_drink' },
  { day: 6, gold: 600, gems: 10 },
  { day: 7, gold: 1000, gems: 15, itemId: 'weapon_t2' },
]

export function generateCombatResources(
  floor: number,
  isBoss: boolean,
  isEpic = false,
  isMiniBoss = false,
): Partial<Record<ResourceId, number>> {
  const mult = isBoss ? 3 : isMiniBoss ? 2.5 : isEpic ? 2 : 1
  const meat = Math.max(1, Math.floor((2 + floor * 0.8) * mult + Math.random() * 2))
  const hide = Math.max(1, Math.floor((1 + floor * 0.5) * mult))

  const res: Partial<Record<ResourceId, number>> = { meat, hide }

  const dustChance = isBoss ? 0.5 : isMiniBoss ? 0.32 : isEpic ? 0.18 : 0.05
  if (Math.random() < dustChance) {
    res.aether_dust = isBoss ? 2 + Math.floor(Math.random() * 2) : isMiniBoss ? 1 + Math.floor(Math.random() * 2) : 1
  }

  if (isBoss) {
    res.upgrade_core = 1 + Math.floor(floor / 3)
    if (Math.random() > 0.5) res.star_shard = 1
  } else if (isMiniBoss) {
    if (Math.random() < 0.45) res.gem_shard = 1 + Math.floor(Math.random() * 2)
    if (Math.random() < 0.22) res.star_shard = 1
    if (Math.random() < 0.18) res.upgrade_core = 1
  }

  return res
}

export function generateVictoryLoot(
  floor: number,
  isBoss: boolean,
  lootMult = 1,
  isEpic = false,
  isMiniBoss = false,
): Item[] {
  const loot: Item[] = []
  const bonusMult = isMiniBoss ? 1.65 : isEpic ? 1.5 : 1
  const effectiveMult = lootMult * bonusMult
  const boostedRoll = isBoss || isEpic || isMiniBoss

  if (!boostedRoll && Math.random() > 0.1) return loot

  const drop = rollEquipmentDrop(floor, isBoss || isEpic || isMiniBoss, effectiveMult)
  if (drop) loot.push(drop)

  if (isBoss && Math.random() > 0.35) {
    const bonus = rollEquipmentDrop(floor, true, effectiveMult)
    if (bonus) loot.push(bonus)
  } else if (boostedRoll && Math.random() > (isMiniBoss ? 0.35 : 0.5)) {
    const bonus = rollEquipmentDrop(floor, isBoss || isMiniBoss, effectiveMult)
    if (bonus) loot.push(bonus)
  }

  return loot
}

function sanitizeItem(i: import('@/types/game').Item): import('@/types/game').Item {
  const base = {
    ...i,
    stats: i.stats ?? {},
    rarity: (i.rarity as string) === 'uncommon' ? 'rare' : i.rarity,
    upgradeLevel: i.upgradeLevel ?? 1,
    starLevel: i.starLevel ?? 0,
  }
  return refreshItemMeta(ensureItemDurability(base))
}

function sanitizeEquipped(equipped: Partial<import('@/types/game').EquippedItems>): import('@/types/game').EquippedItems {
  const result = { ...EMPTY_EQUIPPED }
  for (const slot of Object.keys(EMPTY_EQUIPPED) as (keyof import('@/types/game').EquippedItems)[]) {
    const item = equipped[slot]
    result[slot] = item ? sanitizeItem(item) : null
  }
  return result
}

function migrateBossTrophies(player: import('@/types/game').Player): string[] {
  const earned = new Set(player.bossTrophies ?? [])
  const highest = player.highestFloor ?? 1
  for (let f = 1; f < highest; f++) {
    earned.add(`trophy_floor_${f}`)
  }
  if ((player.worldBossKills ?? 0) > 0 || player.worldBossLastKillAt) {
    earned.add('trophy_world_boss')
  }
  return [...earned]
}

export function migratePlayer(player: import('@/types/game').Player): import('@/types/game').Player {
  const synced = syncPlayerSkills(
    player.classId,
    player.level ?? 1,
    player.skills ?? [],
    player.skillLevels ?? {},
  )
  const migrated: import('@/types/game').Player = {
    ...player,
    ...synced,
    stats: player.stats ?? { atk: 10, def: 5, hp: 100, crit: 5, speed: 10 },
    classSelected: player.classSelected ?? !!player.classId,
    farmFloor: player.farmFloor ?? player.currentFloor ?? 1,
    floorMobKills: player.floorMobKills ?? {},
    floorMiniBossKills: player.floorMiniBossKills ?? {},
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
      iron_ore: 5, herb: 3, hide: 2, meat: 3, upgrade_core: 1,
      ...player.resources,
    },
    marketListings: player.marketListings ?? [],
    expEasterEggClaimed: player.expEasterEggClaimed ?? false,
    underwearEasterEggClaimed: player.underwearEasterEggClaimed ?? false,
    bankBalance: player.bankBalance ?? 0,
    bankLastInterestAt: player.bankLastInterestAt ?? new Date().toISOString(),
    bankPendingInterest: player.bankPendingInterest ?? 0,
    stockPortfolio: player.stockPortfolio ?? {},
    stockPendingDividends: player.stockPendingDividends ?? 0,
    stockLastDividendAt: player.stockLastDividendAt ?? new Date().toISOString(),
    stockLimitOrders: player.stockLimitOrders ?? [],
    buffFateGoldUntil: player.buffFateGoldUntil,
    buffFateExpUntil: player.buffFateExpUntil,
    fateCardLastUsedAt: player.fateCardLastUsedAt,
    guildId: player.guildId ?? GUILD_ID,
    buffInfiniteEnergyUntil: player.buffInfiniteEnergyUntil,
    buffDoubleExpUntil: player.buffDoubleExpUntil,
    buffTripleGoldUntil: player.buffTripleGoldUntil,
    buffDailyBonusUntil: player.buffDailyBonusUntil,
    auraEffectId: player.auraEffectId,
    cosmeticAvatarId: player.cosmeticAvatarId,
    profileFrameId: player.profileFrameId,
    unlockedCosmetics: player.unlockedCosmetics ?? [],
    friendIds: player.friendIds ?? [],
    activeEffects: player.activeEffects ?? [],
    activeProfessions: player.activeProfessions ?? (player.profession ? [player.profession] : []),
    professionSlotLimit: player.professionSlotLimit ?? BASE_PROFESSION_SLOTS,
    professionExp: player.professionExp ?? {},
    unlockedSetScrolls: migrateUnlockedSetScrolls(player.unlockedSetScrolls),
    ownedTools: player.ownedTools ?? [],
    mineLevel: player.mineLevel ?? 1,
    mineDigXp: player.mineDigXp ?? 0,
    fieldLevel: player.fieldLevel ?? 1,
    fieldGatherXp: player.fieldGatherXp ?? 0,
    huntLevel: player.huntLevel ?? 1,
    huntXp: player.huntXp ?? 0,
    gemSiteLevel: player.gemSiteLevel ?? 1,
    gemSiteXp: player.gemSiteXp ?? 0,
    aetherRiftLevel: player.aetherRiftLevel ?? 1,
    aetherRiftXp: player.aetherRiftXp ?? 0,
    fishingSpotLevel: player.fishingSpotLevel ?? 1,
    fishingSpotXp: player.fishingSpotXp ?? 0,
    fishCaughtTotal: player.fishCaughtTotal ?? 0,
    questState: player.questState ?? defaultQuestState(player),
    monthlyStats: player.monthlyStats ?? defaultMonthlyStats(player),
    monthlyRewardsClaimed: player.monthlyStats?.monthKey === monthKey()
      ? (player.monthlyRewardsClaimed ?? [])
      : [],
    achievementsClaimed: player.achievementsClaimed ?? [],
    bossTrophies: migrateBossTrophies(player),
    worldBossLastKillAt: player.worldBossLastKillAt,
    worldBossKills: player.worldBossKills ?? 0,
    lifetimeGoldEarned: player.lifetimeGoldEarned ?? 0,
    referralInvites: player.referralInvites ?? [],
    referralEarnings: player.referralEarnings ?? { signupGold: 0, milestoneGold: 0, gems: 0, items: 0 },
    referralUncollected: player.referralUncollected ?? { gold: 0, gems: 0, items: 0 },
    ownedPropertyId: player.ownedPropertyId,
    propertyPurchasePrice: player.propertyPurchasePrice,
    unlockedTitles: player.unlockedTitles ?? [],
    profileTitleId: player.profileTitleId,
    achievementBonuses: player.achievementBonuses ?? { expPct: 0, goldPct: 0, lootPct: 0, allStatsPct: 0 },
    notificationSettings: player.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
    fairStats: player.fairStats ?? { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, goldWon: 0, goldLost: 0 },
    saveVersion: SAVE_VERSION,
  }
  if (usesMana(migrated)) {
    migrated.maxMana = getMaxMana(migrated)
    migrated.currentMana = migrated.currentMana ?? migrated.maxMana
    migrated.manaLastRegenAt = migrated.manaLastRegenAt ?? new Date().toISOString()
  }
  return migrated
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
    floorMiniBossKills: {},
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
    resources: { iron_ore: 5, herb: 3, hide: 2, meat: 3, upgrade_core: 1 },
    marketListings: [],
    expEasterEggClaimed: false,
    underwearEasterEggClaimed: false,
    bankBalance: 0,
    bankLastInterestAt: new Date().toISOString(),
    guildId: GUILD_ID,
    friendIds: [],
    fairStats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, goldWon: 0, goldLost: 0 },
  }
}
