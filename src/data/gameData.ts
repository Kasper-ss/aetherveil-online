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
import { SAVE_VERSION, wipePlayerToFresh } from '@/lib/playerMigration'
import { normalizeClassId } from '@/lib/classCompat'

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

function migrateResources(
  resources: Partial<Record<import('@/types/game').ResourceId, number>> | undefined,
): Partial<Record<import('@/types/game').ResourceId, number>> {
  const merged: Record<string, number> = {
    iron_ore: 5, herb: 3, hide: 2, meat: 3, upgrade_core: 1,
    ...resources,
  }
  delete merged.bone
  return merged as Partial<Record<import('@/types/game').ResourceId, number>>
}

export function migratePlayer(player: import('@/types/game').Player): import('@/types/game').Player {
  let base = player
  const prevVersion = base.saveVersion ?? 0
  if (prevVersion < 7) {
    base = wipePlayerToFresh(base)
  }
  const normalizedClassId = normalizeClassId(base.classId as string | undefined)
  const synced = syncPlayerSkills(
    normalizedClassId,
    base.level ?? 1,
    base.skills ?? [],
    base.skillLevels ?? {},
  )
  const migrated: import('@/types/game').Player = {
    ...base,
    classId: normalizedClassId,
    ...synced,
    raceSelected: base.raceSelected ?? !!base.raceId,
    classSelected: base.classSelected ?? !!normalizedClassId,
    stats: base.stats ?? { atk: 10, def: 5, hp: 100, crit: 5, speed: 10 },
    farmFloor: base.farmFloor ?? base.currentFloor ?? 1,
    floorMobKills: base.floorMobKills ?? {},
    floorMiniBossKills: base.floorMiniBossKills ?? {},
    equipped: sanitizeEquipped(base.equipped ?? {}),
    inventory: (base.inventory ?? []).filter((i) => {
      const valid = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet', 'consumable']
      return valid.includes(i.slot)
    }).map(sanitizeItem),
    statPoints: base.statPoints ?? 0,
    allocatedStats: { ...EMPTY_ALLOCATED, ...base.allocatedStats },
    professionLevels: base.professionLevels ?? {},
    professionMythicLevels: base.professionMythicLevels ?? {},
    energyLastRegenAt: base.energyLastRegenAt ?? new Date().toISOString(),
    hpLastRegenAt: base.hpLastRegenAt ?? new Date().toISOString(),
    currentHp: base.currentHp,
    maxEnergy: getMaxEnergy({ ...base, allocatedStats: { ...EMPTY_ALLOCATED, ...base.allocatedStats } }),
    resources: migrateResources(base.resources),
    marketListings: (base.marketListings ?? []).filter((l) => (l.resourceId as string | undefined) !== 'bone'),
    expEasterEggClaimed: base.expEasterEggClaimed ?? false,
    underwearEasterEggClaimed: base.underwearEasterEggClaimed ?? false,
    bankBalance: base.bankBalance ?? 0,
    bankLastInterestAt: base.bankLastInterestAt ?? new Date().toISOString(),
    bankPendingInterest: base.bankPendingInterest ?? 0,
    stockPortfolio: base.stockPortfolio ?? {},
    stockPendingDividends: base.stockPendingDividends ?? 0,
    stockLastDividendAt: base.stockLastDividendAt ?? new Date().toISOString(),
    stockLimitOrders: base.stockLimitOrders ?? [],
    buffFateGoldUntil: base.buffFateGoldUntil,
    buffFateExpUntil: base.buffFateExpUntil,
    fateCardLastUsedAt: base.fateCardLastUsedAt,
    guildId: base.guildId ?? GUILD_ID,
    buffInfiniteEnergyUntil: base.buffInfiniteEnergyUntil,
    buffDoubleExpUntil: base.buffDoubleExpUntil,
    buffTripleGoldUntil: base.buffTripleGoldUntil,
    buffDailyBonusUntil: base.buffDailyBonusUntil,
    auraEffectId: base.auraEffectId,
    cosmeticAvatarId: base.cosmeticAvatarId,
    profileFrameId: base.profileFrameId,
    unlockedCosmetics: base.unlockedCosmetics ?? [],
    friendIds: base.friendIds ?? [],
    activeEffects: base.activeEffects ?? [],
    activeProfessions: base.activeProfessions ?? (base.profession ? [base.profession] : []),
    professionSlotLimit: Math.max(base.professionSlotLimit ?? BASE_PROFESSION_SLOTS, BASE_PROFESSION_SLOTS),
    professionExp: base.professionExp ?? {},
    unlockedSetScrolls: migrateUnlockedSetScrolls(base.unlockedSetScrolls),
    ownedTools: base.ownedTools ?? [],
    mineLevel: base.mineLevel ?? 1,
    mineDigXp: base.mineDigXp ?? 0,
    fieldLevel: base.fieldLevel ?? 1,
    fieldGatherXp: base.fieldGatherXp ?? 0,
    huntLevel: base.huntLevel ?? 1,
    huntXp: base.huntXp ?? 0,
    gemSiteLevel: base.gemSiteLevel ?? 1,
    gemSiteXp: base.gemSiteXp ?? 0,
    aetherRiftLevel: base.aetherRiftLevel ?? 1,
    aetherRiftXp: base.aetherRiftXp ?? 0,
    fishingSpotLevel: base.fishingSpotLevel ?? 1,
    fishingSpotXp: base.fishingSpotXp ?? 0,
    fishCaughtTotal: base.fishCaughtTotal ?? 0,
    questState: base.questState ?? defaultQuestState(base),
    monthlyStats: base.monthlyStats ?? defaultMonthlyStats(base),
    monthlyRewardsClaimed: base.monthlyStats?.monthKey === monthKey()
      ? (base.monthlyRewardsClaimed ?? [])
      : [],
    achievementsClaimed: base.achievementsClaimed ?? [],
    bossTrophies: migrateBossTrophies(base),
    worldBossLastKillAt: base.worldBossLastKillAt,
    worldBossKills: base.worldBossKills ?? 0,
    lifetimeGoldEarned: base.lifetimeGoldEarned ?? 0,
    referralInvites: base.referralInvites ?? [],
    referralEarnings: base.referralEarnings ?? { signupGold: 0, milestoneGold: 0, gems: 0, items: 0 },
    referralUncollected: base.referralUncollected ?? { gold: 0, gems: 0, items: 0 },
    ownedPropertyId: base.ownedPropertyId,
    propertyPurchasePrice: base.propertyPurchasePrice,
    unlockedTitles: base.unlockedTitles ?? [],
    profileTitleId: base.profileTitleId,
    achievementBonuses: base.achievementBonuses ?? { expPct: 0, goldPct: 0, lootPct: 0, allStatsPct: 0 },
    notificationSettings: base.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
    vipLevel: base.vipLevel ?? 0,
    socketGems: base.socketGems ?? {},
    socketGemLevels: base.socketGemLevels ?? {},
    activeBrews: base.activeBrews ?? [],
    pendingSecretCave: base.pendingSecretCave ?? null,
    fairStats: base.fairStats ?? { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, goldWon: 0, goldLost: 0 },
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
    classSelected: false,
    raceSelected: false,
    professionLevels: {}, professionMythicLevels: {},
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
