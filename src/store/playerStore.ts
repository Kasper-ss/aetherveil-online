import { create } from 'zustand'
import type { Player, IdleReward, CombatResult, Item, PlayerClass, ProfessionId, ResourceId, MarketListing, AllocStatKey } from '@/types/game'
import { createDefaultPlayer, migratePlayer, getFloorData, DAILY_REWARDS } from '@/data/gameData'
import { getTelegramUser } from '@/lib/telegram'
import { requestStarsPayment } from '@/lib/starsPayment'
import { loadPlayerFromSupabase, savePlayerToSupabase } from '@/lib/supabase'
import { storageGet, storageSet, xpForLevel } from '@/lib/utils'
import {
  getClassData, CRAFT_RECIPES, PROFESSIONS, getUpgradeLevelCost, getStarUpgradeCost, getDismantleYield,
  MYTHIC_SKILLS, MYTHIC_UPGRADE_COST, isProfessionMaxed,
  getProfessionSkillUpgradeCost, getProfessionMythicSkillUpgradeCost,
} from '@/data/classes'
import { createItemInstance, EMPTY_EQUIPPED, ALL_ITEMS } from '@/data/items'
import { getEffectiveStats, getMaxEnergy, getEnergyRegenIntervalMs, getCombatMaxHp, getHpRegenIntervalMs, getPlayerCurrentHp, BASE_MAX_ENERGY, EMPTY_ALLOCATED } from '@/lib/playerStats'
import { getMissingCosts, type MissingCost } from '@/lib/craftCosts'
import { registerOnlinePlayer } from '@/lib/multiplayer'
import { syncPlayerToServer, buyServerMarketListing } from '@/lib/multiplayerSync'
import { extendBuff, getDailyBonusExtra, getExpMultiplier, getGoldMultiplier, hasInfiniteEnergy } from '@/lib/playerBuffs'
import { type StarProductId } from '@/data/starShop'

interface PlayerState {
  player: Player | null
  isLoading: boolean
  isAuthenticated: boolean
  idleReward: IdleReward | null

  loadPlayer: () => Promise<void>
  savePlayer: () => Promise<void>
  updatePlayer: (partial: Partial<Player>) => void
  addExp: (amount: number) => void
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  spendGems: (amount: number) => boolean
  spendEnergy: (amount: number) => boolean
  addItem: (item: Item) => void
  removeItemByInstance: (instanceId: string) => void
  equipItem: (item: Item) => void
  unequipItem: (slot: keyof Player['equipped']) => void
  setFarmFloor: (floor: number) => void
  recordMobKill: (floor: number) => void
  advanceFloor: () => void
  applyCombatResult: (result: CombatResult) => void
  applyDeathPenalty: () => void
  claimIdleRewards: () => void
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
  purchaseStarProduct: (productId: StarProductId) => Promise<boolean>
  applyStarProductReward: (productId: StarProductId) => boolean
  resetAllocatedStats: () => boolean
}

const SAVE_KEY = 'player'

function syncEnergyFields(player: Player): Partial<Player> {
  return { maxEnergy: getMaxEnergy(player) }
}

