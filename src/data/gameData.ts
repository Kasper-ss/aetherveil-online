import type { ShopItem, DailyReward, ResourceId, Item } from '@/types/game'
import { EMPTY_EQUIPPED, rollEquipmentDrop, ALL_ITEMS, refreshItemMeta, stampItemClassBinding, migrateItemStatsFromUpgradeMult } from '@/data/items'
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
import { jewelResourceId, rollJewelLoot } from '@/lib/jewelResources'
import type { SocketGemId } from '@/types/game'
import { defaultCityState } from '@/lib/cityState'
import { migrateStudiedGems } from '@/lib/gemStudy'

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
  .filter((i) => (i.rarity === 'common' || i.rarity === 'rare') && i.slot !== 'consumable' && !i.raidExclusive)
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
  rareLootMult = 1,
): Partial<Record<ResourceId, number>> {
  const oreMult = Math.min(2.5, Math.max(1, rareLootMult))
  const mult = isBoss ? 3 : isMiniBoss ? 2.5 : isEpic ? 2 : 1
  const meat = Math.max(1, Math.floor((2 + floor * 0.8) * mult + Math.random() * 2))
  const hide = Math.max(1, Math.floor((1 + floor * 0.5) * mult))

  const res: Partial<Record<ResourceId, number>> = { meat, hide }

  const dustChance = (isBoss ? 0.5 : isMiniBoss ? 0.32 : isEpic ? 0.18 : 0.05) * oreMult
  if (Math.random() < Math.min(0.95, dustChance)) {
    res.aether_dust = isBoss ? 2 + Math.floor(Math.random() * 2) : isMiniBoss ? 1 + Math.floor(Math.random() * 2) : 1
  }

  if (isBoss) {
    res.upgrade_core = 1 + Math.floor(floor / 3)
    if (Math.random() > 0.5 / oreMult) res.star_shard = 1
    Object.assign(res, rollJewelLoot(Math.min(1, 0.5 * oreMult), 1 + Math.floor(Math.random() * 2), true))
    if (Math.random() < 0.35 * (oreMult - 1)) {
      res.iron_ore = (res.iron_ore ?? 0) + 1 + Math.floor(Math.random() * 2)
    }
    if (Math.random() < 0.2 * (oreMult - 1)) {
      res.gold_ore = (res.gold_ore ?? 0) + 1
    }
  } else if (isMiniBoss) {
    if (Math.random() < Math.min(0.9, 0.45 * oreMult)) res.gem_shard = 1 + Math.floor(Math.random() * 2)
    if (Math.random() < Math.min(0.8, 0.22 * oreMult)) res.star_shard = 1
    if (Math.random() < Math.min(0.7, 0.18 * oreMult)) res.upgrade_core = 1
    Object.assign(res, rollJewelLoot(Math.min(1, 0.38 * oreMult), 1, true))
    if (Math.random() < 0.25 * (oreMult - 1)) res.iron_ore = (res.iron_ore ?? 0) + 1
  } else if (isEpic) {
    Object.assign(res, rollJewelLoot(Math.min(1, 0.1 * oreMult), 1, false))
    if (Math.random() < 0.15 * (oreMult - 1)) res.iron_ore = (res.iron_ore ?? 0) + 1
  } else {
    const baseOreChance = 0.01 + floor * 0.0006
    if (Math.random() < Math.min(0.25, baseOreChance * oreMult)) {
      Object.assign(res, rollJewelLoot(1, 1, floor >= 15))
    }
    if (Math.random() < 0.08 * (oreMult - 1)) res.iron_ore = (res.iron_ore ?? 0) + 1
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

function sanitizeItem(
  i: import('@/types/game').Item,
  applyClassBinding = false,
  bakeUpgradeStats = false,
): import('@/types/game').Item {
  let baseItem = i
  if (bakeUpgradeStats) {
    baseItem = migrateItemStatsFromUpgradeMult(i)
  }
  let base: import('@/types/game').Item = {
    ...baseItem,
    stats: baseItem.stats ?? {},
    rarity: (baseItem.rarity as string) === 'uncommon' ? 'rare' : baseItem.rarity,
    upgradeLevel: baseItem.upgradeLevel ?? 1,
    starLevel: baseItem.starLevel ?? 0,
  }
  if (applyClassBinding) base = stampItemClassBinding(base)
  return refreshItemMeta(ensureItemDurability(base))
}

function sanitizeEquipped(
  equipped: Partial<import('@/types/game').EquippedItems>,
  applyClassBinding = false,
  bakeUpgradeStats = false,
): import('@/types/game').EquippedItems {
  const result = { ...EMPTY_EQUIPPED }
  for (const slot of Object.keys(EMPTY_EQUIPPED) as (keyof import('@/types/game').EquippedItems)[]) {
    const item = equipped[slot]
    result[slot] = item ? sanitizeItem(item, applyClassBinding, bakeUpgradeStats) : null
  }
  return result
}

function migrateBossTrophies(player: import('@/types/game').Player): string[] {
  const earned = new Set(player.bossTrophies ?? [])
  if ((player.worldBossKills ?? 0) > 0 || player.worldBossLastKillAt) {
    earned.add('trophy_world_boss')
  }
  return [...earned]
}

function hasSocketGemsToMigrate(socketGems?: Partial<Record<SocketGemId, number>>): boolean {
  if (!socketGems) return false
  return Object.values(socketGems).some((count) => (count ?? 0) > 0)
}

function migrateResources(
  resources: Partial<Record<import('@/types/game').ResourceId, number>> | undefined,
  socketGems?: Partial<Record<SocketGemId, number>>,
  migrateLegacySocketGems = false,
): Partial<Record<import('@/types/game').ResourceId, number>> {
  const merged: Record<string, number> = {
    iron_ore: 5, herb: 3, hide: 2, meat: 3, upgrade_core: 1,
    ...resources,
  }
  delete merged.bone
  if (migrateLegacySocketGems) {
    for (const [gemId, count] of Object.entries(socketGems ?? {})) {
      if (!count || count <= 0) continue
      const rid = jewelResourceId(gemId as SocketGemId)
      merged[rid] = (merged[rid] ?? 0) + count
    }
  }
  return merged as Partial<Record<import('@/types/game').ResourceId, number>>
}

export function migratePlayer(player: import('@/types/game').Player): import('@/types/game').Player {
  let base = player
  const prevVersion = base.saveVersion ?? 0
  if (prevVersion < 7) {
    const hasProgress =
      (base.level ?? 1) > 1
      || (base.highestFloor ?? 1) > 1
      || (base.gold ?? 0) > 200
      || (base.inventory?.length ?? 0) > 0
    if (!hasProgress) {
      base = wipePlayerToFresh(base)
    }
  }
  const migrateLegacySocketGems = prevVersion < 16 && hasSocketGemsToMigrate(base.socketGems)
  const bakeUpgradeStats = prevVersion < 17
  const applyClassBinding = prevVersion < 13
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
    equipped: sanitizeEquipped(base.equipped ?? {}, applyClassBinding, bakeUpgradeStats),
    inventory: (base.inventory ?? []).filter((i) => {
      const valid = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet', 'consumable']
      return valid.includes(i.slot)
    }).map((i) => sanitizeItem(i, applyClassBinding, bakeUpgradeStats)),
    statPoints: base.statPoints ?? 0,
    allocatedStats: { ...EMPTY_ALLOCATED, ...base.allocatedStats },
    professionLevels: base.professionLevels ?? {},
    professionMythicLevels: base.professionMythicLevels ?? {},
    energyLastRegenAt: base.energyLastRegenAt ?? new Date().toISOString(),
    hpLastRegenAt: base.hpLastRegenAt ?? new Date().toISOString(),
    currentHp: base.currentHp,
    maxEnergy: getMaxEnergy({ ...base, allocatedStats: { ...EMPTY_ALLOCATED, ...base.allocatedStats } }),
    resources: migrateResources(base.resources, base.socketGems, migrateLegacySocketGems),
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
    guildId: base.guildId === GUILD_ID && !base.guildJoinedAt ? undefined : base.guildId,
    guildJoinedAt: base.guildJoinedAt,
    welcomeShown: base.welcomeShown ?? false,
    redeemedPromoCodes: base.redeemedPromoCodes ?? [],
    buffPromoGoldUntil: base.buffPromoGoldUntil,
    buffPromoGoldMult: base.buffPromoGoldMult,
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
    worldBossLastSpawnIndex: base.worldBossLastSpawnIndex,
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
    socketGems: migrateLegacySocketGems ? {} : (base.socketGems ?? {}),
    socketGemLevels: base.socketGemLevels ?? {},
    activeBrews: base.activeBrews ?? [],
    pendingSecretCave: base.pendingSecretCave ?? null,
    pendingPortal: base.pendingPortal ?? null,
    portalRun: base.portalRun
      ? {
          ...base.portalRun,
          accumulatedLoot: (base.portalRun.accumulatedLoot ?? []).map((i) => sanitizeItem(i, applyClassBinding, bakeUpgradeStats)),
        }
      : null,
    secondaryClassId: base.secondaryClassId,
    activeRaidId: base.activeRaidId ?? null,
    raidProgress: Object.fromEntries(
      Object.entries(base.raidProgress ?? {}).map(([raidId, progress]) => [
        raidId,
        {
          ...progress,
          accumulatedLoot: (progress.accumulatedLoot ?? []).map((i) => sanitizeItem(i, applyClassBinding, bakeUpgradeStats)),
        },
      ]),
    ),
    raidDeathCooldowns: base.raidDeathCooldowns ?? {},
    completedRaids: base.completedRaids ?? [],
    cityState: base.cityState ?? defaultCityState(),
    studiedGems: migrateStudiedGems(base),
    activeGemStudies: base.activeGemStudies ?? [],
    productionState: base.productionState ?? {
      generators: {},
      machines: {},
      energyStored: 0,
      lastTickAt: new Date().toISOString(),
      jobs: [],
    },
    nurseryState: base.nurseryState ?? { stage: 1, feedProgress: 0 },
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
    friendIds: [],
    fairStats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, goldWon: 0, goldLost: 0 },
  }
}
