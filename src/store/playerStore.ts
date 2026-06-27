import { create } from 'zustand'
import type { Player, IdleReward, CombatResult, Item, PlayerClass, ProfessionId, ResourceId, MarketListing, AllocStatKey, QuestEvent } from '@/types/game'
import { createDefaultPlayer, migratePlayer, getFloorData, DAILY_REWARDS, MAX_FLOOR } from '@/data/gameData'
import { pickNewerPlayer } from '@/lib/playerMigration'
import { getSkillUpgradeCost, syncPlayerSkills, SKILL_MAX_LEVEL } from '@/data/playerSkills'
import { getTelegramUser, getInitData } from '@/lib/telegram'
import { requestStarsPayment } from '@/lib/starsPayment'
import { loadPlayerFromSupabase, savePlayerToSupabase } from '@/lib/supabase'
import { storageGet, storageSet, xpForLevel } from '@/lib/utils'
import {
  getClassData, PROFESSIONS, getUpgradeLevelCost, getStarUpgradeCost, getDismantleYield,
  findCraftRecipe,
  MYTHIC_SKILLS, MYTHIC_UPGRADE_COST, isProfessionMaxed,
  getProfessionSkillUpgradeCost, getProfessionMythicSkillUpgradeCost,
} from '@/data/classes'
import { createItemInstance, EMPTY_EQUIPPED, ALL_ITEMS } from '@/data/items'
import { ensureItemDurability, getRepairCost, repairItemFull, wearItem } from '@/lib/equipmentDurability'
import { getMaxMana, getManaRegenIntervalMs, getPlayerCurrentMana, usesMana } from '@/lib/mana'
import {
  applyRarityUpgrade, canUpgradeRarity, countDuplicateItems,
  getRarityUpgradeCost, RARITY_DUPLICATES_REQUIRED,
} from '@/lib/rarityUpgrade'
import { getEffectiveStats, getMaxEnergy, getEnergyRegenIntervalMs, getCombatMaxHp, getHpRegenIntervalMs, getPlayerCurrentHp, BASE_MAX_ENERGY, EMPTY_ALLOCATED } from '@/lib/playerStats'
import { getMissingCosts, type MissingCost } from '@/lib/craftCosts'
import { registerOnlinePlayer } from '@/lib/multiplayer'
import { syncPlayerToServer, buyServerMarketListing } from '@/lib/multiplayerSync'
import { extendBuff, getDailyBonusExtra, getExpMultiplier, getGoldMultiplier, hasInfiniteEnergy } from '@/lib/playerBuffs'
import { calcFairPayout, spinFairWheel, type FairColor } from '@/lib/fairGame'
import {
  canDrawFateCard, FATE_CARD_BUFF_DURATION_MS,
} from '@/lib/fateCards'
import { calcBankInterest } from '@/lib/bank'
import {
  applyBlacksmithCraftBonuses, applyBlacksmithCraftCost,
  getBlacksmithDoubleCraftChance,
} from '@/lib/blacksmithBonuses'
import { type StarProductId } from '@/data/starShop'
import { CONSUMABLE_EFFECTS, findConsumableInstance, type ConsumableId } from '@/lib/consumables'
import { AVATAR_OPTIONS, FRAME_OPTIONS, getCosmeticStarProductId } from '@/data/cosmetics'
import { addActiveEffect, pruneActiveEffects, EFFECT_PRESETS } from '@/lib/activeEffects'
import {
  getActiveProfessions, getProfessionExp, getProfessionRank, getProfessionSlotLimit,
  isProfessionActive, professionRankRequiredForSkill, BASE_PROFESSION_SLOTS, MAX_PROFESSION_SLOTS,
} from '@/lib/professionProgress'
import { bumpQuestEvent, normalizeQuestState, isQuestClaimed, getQuestProgress } from '@/lib/quests'
import { DAILY_QUESTS, WEEKLY_QUESTS, GUILD_QUESTS } from '@/data/quests'
import {
  addGuildQuestProgress, getGuildQuestProgress, inviteToGuildById,
  acceptGuildInvite as acceptGuildInviteMp, declineGuildInvite, getGuildInvitesFor, isInGuildRoster,
} from '@/lib/multiplayer'
import { PROFESSION_ACTIVITIES } from '@/data/professionActivities'
import { playerHasTool, getMineDoubleBonus, getFishingJunkReduction, getHerbGatherBonus } from '@/data/tools'
import {
  getMineLevelData, getUnlockedMineLevel, rollMineRewards,
} from '@/data/mineLevels'
import {
  getHerbFieldLevelData, getUnlockedHerbFieldLevel, rollHerbGather,
} from '@/data/herbField'
import {
  getHuntLevelData, getUnlockedHuntLevel, rollHuntRewards,
} from '@/data/huntLevels'
import {
  getGemSiteLevelData, getUnlockedGemSiteLevel, rollGemSiteRewards,
} from '@/data/gemSiteLevels'
import {
  getAetherRiftLevelData, getUnlockedAetherRiftLevel, rollAetherRiftRewards,
} from '@/data/aetherRiftLevels'
import {
  getFishingSpotData, getUnlockedFishingSpot, rollSpotFishCatch,
} from '@/data/fishingSpots'
import { findAlchemyRecipe, canBrewAlchemyRecipe } from '@/data/alchemyPotions'
import { findKitchenRecipe, getKitchenRecipesForPlayer, FOOD_BUFF_MAP } from '@/data/kitchenRecipes'
import { getNpcSellGold } from '@/data/resourceShop'
import { bumpMonthlyStat, MONTHLY_RANK_REWARDS } from '@/lib/monthlyStats'
import { ACHIEVEMENT_BY_ID, canClaimAchievement } from '@/data/achievements'
import { EMPTY_ACHIEVEMENT_BONUSES } from '@/lib/achievementBonuses'
import { maybeNotifyVitalFull, getNotificationSettings, maybeNotifyPetReward } from '@/lib/vitalNotifications'
import {
  buildPetReward, getPetRewardCycles, PET_REWARD_INTERVAL_MS, type PetReward,
} from '@/lib/petRewards'
import { useUIStore } from '@/store/uiStore'
import type { NotificationSettings } from '@/types/game'

interface PlayerState {
  player: Player | null
  isLoading: boolean
  isAuthenticated: boolean
  idleReward: IdleReward | null
  petReward: PetReward | null

  loadPlayer: () => Promise<void>
  savePlayer: () => Promise<void>
  updatePlayer: (partial: Partial<Player>) => void
  addExp: (amount: number) => void
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  spendGems: (amount: number) => boolean
  spendEnergy: (amount: number) => boolean
  spendMana: (amount: number) => boolean
  addItem: (item: Item) => void
  removeItemByInstance: (instanceId: string) => void
  equipItem: (item: Item) => void
  unequipItem: (slot: keyof Player['equipped']) => void
  setFarmFloor: (floor: number) => void
  recordMobKill: (floor: number) => void
  advanceFloor: () => void
  applyCombatResult: (result: CombatResult) => void
  applyDeathPenalty: (killerName?: string) => void
  claimIdleRewards: () => void
  checkPetRewards: (opts?: { showModal?: boolean }) => void
  claimPetReward: () => void
  claimDailyReward: () => { success: boolean; reward?: typeof DAILY_REWARDS[0] }
  getDailyRewardPreview: () => typeof DAILY_REWARDS[0]
  canClaimDaily: () => boolean
  completeTutorial: () => void
  regenerateEnergy: () => void
  selectClass: (classId: PlayerClass) => void
  addResources: (resources: Partial<Record<ResourceId, number>>) => void
  spendResources: (resources: Partial<Record<ResourceId, number>>) => boolean
  upgradeProfessionSkill: (professionId: ProfessionId, skillIndex: number) => boolean
  setProfession: (professionId: ProfessionId) => void
  toggleActiveProfession: (professionId: ProfessionId) => boolean
  performProfessionGrind: (activityId: string) => boolean
  performMineDig: (targetLevel?: number) => { ok: boolean; isVein?: boolean; isDouble?: boolean }
  performFishing: (targetSpot?: number) => { ok: boolean; fishName?: string; junk?: boolean; isTrophy?: boolean }
  performHerbGather: (targetLevel?: number) => { ok: boolean; isBonus?: boolean }
  performHunt: (targetLevel?: number) => { ok: boolean; isDouble?: boolean; isSpecial?: boolean }
  performGemDig: (targetLevel?: number) => { ok: boolean; isDouble?: boolean; isSpecial?: boolean }
  performAetherGather: (targetLevel?: number) => { ok: boolean; isDouble?: boolean; isSpecial?: boolean }
  brewPotion: (recipeId: string) => boolean
  cookFood: (recipeId: string) => boolean
  eatFood: (itemId: string) => boolean
  craftItem: (recipeId: string) => boolean
  upgradeItemLevel: (item: Item) => Item | null
  upgradeItemStars: (item: Item) => Item | null
  listOnMarket: (item: Item, price: number) => boolean
  listResourceOnMarket: (resourceId: ResourceId, amount: number, price: number) => boolean
  removeMarketListing: (listingId: string) => void
  buyMarketListing: (listing: MarketListing) => Promise<boolean>
  dismantleItem: (item: Item) => boolean
  syncPlayerState: () => Promise<void>
  changeDisplayName: (name: string) => boolean
  claimExpEasterEgg: () => boolean
  claimUnderwearEasterEgg: () => boolean
  claimAchievement: (achievementId: string) => boolean
  setProfileTitle: (titleId: string | null) => boolean
  dismantleAllCommonItems: () => number
  accrueBankInterest: () => void
  collectBankInterest: () => boolean
  depositToBank: (amount: number) => boolean
  withdrawFromBank: (amount: number) => boolean
  allocateStat: (key: AllocStatKey, points?: number) => boolean
  grantBonusStats: (points: number, gold: number, gems: number) => void
  getCraftMissing: (recipeId: string) => MissingCost[]
  getUpgradeLevelMissing: (item: Item) => MissingCost[]
  getStarUpgradeMissing: (item: Item) => MissingCost[]
  getMythicUpgradeMissing: (item: Item) => MissingCost[]
  getProfessionSkillMissing: (professionId: ProfessionId, skillIndex: number) => MissingCost[]
  getProfessionMythicSkillMissing: (professionId: ProfessionId, skillIndex: number) => MissingCost[]
  craftMythicItem: (item: Item) => Item | null
  upgradeProfessionMythicSkill: (professionId: ProfessionId, skillIndex: number) => boolean
  tryRegenEnergy: () => void
  tryRegenHp: () => void
  tryRegenVitals: () => void
  tryRegenMana: () => void
  purchaseStarProduct: (productId: StarProductId) => Promise<boolean>
  applyStarProductReward: (productId: StarProductId) => boolean
  upgradePlayerSkill: (skillId: import('@/types/game').SkillId) => boolean
  getPlayerSkillMissing: (skillId: import('@/types/game').SkillId) => MissingCost[]
  addFriendById: (friendId: number) => boolean
  removeFriend: (friendId: number) => boolean
  playFairBet: (bet: number, pick: FairColor) => { won: boolean; result: FairColor; payout: number } | null
  drawFateCard: (type: import('@/lib/fateCards').FateCardType) => boolean
  resetAllocatedStats: () => boolean
  consumeConsumable: (itemId: ConsumableId) => { healHp?: number; energy?: number } | null
  replaceItemInstance: (oldInstanceId: string, newItem: Item) => void
  applyCosmetic: (type: 'avatar' | 'frame', id: string) => boolean
  purchaseCosmetic: (id: string) => Promise<boolean>
  unlockCosmetic: (id: string) => boolean
  grantEffectPreset: (preset: keyof typeof EFFECT_PRESETS, durationMs: number) => void
  repairItem: (item: Item) => boolean
  repairAllItems: () => boolean
  upgradeItemRarity: (item: Item) => Item | null
  applyCombatDurabilityWear: (victory: boolean, isBoss: boolean) => void
  getRarityUpgradeMissing: (item: Item) => MissingCost[]
  getRepairAllCost: () => number
  trackQuestEvent: (event: QuestEvent, amount?: number) => void
  claimQuestReward: (questId: string, scope: 'daily' | 'weekly' | 'guild') => boolean
  invitePlayerToGuild: (targetId: number) => boolean
  acceptGuildInvite: (guildId: string) => boolean
  declineGuildInvite: (guildId: string) => void
  getPendingGuildInvites: () => import('@/lib/multiplayer').GuildInvite[]
  sendGuildGift: (toId: number, item: Item) => Promise<boolean>
  sellResourceToNpc: (resourceId: ResourceId, amount: number) => boolean
  sellItemToNpc: (item: Item) => boolean
  claimMonthlyReward: (categoryId: string, rank: 1 | 2 | 3) => boolean
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
}