function getEquipSlotForItem(item: Item, classId?: PlayerClass): keyof Player['equipped'] | null {
  if (item.slot === 'consumable') return null
  if (item.slot === 'pet') return 'pet'
  if (item.slot === 'weapon') return classId === 'summoner' ? null : 'weapon'
  return item.slot as keyof Player['equipped']
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  isLoading: true,
  isAuthenticated: false,
  idleReward: null,

  loadPlayer: async () => {
    set({ isLoading: true })
    const user = getTelegramUser()
    try {
      let player = await loadPlayerFromSupabase(user.id)
      if (!player) player = storageGet<Player | null>(SAVE_KEY, null)
      if (!player) player = createDefaultPlayer(user.id, user.first_name, user.username ?? `user_${user.id}`)
      player = migratePlayer(player)
      const idle = calculateIdle(player)
      set({ player, isLoading: false, isAuthenticated: true, idleReward: idle })
      get().tryRegenVitals()
      void get().syncPlayerState()
      registerOnlinePlayer(get().player ?? player)
    } catch (error) {
      console.error('[Aetherveil] loadPlayer failed, resetting save', error)
      const player = migratePlayer(
        createDefaultPlayer(user.id, user.first_name, user.username ?? `user_${user.id}`)
      )
      storageSet(SAVE_KEY, player)
      set({ player, isLoading: false, isAuthenticated: true, idleReward: null })
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
    const updated = { ...player, ...partial }
    const maxHp = getCombatMaxHp(updated)
    if (updated.currentHp != null) {
      updated.currentHp = Math.min(maxHp, Math.max(0, updated.currentHp))
    }
    set({ player: updated })
    registerOnlinePlayer(updated)
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
    get().updatePlayer({ exp, level, statPoints, ...syncEnergyFields(player) })
  },

  addGold: (amount) => {
    const { player } = get()
    if (!player) return
    const boosted = Math.floor(amount * getGoldMultiplier(player))
    get().updatePlayer({ gold: player.gold + boosted })
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

  addItem: (item) => {
    const { player } = get()
    if (!player) return
    const inst = item.instanceId ? item : { ...item, instanceId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
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
    get().updatePlayer({ equipped })
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
    get().updatePlayer({ floorMobKills: kills })
  },

  advanceFloor: () => {
    const { player } = get()
    if (!player) return
    const next = Math.min(5, player.currentFloor + 1)
    get().updatePlayer({
      currentFloor: next,
      highestFloor: Math.max(player.highestFloor, next),
      farmFloor: next,
    })
  },

  applyCombatResult: (result) => {
    if (!result.victory) return
    get().addExp(result.exp)
    get().addGold(result.gold)
    result.loot.forEach((item) => get().addItem(item))
    if (result.resources) get().addResources(result.resources)
  },

  applyDeathPenalty: () => {
    const { player } = get()
    if (!player) return
    const goldLoss = Math.floor(player.gold * 0.03)
    get().updatePlayer({ gold: Math.max(0, player.gold - goldLoss) })
  },

  claimIdleRewards: () => {
    const idle = get().idleReward
    if (!idle) return
    get().addGold(idle.gold)
    get().addExp(idle.exp)
    set({ idleReward: null })
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
    get().updatePlayer({
      currentHp: newHp,
      hpLastRegenAt: new Date(Date.now() - remainder).toISOString(),
    })
  },

  tryRegenVitals: () => {
    get().tryRegenEnergy()
    get().tryRegenHp()
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
    get().updatePlayer({
      classId, classSelected: true,
      stats: { ...classData.stats },
      statPoints: 0,
      allocatedStats: { atk: 0, hp: 0, def: 0, stealth: 0, endurance: 0 },
      skills: [classData.startingSkill],
      skillLevels: { [classData.startingSkill]: 1 },
      equipped,
      inventory: [],
      maxEnergy: BASE_MAX_ENERGY,
      currentHp: getCombatMaxHp({ ...get().player!, classId, stats: classData.stats, level: get().player!.level }),
      hpLastRegenAt: new Date().toISOString(),
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
    get().updatePlayer({ profession: professionId, professionLevels: { ...player.professionLevels, [professionId]: levels } })
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
      get().addGold(cost.gold)
      return false
    }
    levels[skillIndex] = (levels[skillIndex] ?? 0) + 1
    get().updatePlayer({ professionLevels: { ...player.professionLevels, [professionId]: levels } })
    return true
  },

  craftItem: (recipeId) => {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId)
    if (!recipe) return false
    const { player } = get()
    if (!player) return false
    if (recipe.requiredProfession && player.profession !== recipe.requiredProfession) return false
    if (recipe.requiredProfessionLevel) {
      const levels = player.professionLevels[recipe.requiredProfession!] ?? []
      if (levels.reduce((s, l) => s + l, 0) < recipe.requiredProfessionLevel) return false
    }
    if (!get().spendGold(recipe.goldCost)) return false
    if (!get().spendResources(recipe.resources)) return false
    const inst = createItemInstance(recipe.resultItemId)
    if (inst) get().addItem(inst)
    return !!inst
  },

  upgradeItemLevel: (item) => {
    const lvl = item.upgradeLevel ?? 1
    if (lvl >= 10) return null
    const cost = getUpgradeLevelCost(item)
    if (!get().spendGold(cost.gold)) return null
    if (!get().spendResources(cost.resources)) return null
    return { ...item, upgradeLevel: lvl + 1, name: item.name.replace(/ \+\d+$/, '') + ` +${lvl + 1}` }
  },

  upgradeItemStars: (item) => {
    const stars = item.starLevel ?? 0
    if (stars >= 10) return null
    const cost = getStarUpgradeCost(item)
    if (!get().spendGold(cost.gold)) return null
    if (!get().spendResources(cost.resources)) return null
    const starStr = '★'.repeat(stars + 1)
    return { ...item, starLevel: stars + 1, name: `${item.name.replace(/ ★+$/, '')} ${starStr}` }
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
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId)
    const { player } = get()
    if (!recipe || !player) return []
    return getMissingCosts(player, recipe.goldCost, recipe.resources, recipe)
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
      get().addGold(cost.gold)
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
    const needsUpdate = result.pendingGold > 0 || soldSet.size > 0
    if (!needsUpdate) return

    const updated = {
      ...player,
      gold: player.gold + result.pendingGold,
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
      default:
        return false
    }
    return true
  },
}))

function calculateIdle(player: Player): IdleReward | null {
  const minutes = Math.floor((Date.now() - new Date(player.lastOnlineAt).getTime()) / 60_000)
  if (minutes < 5) return null
  const capped = Math.min(minutes, 480)
  const floor = getFloorData(player.farmFloor)
  const gold = Math.floor((floor.idleGoldPerHour / 60) * capped * getGoldMultiplier(player))
  const exp = Math.floor((floor.idleExpPerHour / 60) * capped * getExpMultiplier(player))
  if (gold <= 0 && exp <= 0) return null
  return { gold, exp, minutes: capped }
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