const SAVE_KEY = 'player'

function applyQuestTracking(
  get: () => PlayerState,
  event: QuestEvent,
  amount = 1,
) {
  const { player } = get()
  if (!player) return
  const state = bumpQuestEvent(normalizeQuestState(player), event, amount, player.highestFloor)
  addGuildQuestProgress(event, amount)
  get().updatePlayer({ questState: state })
}

function syncEnergyFields(player: Player): Partial<Player> {
  return { maxEnergy: getMaxEnergy(player) }
}

function getEquipSlotForItem(item: Item, _classId?: PlayerClass): keyof Player['equipped'] | null {
  if (item.slot === 'consumable') return null
  if (item.slot === 'pet') return 'pet'
  if (item.slot === 'weapon') return 'weapon'
  return item.slot as keyof Player['equipped']
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  isLoading: true,
  isAuthenticated: false,
  idleReward: null,
  petReward: null,

  loadPlayer: async () => {
    set({ isLoading: true })
    const user = getTelegramUser()
    try {
      const remote = await loadPlayerFromSupabase(user.id)
      const local = storageGet<Player | null>(SAVE_KEY, null)
      let player = pickNewerPlayer(remote, local)
      if (!player) {
        player = createDefaultPlayer(user.id, user.first_name, user.username ?? `user_${user.id}`)
      }
      player = migratePlayer(player)
      const idle = calculateIdle(player)
      set({ player, isLoading: false, isAuthenticated: true, idleReward: idle, petReward: null })
      get().tryRegenVitals()
      get().checkPetRewards({ showModal: !idle })
      void get().syncPlayerState()
      registerOnlinePlayer(get().player ?? player)
    } catch (error) {
      console.error('[Aetherveil] loadPlayer failed, using local fallback', error)
      const local = storageGet<Player | null>(SAVE_KEY, null)
      let player = local
      if (!player) {
        player = createDefaultPlayer(user.id, user.first_name, user.username ?? `user_${user.id}`)
      }
      player = migratePlayer(player)
      storageSet(SAVE_KEY, player)
      const idle = calculateIdle(player)
      set({ player, isLoading: false, isAuthenticated: true, idleReward: idle, petReward: null })
      get().tryRegenVitals()
      registerOnlinePlayer(player)
    }
  },

  savePlayer: async () => {
    const { player } = get()
    if (!player) return
    player.lastOnlineAt = new Date().toISOString()
    storageSet(SAVE_KEY, player)
    await savePlayerToSupabase(player)
  },

  updatePlayer: (partial) => {
    const { player } = get()
    if (!player) return
    const merged = { ...player, ...partial }
    merged.activeEffects = pruneActiveEffects(merged.activeEffects)
    const maxHp = getCombatMaxHp(merged)
    if (merged.currentHp != null) {
      merged.currentHp = Math.min(maxHp, Math.max(0, merged.currentHp))
    }
    set({ player: merged })
    registerOnlinePlayer(merged)
    get().savePlayer()
  },

  addExp: (amount) => {
    const { player } = get()
    if (!player) return
    const boosted = Math.floor(amount * getExpMultiplier(player))
    let exp = player.exp + boosted
    let level = player.level
    const startLevel = level
    while (exp >= xpForLevel(level)) { exp -= xpForLevel(level); level++ }
    const levelsGained = level - startLevel
    const statPoints = player.statPoints + levelsGained * 5
    const synced = syncPlayerSkills(player.classId, level, player.skills, player.skillLevels)
    const updates: Partial<Player> = { exp, level, statPoints, ...synced, ...syncEnergyFields(player) }
    if (usesMana(player)) updates.maxMana = getMaxMana({ ...player, level })
    get().updatePlayer(updates)
  },

  addGold: (amount) => {
    const { player } = get()
    if (!player) return
    const boosted = Math.floor(amount * getGoldMultiplier(player))
    if (boosted <= 0) return
    get().updatePlayer({
      gold: player.gold + boosted,
      monthlyStats: bumpMonthlyStat(player, 'goldEarned', boosted),
    })
  },

  spendGold: (amount) => {
    const { player } = get()
    if (!player || player.gold < amount) return false
    get().updatePlayer({ gold: player.gold - amount })
    return true
  },

  spendGems: (amount) => {
    const { player } = get()
    if (!player || player.gems < amount) return false
    get().updatePlayer({ gems: player.gems - amount })
    return true
  },

  spendEnergy: (amount) => {
    const { player } = get()
    if (!player) return false
    if (hasInfiniteEnergy(player)) return true
    if (player.energy < amount) return false
    const wasFull = player.energy >= getMaxEnergy(player)
    const partial: Partial<Player> = { energy: player.energy - amount }
    if (wasFull) partial.energyLastRegenAt = new Date().toISOString()
    get().updatePlayer(partial)
    return true
  },

  spendMana: (amount) => {
    const { player } = get()
    if (!player || !usesMana(player)) return false
    const current = getPlayerCurrentMana(player)
    if (current < amount) return false
    const max = getMaxMana(player)
    const wasFull = current >= max
    const partial: Partial<Player> = { currentMana: current - amount, maxMana: max }
    if (wasFull) partial.manaLastRegenAt = new Date().toISOString()
    get().updatePlayer(partial)
    return true
  },

  addItem: (item) => {
    const { player } = get()
    if (!player) return
    const base = item.instanceId ? item : { ...item, instanceId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
    const inst = ensureItemDurability(base)
    get().updatePlayer({ inventory: [...player.inventory, inst] })
  },

  removeItemByInstance: (instanceId) => {
    const { player } = get()
    if (!player) return
    get().updatePlayer({ inventory: player.inventory.filter((i) => i.instanceId !== instanceId) })
  },

  equipItem: (item) => {
    const { player } = get()
    if (!player || item.slot === 'consumable') return
    const slot = getEquipSlotForItem(item, player.classId)
    if (!slot) return
    const equipped = { ...player.equipped }
    if (equipped[slot]) get().addItem(equipped[slot]!)
    equipped[slot] = item
    get().removeItemByInstance(item.instanceId!)
    const patch: Partial<Player> = { equipped }
    if (slot === 'pet' && !player.petLastRewardAt) {
      patch.petLastRewardAt = new Date().toISOString()
    }
    get().updatePlayer(patch)
  },

  unequipItem: (slot) => {
    const { player } = get()
    if (!player || !player.equipped[slot]) return
    get().addItem(player.equipped[slot]!)
    get().updatePlayer({ equipped: { ...player.equipped, [slot]: null } })
  },

  setFarmFloor: (floor) => {
    const { player } = get()
    if (!player || floor < 1 || floor > player.highestFloor) return
    get().updatePlayer({ farmFloor: floor })
  },

  recordMobKill: (floor) => {
    const { player } = get()
    if (!player) return
    const kills = { ...player.floorMobKills }
    kills[floor] = (kills[floor] ?? 0) + 1
    get().updatePlayer({ floorMobKills: kills, monthlyStats: bumpMonthlyStat(player, 'mobsKilled', 1) })
    applyQuestTracking(get, 'kill_mob', 1)
  },

  advanceFloor: () => {
    const { player } = get()
    if (!player) return
    const prevHighest = player.highestFloor
    const next = Math.min(MAX_FLOOR, player.currentFloor + 1)
    get().updatePlayer({
      currentFloor: next,
      highestFloor: Math.max(player.highestFloor, next),
      farmFloor: next,
      monthlyStats: bumpMonthlyStat(player, 'highestFloor', next),
    })
    if (next > prevHighest) applyQuestTracking(get, 'advance_floor', 1)
  },

  applyCombatResult: (result) => {
    if (!result.victory) return
    get().addExp(result.exp)
    get().addGold(result.gold)
    result.loot.forEach((item) => get().addItem(item))
    if (result.resources) get().addResources(result.resources)
    applyQuestTracking(get, 'win_combat', 1)
  },

  applyDeathPenalty: (killerName?: string) => {
    const { player } = get()
    if (!player) return
    const goldLoss = Math.floor(player.gold * 0.03)
    const maxHp = getCombatMaxHp(player)
    get().updatePlayer({
      gold: Math.max(0, player.gold - goldLoss),
      currentHp: maxHp,
      hpLastRegenAt: new Date().toISOString(),
      deathDebuffUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
      lastKilledBy: killerName ?? player.lastKilledBy,
    })
  },

  claimIdleRewards: () => {
    const idle = get().idleReward
    if (!idle) return
    get().addGold(idle.gold)
    get().addExp(idle.exp)
    set({ idleReward: null })
    get().checkPetRewards({ showModal: true })
  },

  checkPetRewards: (opts) => {
    const { player, petReward } = get()
    if (!player?.equipped.pet || petReward) return
    const cycles = getPetRewardCycles(player)
    if (cycles < 1) return
    const reward = buildPetReward(player.equipped.pet, cycles)
    set({ petReward: reward })
    if (getNotificationSettings(player).petReward !== false) {
      maybeNotifyPetReward(reward)
    }
    if (opts?.showModal) {
      useUIStore.getState().setShowPetReward(true)
    }
  },

  claimPetReward: () => {
    const { player, petReward } = get()
    if (!player || !petReward) return
    get().addGold(petReward.gold)
    if (Object.keys(petReward.resources).length) {
      get().addResources(petReward.resources)
    }
    for (const entry of petReward.items) {
      for (let i = 0; i < entry.count; i++) {
        const inst = createItemInstance(entry.itemId)
        if (inst) get().addItem(inst)
      }
    }
    const last = new Date(player.petLastRewardAt ?? player.lastOnlineAt).getTime()
    get().updatePlayer({
      petLastRewardAt: new Date(last + petReward.cycles * PET_REWARD_INTERVAL_MS).toISOString(),
    })
    set({ petReward: null })
    get().checkPetRewards({ showModal: true })
  },

  canClaimDaily: () => {
    const { player } = get()
    if (!player) return false
    const lastClaim = player.dailyRewardClaimedAt ? new Date(player.dailyRewardClaimedAt) : null
    return !lastClaim || lastClaim.toDateString() !== new Date().toDateString()
  },

  getDailyRewardPreview: () => {
    const { player } = get()
    if (!player) return DAILY_REWARDS[0]
    const streak = player.dailyRewardStreak || 0
    const dayIndex = streak % 7
    return DAILY_REWARDS[dayIndex]
  },

  claimDailyReward: () => {
    const { player } = get()
    if (!player || !get().canClaimDaily()) return { success: false }
    const now = new Date()
    const lastClaim = player.dailyRewardClaimedAt ? new Date(player.dailyRewardClaimedAt) : null
    const streak = lastClaim && (now.getTime() - lastClaim.getTime()) < 48 * 3600_000
      ? player.dailyRewardStreak + 1 : 1
    const reward = DAILY_REWARDS[(streak - 1) % 7]
    const dailyBonus = getDailyBonusExtra(player)
    get().addGold(reward.gold + dailyBonus.gold)
    const gemsGain = (reward.gems ?? 0) + dailyBonus.gems
    if (gemsGain) get().updatePlayer({ gems: (get().player?.gems ?? 0) + gemsGain })
    if (reward.itemId) {
      const inst = createItemInstance(reward.itemId)
      if (inst) get().addItem(inst)
    }
    get().updatePlayer({ dailyRewardClaimedAt: now.toISOString(), dailyRewardStreak: streak })
    return { success: true, reward }
  },

  completeTutorial: () => get().updatePlayer({ tutorialCompleted: true }),

  regenerateEnergy: () => get().tryRegenEnergy(),

  tryRegenEnergy: () => {
    const { player } = get()
    if (!player) return
    const max = getMaxEnergy(player)
    if (player.energy >= max) return
    const interval = getEnergyRegenIntervalMs(player)
    const last = new Date(player.energyLastRegenAt ?? Date.now()).getTime()
    const elapsed = Date.now() - last
    const ticks = Math.floor(elapsed / interval)
    if (ticks <= 0) return
    const newEnergy = Math.min(max, player.energy + ticks)
    const remainder = elapsed % interval
    maybeNotifyVitalFull(player, 'energy', player.energy, newEnergy)
    get().updatePlayer({
      energy: newEnergy,
      maxEnergy: max,
      energyLastRegenAt: new Date(Date.now() - remainder).toISOString(),
    })
  },

  tryRegenHp: () => {
    const { player } = get()
    if (!player) return
    const max = getCombatMaxHp(player)
    const current = getPlayerCurrentHp(player)
    if (current >= max) return
    const interval = getHpRegenIntervalMs(player)
    const last = new Date(player.hpLastRegenAt ?? Date.now()).getTime()
    const elapsed = Date.now() - last
    const ticks = Math.floor(elapsed / interval)
    if (ticks <= 0) return
    const newHp = Math.min(max, current + ticks)
    const remainder = elapsed % interval
    maybeNotifyVitalFull(player, 'hp', current, newHp)
    get().updatePlayer({
      currentHp: newHp,
      hpLastRegenAt: new Date(Date.now() - remainder).toISOString(),
    })
  },

  tryRegenVitals: () => {
    get().tryRegenEnergy()
    get().tryRegenHp()
    get().tryRegenMana()
    get().accrueBankInterest()
    get().checkPetRewards({ showModal: true })
  },

  tryRegenMana: () => {
    const { player } = get()
    if (!player || !usesMana(player)) return
    const max = getMaxMana(player)
    const current = getPlayerCurrentMana(player)
    if (current >= max) return
    const interval = getManaRegenIntervalMs(player)
    const last = new Date(player.manaLastRegenAt ?? Date.now()).getTime()
    const elapsed = Date.now() - last
    const ticks = Math.floor(elapsed / interval)
    if (ticks < 1) return
    const newMana = Math.min(max, current + ticks)
    const remainder = elapsed % interval
    maybeNotifyVitalFull(player, 'mana', current, newMana)
    get().updatePlayer({
      currentMana: newMana,
      maxMana: max,
      manaLastRegenAt: new Date(Date.now() - remainder).toISOString(),
    })
  },

  allocateStat: (key, points = 1) => {
    const { player } = get()
    if (!player || player.statPoints < points || points < 1) return false
    const allocated = { ...player.allocatedStats, [key]: (player.allocatedStats[key] ?? 0) + points }
    const updated: Partial<Player> = {
      statPoints: player.statPoints - points,
      allocatedStats: allocated,
      ...syncEnergyFields({ ...player, allocatedStats: allocated }),
    }
    if (key === 'endurance') {
      const newMax = getMaxEnergy({ ...player, allocatedStats: allocated })
      if (player.energy > newMax) updated.energy = newMax
    }
    get().updatePlayer(updated)
    return true
  },

  grantBonusStats: (points, gold, gems) => {
    const { player } = get()
    if (!player) return
    get().updatePlayer({
      statPoints: player.statPoints + points,
      gold: player.gold + gold,
      gems: player.gems + gems,
    })
  },

  claimExpEasterEgg: () => {
    const { player } = get()
    if (!player || player.expEasterEggClaimed) return false
    get().updatePlayer({
      expEasterEggClaimed: true,
      statPoints: player.statPoints + 5,
      gold: player.gold + 1000,
      gems: player.gems + 10,
    })
    return true
  },

  claimUnderwearEasterEgg: () => {
    const { player } = get()
    if (!player || player.underwearEasterEggClaimed) return false
    const item = createItemInstance('legendary_underwear')
    if (!item) return false
    get().updatePlayer({ underwearEasterEggClaimed: true })
    get().addItem(item)
    return true
  },

  claimAchievement: (achievementId) => {
    const { player } = get()
    if (!player || !canClaimAchievement(player, achievementId)) return false
    const def = ACHIEVEMENT_BY_ID[achievementId]
    if (!def) return false

    const reward = def.reward
    const bonuses = { ...EMPTY_ACHIEVEMENT_BONUSES, ...player.achievementBonuses }
    if (reward.buff) {
      bonuses.expPct += reward.buff.expPct ?? 0
      bonuses.goldPct += reward.buff.goldPct ?? 0
      bonuses.lootPct += reward.buff.lootPct ?? 0
      bonuses.allStatsPct += reward.buff.allStatsPct ?? 0
    }

    const unlockedTitles = [...(player.unlockedTitles ?? [])]
    if (reward.titleId && !unlockedTitles.includes(reward.titleId)) {
      unlockedTitles.push(reward.titleId)
    }

    get().updatePlayer({
      achievementsClaimed: [...(player.achievementsClaimed ?? []), achievementId],
      achievementBonuses: bonuses,
      unlockedTitles,
      gold: player.gold + (reward.gold ?? 0),
      gems: player.gems + (reward.gems ?? 0),
      statPoints: player.statPoints + (reward.statPoints ?? 0),
    })

    if (reward.resources) get().addResources(reward.resources)
    if (reward.itemId) {
      const item = createItemInstance(reward.itemId)
      if (item) get().addItem(item)
    }
    return true
  },

  setProfileTitle: (titleId) => {
    const { player } = get()
    if (!player) return false
    if (titleId && !(player.unlockedTitles ?? []).includes(titleId)) return false
    get().updatePlayer({ profileTitleId: titleId ?? undefined })
    return true
  },

  accrueBankInterest: () => {
    const { player } = get()
    if (!player) return
    const balance = player.bankBalance ?? 0
    if (balance <= 0) return
    const interest = calcBankInterest(balance, player.bankLastInterestAt)
    if (interest <= 0) return
    get().updatePlayer({
      bankPendingInterest: (player.bankPendingInterest ?? 0) + interest,
      bankLastInterestAt: new Date().toISOString(),
    })
  },

  collectBankInterest: () => {
    const { player } = get()
    if (!player) return false
    get().accrueBankInterest()
    const p = get().player!
    const pending = p.bankPendingInterest ?? 0
    if (pending <= 0) return false
    get().updatePlayer({
      gold: p.gold + pending,
      bankPendingInterest: 0,
      monthlyStats: bumpMonthlyStat(p, 'goldEarned', pending),
    })
    return true
  },

  depositToBank: (amount) => {
    const { player } = get()
    if (!player || amount < 1 || !Number.isFinite(amount)) return false
    if (!get().spendGold(amount)) return false
    get().accrueBankInterest()
    const p = get().player!
    get().updatePlayer({
      bankBalance: (p.bankBalance ?? 0) + amount,
      bankLastInterestAt: p.bankLastInterestAt ?? new Date().toISOString(),
    })
    return true
  },

  withdrawFromBank: (amount) => {
    const { player } = get()
    if (!player || amount < 1 || !Number.isFinite(amount)) return false
    get().accrueBankInterest()
    const p = get().player!
    const balance = p.bankBalance ?? 0
    if (balance < amount) return false
    get().updatePlayer({ bankBalance: balance - amount })
    const p2 = get().player!
    get().updatePlayer({ gold: p2.gold + amount })
    return true
  },

  changeDisplayName: (name) => {
    const trimmed = name.trim().slice(0, 20)
    if (trimmed.length < 2) return false
    get().updatePlayer({ displayName: trimmed })
    return true
  },

  selectClass: (classId) => {
    const classData = getClassData(classId)
    const mainItem = createItemInstance(classData.startingWeaponId)
    const equipped = { ...EMPTY_EQUIPPED }
    if (mainItem) {
      if (classId === 'summoner') equipped.pet = mainItem
      else equipped.weapon = mainItem
    }
    const level = get().player?.level ?? 1
    const synced = syncPlayerSkills(classId, level, [classData.startingSkill], { [classData.startingSkill]: 1 })
    get().updatePlayer({
      classId, classSelected: true,
      stats: { ...classData.stats },
      statPoints: 0,
      allocatedStats: { atk: 0, hp: 0, def: 0, stealth: 0, endurance: 0 },
      skills: synced.skills,
      skillLevels: synced.skillLevels,
      equipped,
      inventory: [],
      maxEnergy: BASE_MAX_ENERGY,
      currentHp: getCombatMaxHp({ ...get().player!, classId, stats: classData.stats, level: get().player!.level }),
      hpLastRegenAt: new Date().toISOString(),
      ...(classId === 'mage' ? {
        maxMana: getMaxMana({ ...get().player!, classId, level: get().player!.level }),
        currentMana: getMaxMana({ ...get().player!, classId, level: get().player!.level }),
        manaLastRegenAt: new Date().toISOString(),
      } : {}),
    })
  },

  addResources: (resources) => {
    const { player } = get()
    if (!player) return
    const updated = { ...player.resources }
    for (const [key, amount] of Object.entries(resources)) {
      if (!amount) continue
      updated[key as ResourceId] = (updated[key as ResourceId] ?? 0) + amount
    }
    get().updatePlayer({ resources: updated })
  },

  spendResources: (resources) => {
    const { player } = get()
    if (!player) return false
    const cleaned = Object.fromEntries(
      Object.entries(resources).filter(([, v]) => v && v > 0)
    ) as Partial<Record<ResourceId, number>>
    for (const [key, amount] of Object.entries(cleaned)) {
      if ((player.resources[key as ResourceId] ?? 0) < amount!) return false
    }
    const updated = { ...player.resources }
    for (const [key, amount] of Object.entries(cleaned)) {
      updated[key as ResourceId] = (updated[key as ResourceId] ?? 0) - amount!
    }
    get().updatePlayer({ resources: updated })
    return true
  },

  setProfession: (professionId) => {
    const { player } = get()
    if (!player) return
    const levels = player.professionLevels[professionId] ?? new Array(10).fill(0)
    const active = getActiveProfessions(player)
    const nextActive = active.includes(professionId)
      ? active
      : [...active, professionId].slice(0, getProfessionSlotLimit(player))
    get().updatePlayer({
      profession: professionId,
      activeProfessions: nextActive.length ? nextActive : [professionId],
      professionLevels: { ...player.professionLevels, [professionId]: levels },
    })
  },

  toggleActiveProfession: (professionId) => {
    const { player } = get()
    if (!player) return false
    const limit = getProfessionSlotLimit(player)
    const current = getActiveProfessions(player)
    if (current.includes(professionId)) {
      if (current.length <= 1) return false
      const next = current.filter((id) => id !== professionId)
      get().updatePlayer({
        activeProfessions: next,
        profession: next[0] ?? player.profession,
      })
      return true
    }
    if (current.length >= limit) return false
    const next = [...current, professionId]
    get().updatePlayer({ activeProfessions: next, profession: next[0] })
    return true
  },

  performProfessionGrind: (activityId) => {
    const { player } = get()
    if (!player) return false
    const activity = PROFESSION_ACTIVITIES.find((a) => a.id === activityId)
    if (!activity) return false
    if (!isProfessionActive(player, activity.professionId)) return false
    const rank = getProfessionRank(getProfessionExp(player, activity.professionId))
    if (activity.minRank && rank < activity.minRank) return false
    if (activity.requiredTool && !playerHasTool(player, activity.requiredTool)) return false
    if (activity.consumesItemId) {
      const bait = player.inventory.find((i) => i.id === activity.consumesItemId)
      if (!bait?.instanceId) return false
    }
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(activity.energyCost)) return false

    if (activity.consumesItemId) {
      const bait = player.inventory.find((i) => i.id === activity.consumesItemId)
      if (bait?.instanceId) get().removeItemByInstance(bait.instanceId)
    }

    get().addResources(activity.rewards)
    if (activity.id === 'herb_gather' || activity.id === 'herb_rare') {
      const extra = getHerbGatherBonus(player)
      if (extra > 0) get().addResources({ herb: extra })
    }
    const prevExp = getProfessionExp(player, activity.professionId)
    get().updatePlayer({
      professionExp: {
        ...player.professionExp,
        [activity.professionId]: prevExp + activity.professionXp,
      },
    })
    return true
  },

  performMineDig: (targetLevel) => {
    const { player } = get()
    if (!player) return { ok: false }
    if (!isProfessionActive(player, 'blacksmith')) return { ok: false }
    if (!playerHasTool(player, 'pickaxe')) return { ok: false }

    const unlocked = getUnlockedMineLevel(player.mineDigXp ?? 0)
    const level = Math.min(targetLevel ?? player.mineLevel ?? 1, unlocked)
    const mine = getMineLevelData(level)
    const mineWithBonus = {
      ...mine,
      doubleChance: mine.doubleChance + getMineDoubleBonus(player),
    }
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(mine.energyCost)) return { ok: false }

    const { resources, isDouble, isVein } = rollMineRewards(mineWithBonus)
    get().addResources(resources)
    const newXp = (player.mineDigXp ?? 0) + mine.xpPerDig
    get().updatePlayer({
      mineDigXp: newXp,
      mineLevel: level,
      professionExp: {
        ...player.professionExp,
        blacksmith: getProfessionExp(player, 'blacksmith') + mine.xpPerDig,
      },
    })
    applyQuestTracking(get, 'mine', 1)
    return { ok: true, isDouble, isVein }
  },

  performFishing: (targetSpot) => {
    const { player } = get()
    if (!player) return { ok: false }
    if (!isProfessionActive(player, 'hunter')) return { ok: false }
    if (!playerHasTool(player, 'fishing_rod')) return { ok: false }
    const bait = player.inventory.find((i) => i.id === 'fishing_bait')
    if (!bait?.instanceId) return { ok: false }

    const unlocked = getUnlockedFishingSpot(player.fishingSpotXp ?? 0)
    const spotLevel = Math.min(targetSpot ?? player.fishingSpotLevel ?? 1, unlocked)
    const spot = getFishingSpotData(spotLevel)
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(spot.energyCost)) return { ok: false }

    get().removeItemByInstance(bait.instanceId)
    const { fish, junk, isTrophy } = rollSpotFishCatch(spot, getFishingJunkReduction(player))

    if (junk) {
      get().addResources({ fishing_junk: 1 })
      const newXp = (player.fishingSpotXp ?? 0) + spot.xpPerCast
      get().updatePlayer({
        fishingSpotXp: newXp,
        fishingSpotLevel: spotLevel,
      })
      return { ok: true, junk: true }
    }

    if (fish) {
      get().addResources({ [fish.id]: 1 })
      const profXp = spot.xpPerCast + (fish.rarity === 'legendary' ? 8 : fish.rarity === 'epic' ? 5 : fish.rarity === 'rare' ? 2 : 0)
      const newXp = (player.fishingSpotXp ?? 0) + spot.xpPerCast
      get().updatePlayer({
        fishCaughtTotal: (player.fishCaughtTotal ?? 0) + 1,
        fishingSpotXp: newXp,
        fishingSpotLevel: spotLevel,
        professionExp: {
          ...player.professionExp,
          hunter: getProfessionExp(player, 'hunter') + profXp,
        },
        monthlyStats: bumpMonthlyStat(player, 'fishCaught', 1),
      })
      applyQuestTracking(get, 'fish', 1)
      return { ok: true, fishName: fish.nameRu, isTrophy }
    }
    return { ok: false }
  },

  performHunt: (targetLevel) => {
    const { player } = get()
    if (!player) return { ok: false }
    if (!isProfessionActive(player, 'hunter')) return { ok: false }

    const unlocked = getUnlockedHuntLevel(player.huntXp ?? 0)
    const level = Math.min(targetLevel ?? player.huntLevel ?? 1, unlocked)
    const hunt = getHuntLevelData(level)
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(hunt.energyCost)) return { ok: false }

    const { resources, isDouble, isSpecial } = rollHuntRewards(hunt)
    get().addResources(resources)
    const newXp = (player.huntXp ?? 0) + hunt.xpPerAction
    get().updatePlayer({
      huntXp: newXp,
      huntLevel: level,
      professionExp: {
        ...player.professionExp,
        hunter: getProfessionExp(player, 'hunter') + hunt.xpPerAction,
      },
    })
    return { ok: true, isDouble, isSpecial }
  },

  performGemDig: (targetLevel) => {
    const { player } = get()
    if (!player) return { ok: false }
    if (!isProfessionActive(player, 'jeweler')) return { ok: false }
    if (!playerHasTool(player, 'pickaxe')) return { ok: false }

    const unlocked = getUnlockedGemSiteLevel(player.gemSiteXp ?? 0)
    const level = Math.min(targetLevel ?? player.gemSiteLevel ?? 1, unlocked)
    const site = getGemSiteLevelData(level)
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(site.energyCost)) return { ok: false }

    const { resources, isDouble, isSpecial } = rollGemSiteRewards(site)
    get().addResources(resources)
    const newXp = (player.gemSiteXp ?? 0) + site.xpPerAction
    get().updatePlayer({
      gemSiteXp: newXp,
      gemSiteLevel: level,
      professionExp: {
        ...player.professionExp,
        jeweler: getProfessionExp(player, 'jeweler') + site.xpPerAction,
      },
    })
    return { ok: true, isDouble, isSpecial }
  },

  performAetherGather: (targetLevel) => {
    const { player } = get()
    if (!player) return { ok: false }
    if (!isProfessionActive(player, 'sorcerer')) return { ok: false }

    const unlocked = getUnlockedAetherRiftLevel(player.aetherRiftXp ?? 0)
    const level = Math.min(targetLevel ?? player.aetherRiftLevel ?? 1, unlocked)
    const rift = getAetherRiftLevelData(level)
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(rift.energyCost)) return { ok: false }

    const { resources, isDouble, isSpecial } = rollAetherRiftRewards(rift)
    get().addResources(resources)
    const newXp = (player.aetherRiftXp ?? 0) + rift.xpPerAction
    get().updatePlayer({
      aetherRiftXp: newXp,
      aetherRiftLevel: level,
      professionExp: {
        ...player.professionExp,
        sorcerer: getProfessionExp(player, 'sorcerer') + rift.xpPerAction,
      },
    })
    return { ok: true, isDouble, isSpecial }
  },

  performHerbGather: (targetLevel) => {
    const { player } = get()
    if (!player) return { ok: false }
    if (!isProfessionActive(player, 'alchemist')) return { ok: false }
    const hasTool = playerHasTool(player, 'pickaxe') || player.ownedTools?.includes('herbal_sickle')
    if (!hasTool) return { ok: false }

    const unlocked = getUnlockedHerbFieldLevel(player.fieldGatherXp ?? 0)
    const level = Math.min(targetLevel ?? player.fieldLevel ?? 1, unlocked)
    const field = getHerbFieldLevelData(level)
    if (!hasInfiniteEnergy(player) && !get().spendEnergy(field.energyCost)) return { ok: false }

    const { resources, isBonus } = rollHerbGather(field)
    const bonus = getHerbGatherBonus(player)
    if (bonus > 0) {
      const primary = field.primaryHerb
      resources[primary] = (resources[primary] ?? 0) + bonus
    }
    get().addResources(resources)
    const newXp = (player.fieldGatherXp ?? 0) + field.xpPerGather
    get().updatePlayer({
      fieldGatherXp: newXp,
      fieldLevel: level,
      professionExp: {
        ...player.professionExp,
        alchemist: getProfessionExp(player, 'alchemist') + field.xpPerGather,
      },
    })
    return { ok: true, isBonus }
  },

  brewPotion: (recipeId) => {
    const { player } = get()
    if (!player) return false
    const recipe = findAlchemyRecipe(recipeId)
    if (!recipe || !canBrewAlchemyRecipe(player, recipe)) return false
    if (!get().spendGold(recipe.goldCost)) return false
    if (!get().spendResources(recipe.resources)) {
      grantGoldRaw(get, recipe.goldCost)
      return false
    }
    const inst = createItemInstance(recipe.resultItemId)
    if (inst) get().addItem(inst)
    return !!inst
  },

  cookFood: (recipeId) => {
    const { player } = get()
    if (!player) return false
    const recipe = findKitchenRecipe(recipeId)
    if (!recipe) return false
    const scaled = getKitchenRecipesForPlayer(player.classId).find((r) => r.id === recipeId)
    if (!scaled) return false
    if (!get().spendGold(scaled.goldCost)) return false
    if (!get().spendResources(scaled.resources)) {
      grantGoldRaw(get, scaled.goldCost)
      return false
    }
    const inst = createItemInstance(scaled.resultFoodId)
    if (inst) {
      get().addItem(inst)
      applyQuestTracking(get, 'cook', 1)
    }
    return !!inst
  },

  eatFood: (itemId) => {
    const { player } = get()
    if (!player) return false
    const buff = FOOD_BUFF_MAP[itemId]
    if (!buff) return false
    const item = player.inventory.find((i) => i.id === itemId)
    if (!item?.instanceId) return false
    get().removeItemByInstance(item.instanceId)
    const effects = addActiveEffect(player.activeEffects, {
      id: `food_${itemId}`,
      label: buff.label,
      type: 'buff',
      stat: buff.stat,
      mult: buff.mult,
      durationMs: buff.durationMs,
    })
    get().updatePlayer({ activeEffects: effects })
    return true
  },

  getProfessionSkillMissing: (professionId, skillIndex) => {
    const { player } = get()
    if (!player) return []
    const levels = player.professionLevels[professionId] ?? []
    const cost = getProfessionSkillUpgradeCost(professionId, skillIndex, levels[skillIndex] ?? 0)
    if (!cost) return []
    return getMissingCosts(player, cost.gold, cost.resources)
  },

  getProfessionMythicSkillMissing: (professionId, skillIndex) => {
    const { player } = get()
    if (!player) return []
    const levels = player.professionMythicLevels[professionId] ?? []
    const cost = getProfessionMythicSkillUpgradeCost(professionId, skillIndex, levels[skillIndex] ?? 0)
    if (!cost) return []
    return getMissingCosts(player, cost.gold, cost.resources)
  },

  upgradeProfessionSkill: (professionId, skillIndex) => {
    const { player } = get()
    if (!player) return false
    if (!isProfessionActive(player, professionId)) return false
    const rank = getProfessionRank(getProfessionExp(player, professionId))
    if (rank < professionRankRequiredForSkill(skillIndex)) return false
    const prof = PROFESSIONS.find((p) => p.id === professionId)
    if (!prof) return false
    const skill = prof.skills[skillIndex]
    if (!skill) return false
    const levels = [...(player.professionLevels[professionId] ?? new Array(10).fill(0))]
    const cost = getProfessionSkillUpgradeCost(professionId, skillIndex, levels[skillIndex] ?? 0)
    if (!cost) return false
    if (getMissingCosts(player, cost.gold, cost.resources).length > 0) return false
    if (!get().spendGold(cost.gold)) return false
    if (Object.keys(cost.resources).length && !get().spendResources(cost.resources)) {
      grantGoldRaw(get, cost.gold)
      return false
    }
    levels[skillIndex] = (levels[skillIndex] ?? 0) + 1
    get().updatePlayer({ professionLevels: { ...player.professionLevels, [professionId]: levels } })
    return true
  },

  craftItem: (recipeId) => {
    const { player } = get()
    if (!player) return false
    const recipe = findCraftRecipe(recipeId, player)
    if (!recipe) return false
    if (recipe.requiredProfession && !isProfessionActive(player, recipe.requiredProfession)) return false
    if (recipe.requiredProfessionLevel) {
      const levels = player.professionLevels[recipe.requiredProfession!] ?? []
      if (levels.reduce((s, l) => s + l, 0) < recipe.requiredProfessionLevel) return false
    }
    if (recipe.requiredClass && recipe.requiredClass !== player.classId) return false

    if (recipe.isMythicCraft && recipe.sourceInstanceId) {
      const source = player.inventory.find((i) => i.instanceId === recipe.sourceInstanceId)
        ?? Object.values(player.equipped).find((i) => i?.instanceId === recipe.sourceInstanceId)
      if (!source) return false
      const upgraded = get().craftMythicItem(source)
      if (!upgraded) return false
      if (player.inventory.some((i) => i.instanceId === recipe.sourceInstanceId)) {
        get().removeItemByInstance(recipe.sourceInstanceId)
      } else {
        const slot = (Object.keys(player.equipped) as (keyof Player['equipped'])[]).find(
          (s) => player.equipped[s]?.instanceId === recipe.sourceInstanceId,
        )
        if (slot) get().updatePlayer({ equipped: { ...player.equipped, [slot]: upgraded } })
        return true
      }
      get().addItem(upgraded)
      return true
    }

    const scaled = recipe.requiredProfession === 'blacksmith' && isProfessionActive(player, 'blacksmith')
      ? applyBlacksmithCraftCost(player, recipe)
      : recipe

    if (!get().spendGold(scaled.goldCost)) return false
    if (!get().spendResources(scaled.resources)) {
      grantGoldRaw(get, scaled.goldCost)
      return false
    }

    let inst = createItemInstance(recipe.resultItemId)
    if (inst) {
      inst = applyBlacksmithCraftBonuses(player, inst)
      get().addItem(inst)
      if (Math.random() < getBlacksmithDoubleCraftChance(player)) {
        const duplicate = applyBlacksmithCraftBonuses(player, createItemInstance(recipe.resultItemId)!)
        if (duplicate) get().addItem(duplicate)
      }
    }
    return !!inst
  },

  upgradeItemLevel: (item) => {
    const lvl = item.upgradeLevel ?? 1
    if (lvl >= 10) return null
    const cost = getUpgradeLevelCost(item)
    if (!get().spendGold(cost.gold)) return null
    if (!get().spendResources(cost.resources)) return null
    return ensureItemDurability({ ...item, upgradeLevel: lvl + 1, name: item.name.replace(/ \+\d+$/, '') + ` +${lvl + 1}` })
  },

  upgradeItemStars: (item) => {
    const stars = item.starLevel ?? 0
    if (stars >= 10) return null
    const cost = getStarUpgradeCost(item)
    if (!get().spendGold(cost.gold)) return null
    if (!get().spendResources(cost.resources)) return null
    const starStr = '★'.repeat(stars + 1)
    return ensureItemDurability({ ...item, starLevel: stars + 1, name: `${item.name.replace(/ ★+$/, '')} ${starStr}` })
  },

  listOnMarket: (item, price) => {
    const { player } = get()
    if (!player || !item.instanceId) return false
    const inInventory = player.inventory.some((i) => i.instanceId === item.instanceId)
    if (!inInventory) return false
    get().removeItemByInstance(item.instanceId)
    const listing: MarketListing = {
      id: `listing_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      sellerId: player.telegramId,
      sellerName: player.displayName,
      item,
      goldPrice: price,
      isPlayerListing: true,
    }
    get().updatePlayer({ marketListings: [...player.marketListings, listing] })
    void get().syncPlayerState()
    return true
  },

  listResourceOnMarket: (resourceId, amount, price) => {
    const { player } = get()
    if (!player || amount < 1) return false
    const have = player.resources[resourceId] ?? 0
    if (have < amount) return false
    const updated = { ...player.resources, [resourceId]: have - amount }
    const listing: MarketListing = {
      id: `listing_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      sellerId: player.telegramId,
      sellerName: player.displayName,
      resourceId,
      resourceAmount: amount,
      goldPrice: price,
      isPlayerListing: true,
    }
    get().updatePlayer({ resources: updated, marketListings: [...player.marketListings, listing] })
    void get().syncPlayerState()
    return true
  },

  getCraftMissing: (recipeId) => {
    const { player } = get()
    const recipe = findCraftRecipe(recipeId, player)
    if (!recipe || !player) return []
    if (recipe.isMythicCraft && recipe.sourceInstanceId) {
      const source = player.inventory.find((i) => i.instanceId === recipe.sourceInstanceId)
        ?? Object.values(player.equipped).find((i) => i?.instanceId === recipe.sourceInstanceId)
      if (!source) return [{ key: 'item', label: 'Предмет не найден', icon: '❌', have: 0, need: 1 }]
      if ((source.upgradeLevel ?? 1) < 10 || (source.starLevel ?? 0) < 10) {
        return [{ key: 'upgrade', label: 'Нужно 10 ур. и 10★', icon: '⭐', have: 0, need: 1 }]
      }
    }
    const scaled = recipe.requiredProfession === 'blacksmith' && isProfessionActive(player, 'blacksmith')
      ? applyBlacksmithCraftCost(player, recipe)
      : recipe
    return getMissingCosts(
      player,
      scaled.goldCost,
      scaled.resources,
      recipe,
    )
  },

  getUpgradeLevelMissing: (item) => {
    const { player } = get()
    if (!player || (item.upgradeLevel ?? 1) >= 10) return []
    return getMissingCosts(player, getUpgradeLevelCost(item).gold, getUpgradeLevelCost(item).resources)
  },

  getStarUpgradeMissing: (item) => {
    const { player } = get()
    if (!player || (item.starLevel ?? 0) >= 10) return []
    return getMissingCosts(player, getStarUpgradeCost(item).gold, getStarUpgradeCost(item).resources)
  },

  getMythicUpgradeMissing: (item) => {
    const { player } = get()
    if (!player) return [{ key: 'player', label: 'Игрок', icon: '❌', have: 0, need: 1 }]
    if (item.rarity === 'mythic') {
      return [{ key: 'mythic', label: 'Уже мифический', icon: '🌟', have: 1, need: 1 }]
    }
    const missing: MissingCost[] = []
    if ((item.upgradeLevel ?? 1) < 10) {
      missing.push({ key: 'level', label: 'Уровень предмета', icon: '⬆️', have: item.upgradeLevel ?? 1, need: 10 })
    }
    if ((item.starLevel ?? 0) < 10) {
      missing.push({ key: 'stars', label: 'Звёздность', icon: '⭐', have: item.starLevel ?? 0, need: 10 })
    }
    return [...missing, ...getMissingCosts(player, MYTHIC_UPGRADE_COST.gold, MYTHIC_UPGRADE_COST.resources)]
  },

  craftMythicItem: (item) => {
    const { player } = get()
    if (!player || item.rarity === 'mythic') return null
    if ((item.upgradeLevel ?? 1) < 10 || (item.starLevel ?? 0) < 10) return null
    if (!get().spendGold(MYTHIC_UPGRADE_COST.gold)) return null
    if (!get().spendResources(MYTHIC_UPGRADE_COST.resources)) return null
    const boosted: Partial<import('@/types/game').Stats> = {}
    for (const [k, v] of Object.entries(item.stats)) {
      boosted[k as keyof import('@/types/game').Stats] = Math.floor((v as number) * 1.5)
    }
    return {
      ...item,
      rarity: 'mythic' as const,
      stats: boosted,
      name: `✦ ${item.name.replace(/^✦ /, '')}`,
      description: `${item.description} [Мифический]`,
    }
  },

  upgradeProfessionMythicSkill: (professionId, skillIndex) => {
    const { player } = get()
    if (!player) return false
    const levels = player.professionLevels[professionId] ?? []
    if (!isProfessionMaxed(professionId, levels)) return false
    const skill = MYTHIC_SKILLS[professionId]?.[skillIndex]
    if (!skill) return false
    const mythicLevels = [...(player.professionMythicLevels[professionId] ?? new Array(5).fill(0))]
    const cost = getProfessionMythicSkillUpgradeCost(professionId, skillIndex, mythicLevels[skillIndex] ?? 0)
    if (!cost) return false
    if (getMissingCosts(player, cost.gold, cost.resources).length > 0) return false
    if (!get().spendGold(cost.gold)) return false
    if (Object.keys(cost.resources).length && !get().spendResources(cost.resources)) {
      grantGoldRaw(get, cost.gold)
      return false
    }
    mythicLevels[skillIndex] = (mythicLevels[skillIndex] ?? 0) + 1
    get().updatePlayer({ professionMythicLevels: { ...player.professionMythicLevels, [professionId]: mythicLevels } })
    return true
  },

  removeMarketListing: (listingId) => {
    const { player } = get()
    if (!player) return
    const listing = player.marketListings.find((l) => l.id === listingId)
    if (listing?.item) get().addItem(listing.item)
    if (listing?.resourceId && listing.resourceAmount) {
      get().addResources({ [listing.resourceId]: listing.resourceAmount })
    }
    get().updatePlayer({ marketListings: player.marketListings.filter((l) => l.id !== listingId) })
    void get().syncPlayerState()
  },

  syncPlayerState: async () => {
    const { player } = get()
    if (!player) return
    const result = await syncPlayerToServer(player)
    if (!result) return

    const soldSet = new Set(result.soldListingIds)
    const hasGifts = (result.incomingGifts?.length ?? 0) > 0
    const needsUpdate = result.pendingGold > 0 || soldSet.size > 0 || hasGifts
    if (!needsUpdate) return

    const inventory = [...player.inventory]
    for (const gift of result.incomingGifts ?? []) {
      inventory.push(ensureItemDurability(gift.item))
    }

    const updated = {
      ...player,
      gold: player.gold + result.pendingGold,
      inventory,
      marketListings: soldSet.size > 0
        ? player.marketListings.filter((l) => !soldSet.has(l.id))
        : player.marketListings,
    }
    set({ player: updated })
    updated.lastOnlineAt = new Date().toISOString()
    storageSet(SAVE_KEY, updated)
    await savePlayerToSupabase(updated)
    registerOnlinePlayer(updated)
  },

  dismantleItem: (item) => {
    const { player } = get()
    if (!player || !item.instanceId || item.slot === 'consumable') return false
    if (!player.inventory.some((i) => i.instanceId === item.instanceId)) return false
    const equipped = Object.values(player.equipped).some((i) => i?.instanceId === item.instanceId)
    if (equipped) return false
    if (player.marketListings.some((l) => l.item?.instanceId === item.instanceId)) return false

    const yield_ = getDismantleYield(item)
    get().removeItemByInstance(item.instanceId)
    if (yield_.gold > 0) get().addGold(yield_.gold)
    if (Object.keys(yield_.resources).length > 0) get().addResources(yield_.resources)
    return true
  },

  dismantleAllCommonItems: () => {
    const { player } = get()
    if (!player) return 0
    const equippedIds = new Set(
      Object.values(player.equipped).map((i) => i?.instanceId).filter(Boolean) as string[],
    )
    const listedIds = new Set(
      player.marketListings.map((l) => l.item?.instanceId).filter(Boolean) as string[],
    )
    const commons = player.inventory.filter(
      (i) => i.rarity === 'common'
        && i.slot !== 'consumable'
        && i.instanceId
        && !equippedIds.has(i.instanceId)
        && !listedIds.has(i.instanceId),
    )
    let count = 0
    for (const item of commons) {
      if (get().dismantleItem(item)) count++
    }
    return count
  },

  buyMarketListing: async (listing) => {
    const { player } = get()
    if (!player || listing.sellerId === player.telegramId) return false
    if (player.gold < listing.goldPrice) return false

    const bought = await buyServerMarketListing(listing.id)
    if (!bought) return false
    if (!get().spendGold(listing.goldPrice)) return false

    if (bought.item) get().addItem(bought.item)
    if (bought.resourceId && bought.resourceAmount) {
      get().addResources({ [bought.resourceId]: bought.resourceAmount })
    }
    return true
  },

  getPlayerSkillMissing: (skillId) => {
    const { player } = get()
    if (!player) return []
    const current = player.skillLevels[skillId] ?? 0
    if (current >= SKILL_MAX_LEVEL) return []
    const cost = getSkillUpgradeCost(skillId, current)
    return getMissingCosts(player, cost.gold, cost.resources)
  },

  upgradePlayerSkill: (skillId) => {
    const { player } = get()
    if (!player || !player.skills.includes(skillId)) return false
    const current = player.skillLevels[skillId] ?? 1
    if (current >= SKILL_MAX_LEVEL) return false
    const cost = getSkillUpgradeCost(skillId, current)
    if (!get().spendGold(cost.gold)) return false
    if (!get().spendResources(cost.resources)) {
      grantGoldRaw(get, cost.gold)
      return false
    }
    const skillLevels = { ...player.skillLevels, [skillId]: current + 1 }
    get().updatePlayer({ skillLevels })
    return true
  },

  addFriendById: (friendId) => {
    const { player } = get()
    if (!player) return false
    const id = Math.floor(Number(friendId))
    if (!Number.isFinite(id) || id <= 0 || id === player.telegramId) return false
    const friends = [...(player.friendIds ?? [])]
    if (friends.includes(id)) return false
    get().updatePlayer({ friendIds: [...friends, id] })
    return true
  },

  removeFriend: (friendId) => {
    const { player } = get()
    if (!player) return false
    const friends = (player.friendIds ?? []).filter((id) => id !== friendId)
    if (friends.length === (player.friendIds ?? []).length) return false
    get().updatePlayer({ friendIds: friends })
    return true
  },

  playFairBet: (bet, pick) => {
    const { player } = get()
    if (!player) return null
    const amount = Math.floor(bet)
    if (amount < 1 || amount > player.gold) return null
    if (!get().spendGold(amount)) return null

    const result = spinFairWheel()
    const payout = calcFairPayout(amount, pick, result)
    const won = payout > 0
    const stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      goldWon: 0,
      goldLost: 0,
      ...player.fairStats,
    }

    stats.gamesPlayed++
    if (won) {
      get().addGold(payout)
      stats.gamesWon++
      stats.goldWon += payout
    } else {
      stats.gamesLost++
      stats.goldLost += amount
    }

    get().updatePlayer({ fairStats: stats })
    return { won, result, payout }
  },

  drawFateCard: (type) => {
    const { player } = get()
    if (!player || !canDrawFateCard(player)) return false
    const patch: Partial<Player> = { fateCardLastUsedAt: new Date().toISOString() }
    if (type === 'gold') {
      patch.buffFateGoldUntil = extendBuff(player.buffFateGoldUntil, FATE_CARD_BUFF_DURATION_MS)
    } else {
      patch.buffFateExpUntil = extendBuff(player.buffFateExpUntil, FATE_CARD_BUFF_DURATION_MS)
    }
    get().updatePlayer(patch)
    return true
  },

  resetAllocatedStats: () => {
    const { player } = get()
    if (!player) return false
    const alloc = player.allocatedStats
    const total = alloc.atk + alloc.hp + alloc.def + alloc.stealth + alloc.endurance
    if (total === 0) return false
    const updated = {
      ...player,
      statPoints: player.statPoints + total,
      allocatedStats: { ...EMPTY_ALLOCATED },
    }
    get().updatePlayer({
      statPoints: updated.statPoints,
      allocatedStats: updated.allocatedStats,
      ...syncEnergyFields(updated),
    })
    return true
  },

  purchaseStarProduct: async (productId) => {
    const paid = await requestStarsPayment(productId)
    if (!paid) return false
    return get().applyStarProductReward(productId)
  },

  applyStarProductReward: (productId) => {
    const { player } = get()
    if (!player) return false

    switch (productId) {
      case 'starter_boost':
        get().updatePlayer({ gold: player.gold + 5000, gems: player.gems + 50 })
        grantRandomRareItems(3)
        break
      case 'infinite_energy_24h':
        get().updatePlayer({
          buffInfiniteEnergyUntil: extendBuff(player.buffInfiniteEnergyUntil, 24 * 3_600_000),
        })
        break
      case 'double_exp_7d':
        get().updatePlayer({
          buffDoubleExpUntil: extendBuff(player.buffDoubleExpUntil, 7 * 24 * 3_600_000),
        })
        break
      case 'stat_reset':
        if (!get().resetAllocatedStats()) {
          get().updatePlayer({ statPoints: player.statPoints + 5 })
        }
        break
      case 'telegram_hero_set':
        grantSetItems('telegram_hero')
        get().updatePlayer({ auraEffectId: 'telegram_hero', cosmeticAvatarId: 'telegram_hero' })
        break
      case 'mythic_craft_pack':
        get().addResources({ ...MYTHIC_UPGRADE_COST.resources })
        break
      case 'triple_gold_3d':
        get().updatePlayer({
          buffTripleGoldUntil: extendBuff(player.buffTripleGoldUntil, 3 * 24 * 3_600_000),
        })
        break
      case 'daily_bonus_50_30d':
        get().updatePlayer({
          buffDailyBonusUntil: extendBuff(player.buffDailyBonusUntil, 30 * 24 * 3_600_000),
        })
        break
      case 'mythic_starter_pack':
        get().updatePlayer({
          gold: player.gold + 10000,
          gems: player.gems + 100,
          cosmeticAvatarId: 'mythic_starter',
          auraEffectId: 'mythic_starter',
        })
        grantSetItems('solo_leveling')
        break
      case 'extra_profession_slot': {
        const limit = player.professionSlotLimit ?? BASE_PROFESSION_SLOTS
        if (limit >= MAX_PROFESSION_SLOTS) return false
        get().updatePlayer({ professionSlotLimit: limit + 1 })
        break
      }
      case 'cosmetic_avatar_telegram_hero':
        get().updatePlayer({
          unlockedCosmetics: [...new Set([...(player.unlockedCosmetics ?? []), 'telegram_hero'])],
        })
        break
      case 'cosmetic_avatar_mythic_starter':
        get().updatePlayer({
          unlockedCosmetics: [...new Set([...(player.unlockedCosmetics ?? []), 'mythic_starter'])],
        })
        break
      case 'cosmetic_frame_gold':
        get().updatePlayer({
          unlockedCosmetics: [...new Set([...(player.unlockedCosmetics ?? []), 'gold'])],
        })
        break
      case 'cosmetic_frame_legendary':
        get().updatePlayer({
          unlockedCosmetics: [...new Set([...(player.unlockedCosmetics ?? []), 'legendary'])],
        })
        break
      case 'cosmetic_frame_mythic':
        get().updatePlayer({
          unlockedCosmetics: [...new Set([...(player.unlockedCosmetics ?? []), 'mythic'])],
        })
        break
      default:
        return false
    }
    return true
  },

  consumeConsumable: (itemId) => {
    const { player } = get()
    if (!player) return null
    const item = findConsumableInstance(player.inventory, itemId)
    if (!item?.instanceId) return null
    const effect = CONSUMABLE_EFFECTS[itemId]
    if (!effect) return null

    const result: { healHp?: number; energy?: number } = {}

    if (effect.healPercent > 0) {
      const maxHp = getCombatMaxHp(player)
      const current = getPlayerCurrentHp(player)
      if (current >= maxHp) return null
      const heal = Math.floor(maxHp * effect.healPercent)
      result.healHp = heal
      get().updatePlayer({
        currentHp: Math.min(maxHp, current + heal),
        hpLastRegenAt: new Date().toISOString(),
      })
    }

    if (effect.energy > 0) {
      const maxE = getMaxEnergy(player)
      if (player.energy >= maxE) {
        if (!result.healHp) return null
      } else {
        result.energy = effect.energy
        get().updatePlayer({
          energy: Math.min(maxE, player.energy + effect.energy),
        })
      }
    }

    get().removeItemByInstance(item.instanceId)
    return result
  },

  replaceItemInstance: (oldInstanceId, newItem) => {
    const { player } = get()
    if (!player) return
    const invIdx = player.inventory.findIndex((i) => i.instanceId === oldInstanceId)
    if (invIdx >= 0) {
      const inventory = [...player.inventory]
      inventory[invIdx] = newItem
      get().updatePlayer({ inventory })
      return
    }
    for (const slot of Object.keys(player.equipped) as (keyof Player['equipped'])[]) {
      if (player.equipped[slot]?.instanceId === oldInstanceId) {
        get().updatePlayer({ equipped: { ...player.equipped, [slot]: newItem } })
        return
      }
    }
  },

  unlockCosmetic: (id) => {
    const { player } = get()
    if (!player) return false
    const opt = [...AVATAR_OPTIONS, ...FRAME_OPTIONS].find((o) => o.id === id)
    if (!opt) return false
    if (opt.stars === 0) return true
    return player.unlockedCosmetics?.includes(id) ?? false
  },

  purchaseCosmetic: async (id) => {
    const { player } = get()
    if (!player) return false
    const opt = [...AVATAR_OPTIONS, ...FRAME_OPTIONS].find((o) => o.id === id)
    if (!opt) return false
    if (opt.stars === 0 || player.unlockedCosmetics?.includes(id)) return true
    const productId = getCosmeticStarProductId(id)
    if (!productId) return false
    const paid = await requestStarsPayment(productId)
    if (!paid) return false
    return get().applyStarProductReward(productId)
  },

  applyCosmetic: (type, id) => {
    const { player } = get()
    if (!player) return false
    const opt = [...AVATAR_OPTIONS, ...FRAME_OPTIONS].find((o) => o.id === id && o.type === type)
    if (!opt) return false
    if (opt.stars > 0 && !player.unlockedCosmetics?.includes(id)) return false
    if (type === 'avatar') {
      get().updatePlayer({ cosmeticAvatarId: id })
    } else {
      get().updatePlayer({ profileFrameId: id === 'none' ? undefined : id })
    }
    return true
  },

  grantEffectPreset: (preset, durationMs) => {
    const { player } = get()
    if (!player) return
    const p = EFFECT_PRESETS[preset]
    get().updatePlayer({
      activeEffects: addActiveEffect(player.activeEffects, { ...p, durationMs }),
    })
  },

  applyCombatDurabilityWear: (victory, isBoss) => {
    const { player } = get()
    if (!player) return
    const wear = victory ? (isBoss ? 2 : 1) : 3
    const equipped = { ...player.equipped }
    let changed = false
    for (const slot of Object.keys(equipped) as (keyof Player['equipped'])[]) {
      const item = equipped[slot]
      if (!item) continue
      equipped[slot] = wearItem(ensureItemDurability(item), wear)
      changed = true
    }
    if (changed) get().updatePlayer({ equipped })
  },

  getRepairAllCost: () => {
    const { player } = get()
    if (!player) return 0
    const items = [
      ...player.inventory.filter((i) => i.slot !== 'consumable'),
      ...(Object.values(player.equipped).filter(Boolean) as Item[]),
    ]
    return items.reduce((sum, item) => sum + getRepairCost(ensureItemDurability(item)), 0)
  },

  repairItem: (item) => {
    if (!item.instanceId) return false
    const cost = getRepairCost(ensureItemDurability(item))
    if (cost <= 0) return true
    if (!get().spendGold(cost)) return false
    get().replaceItemInstance(item.instanceId, repairItemFull(ensureItemDurability(item)))
    return true
  },

  repairAllItems: () => {
    const cost = get().getRepairAllCost()
    if (cost <= 0) return true
    if (!get().spendGold(cost)) return false
    const { player } = get()
    if (!player) return false
    const inventory = player.inventory.map((i) =>
      i.slot === 'consumable' ? i : repairItemFull(ensureItemDurability(i)),
    )
    const equipped = { ...player.equipped }
    for (const slot of Object.keys(equipped) as (keyof Player['equipped'])[]) {
      const item = equipped[slot]
      if (item) equipped[slot] = repairItemFull(ensureItemDurability(item))
    }
    get().updatePlayer({ inventory, equipped })
    return true
  },

  getRarityUpgradeMissing: (item) => {
    const { player } = get()
    if (!player || !canUpgradeRarity(item)) {
      return [{ key: 'rarity', label: 'Максимальная редкость', icon: '✦', have: 0, need: 1 }]
    }
    const dupes = countDuplicateItems(
      [...player.inventory, ...(Object.values(player.equipped).filter(Boolean) as Item[])],
      item.id,
      item.instanceId,
    )
    const missing: MissingCost[] = []
    if (dupes < RARITY_DUPLICATES_REQUIRED) {
      missing.push({
        key: 'duplicates',
        label: `Копии предмета`,
        icon: '📦',
        have: dupes,
        need: RARITY_DUPLICATES_REQUIRED,
      })
    }
    const cost = getRarityUpgradeCost(item)
    missing.push(...getMissingCosts(player, cost.gold, cost.resources))
    return missing
  },

  upgradeItemRarity: (item) => {
    const { player } = get()
    if (!player || !item.instanceId || !canUpgradeRarity(item)) return null
    if (get().getRarityUpgradeMissing(item).length > 0) return null
    const allItems = [
      ...player.inventory,
      ...(Object.values(player.equipped).filter(Boolean) as Item[]),
    ]
    const dupes = allItems.filter(
      (i) => i.id === item.id && i.instanceId !== item.instanceId && i.slot !== 'consumable',
    )
    const cost = getRarityUpgradeCost(item)
    if (!get().spendGold(cost.gold)) return null
    if (!get().spendResources(cost.resources)) return null
    for (let i = 0; i < RARITY_DUPLICATES_REQUIRED; i++) {
      get().removeItemByInstance(dupes[i].instanceId!)
    }
    const upgraded = ensureItemDurability(applyRarityUpgrade(item)!)
    get().replaceItemInstance(item.instanceId, upgraded)
    return upgraded
  },

  trackQuestEvent: (event, amount = 1) => {
    applyQuestTracking(get, event, amount)
  },

  claimQuestReward: (questId, scope) => {
    const { player } = get()
    if (!player) return false
    const state = normalizeQuestState(player)
    const pool = scope === 'daily' ? DAILY_QUESTS : scope === 'weekly' ? WEEKLY_QUESTS : GUILD_QUESTS
    const quest = pool.find((q) => q.id === questId)
    if (!quest || isQuestClaimed(state, questId, scope)) return false

    const progress = scope === 'guild'
      ? (getGuildQuestProgress()[questId] ?? 0)
      : getQuestProgress(state, questId, scope)
    if (progress < quest.target) return false

    if (quest.rewards.gold) get().addGold(quest.rewards.gold)
    if (quest.rewards.resources) get().addResources(quest.rewards.resources)

    const claimedKey = scope === 'daily' ? 'dailyClaimed' : scope === 'weekly' ? 'weeklyClaimed' : 'guildClaimed'
    const partial: Partial<Player> = {
      questState: { ...state, [claimedKey]: [...state[claimedKey], questId] },
    }
    if (quest.rewards.gems) partial.gems = player.gems + quest.rewards.gems
    get().updatePlayer(partial)
    return true
  },

  invitePlayerToGuild: (targetId) => {
    const { player } = get()
    if (!player) return false
    return inviteToGuildById(player.telegramId, targetId, player.displayName)
  },

  acceptGuildInvite: (guildId) => {
    const { player } = get()
    if (!player) return false
    const ok = acceptGuildInviteMp(player.telegramId, player.displayName, player.username, guildId)
    if (ok) {
      get().updatePlayer({ guildId, guildJoinedAt: new Date().toISOString() })
    }
    return ok
  },

  declineGuildInvite: (guildId) => {
    const { player } = get()
    if (!player) return
    declineGuildInvite(player.telegramId, guildId)
  },

  getPendingGuildInvites: () => {
    const { player } = get()
    if (!player) return []
    return getGuildInvitesFor(player.telegramId)
  },

  sendGuildGift: async (toId, item) => {
    const { player } = get()
    if (!player || !item.instanceId || item.slot === 'consumable') return false
    if (!isInGuildRoster(toId) || toId === player.telegramId) return false
    if (!player.inventory.some((i) => i.instanceId === item.instanceId)) return false

    const initData = getInitData()
    if (!initData) return false

    get().removeItemByInstance(item.instanceId)
    try {
      const res = await fetch('/api/multiplayer/guild-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, toId, item: ensureItemDurability(item) }),
      })
      if (!res.ok) {
        get().addItem(item)
        return false
      }
      return true
    } catch {
      get().addItem(item)
      return false
    }
  },

  sellResourceToNpc: (resourceId, amount) => {
    const { player } = get()
    if (!player || amount < 1) return false
    const have = player.resources[resourceId] ?? 0
    if (have < amount) return false
    const gold = getNpcSellGold(resourceId, amount)
    if (gold <= 0) return false
    if (!get().spendResources({ [resourceId]: amount })) return false
    get().addGold(gold)
    return true
  },

  sellItemToNpc: (item) => {
    const { player } = get()
    if (!player || !item.instanceId || item.slot === 'consumable') return false
    if (!player.inventory.some((i) => i.instanceId === item.instanceId)) return false
    const price = item.sellPrice ?? 0
    if (price <= 0) return false
    get().removeItemByInstance(item.instanceId)
    get().addGold(price)
    return true
  },

  claimMonthlyReward: (categoryId, rank) => {
    const { player } = get()
    if (!player || rank < 1 || rank > 3) return false
    const key = `${categoryId}_${rank}`
    const claimed = player.monthlyRewardsClaimed ?? []
    if (claimed.includes(key)) return false
    const reward = MONTHLY_RANK_REWARDS[rank as 1 | 2 | 3]
    get().updatePlayer({
      gold: player.gold + reward.gold,
      gems: player.gems + reward.gems,
      monthlyRewardsClaimed: [...claimed, key],
    })
    return true
  },

  updateNotificationSettings: (settings) => {
    const { player } = get()
    if (!player) return
    get().updatePlayer({
      notificationSettings: { ...getNotificationSettings(player), ...settings },
    })
  },
}))

function calculateIdle(player: Player): IdleReward | null {
  const minutes = Math.floor((Date.now() - new Date(player.lastOnlineAt).getTime()) / 60_000)
  if (minutes < 5) return null
  const capped = Math.min(minutes, 480)
  const floor = getFloorData(player.farmFloor)
  const gold = Math.floor((floor.idleGoldPerHour / 60) * capped)
  const exp = Math.floor((floor.idleExpPerHour / 60) * capped)
  if (gold <= 0 && exp <= 0) return null
  return { gold, exp, minutes: capped }
}

function grantGoldRaw(
  get: () => { player: Player | null; updatePlayer: (partial: Partial<Player>) => void },
  amount: number,
) {
  const { player } = get()
  if (!player || amount <= 0) return
  get().updatePlayer({ gold: player.gold + amount })
}

function grantRandomRareItems(count: number) {
  const pool = Object.values(ALL_ITEMS).filter(
    (i) => i.rarity === 'rare' && i.slot !== 'consumable' && !i.setId
  )
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  for (let i = 0; i < count && i < shuffled.length; i++) {
    const inst = createItemInstance(shuffled[i].id)
    if (inst) usePlayerStore.getState().addItem(inst)
  }
}

function grantSetItems(setId: string) {
  for (const id of Object.keys(ALL_ITEMS)) {
    if (id.startsWith(`${setId}_`)) {
      const inst = createItemInstance(id)
      if (inst) usePlayerStore.getState().addItem(inst)
    }
  }
}

export function usePlayerStats() {
  const player = usePlayerStore((s) => s.player)
  if (!player) return null
  return getEffectiveStats(player)
}

export { getEffectiveStats, getMaxEnergy, getEnergyRegenIntervalMs, getEnergyFullInMs, formatDuration, getCombatMaxHp } from '@/lib/playerStats'
export { getMobsRequiredForFloor } from '@/data/items'
