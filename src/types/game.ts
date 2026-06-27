export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type ItemSlot =
  | 'helmet' | 'chestplate' | 'leggings' | 'boots'
  | 'necklace' | 'ring' | 'weapon' | 'pet' | 'consumable'
export type EquipSlot = Exclude<ItemSlot, 'consumable'>
export type SkillId =
  | 'dual_blades' | 'sword_skill' | 'dash_strike' | 'healing_light'
  | 'power_slash' | 'whirlwind' | 'battle_cry' | 'executioner' | 'aether_rampage'
  | 'piercing_shot' | 'volley' | 'trap_shot' | 'headshot' | 'aether_rain'
  | 'fireball' | 'ice_lance' | 'chain_lightning' | 'arcane_orb' | 'aether_storm'
  | 'spirit_bolt' | 'summon_guardian' | 'draining_touch' | 'group_heal' | 'aether_avatar'
  | 'backstab' | 'poison_dagger' | 'smoke_bomb' | 'lethal_strike' | 'aether_blade'
  | 'shield_bash' | 'holy_smite' | 'iron_fortress' | 'judgment' | 'aether_aegis'
export type EnemyPattern = 'aggressive' | 'defensive' | 'berserker' | 'boss'
export type PlayerClass = 'warrior' | 'archer' | 'mage' | 'summoner' | 'assassin' | 'knight'
export type ProfessionId = 'blacksmith' | 'alchemist' | 'hunter' | 'jeweler' | 'sorcerer'
export type ResourceId =
  | 'iron_ore' | 'herb' | 'hide' | 'meat' | 'gem_shard' | 'mana_crystal'
  | 'aether_dust' | 'star_shard' | 'upgrade_core'
  | 'stone_chunk' | 'gold_ore' | 'raw_diamond' | 'mithril_ore' | 'adamantite'
  | 'sulfur' | 'rare_spice' | 'abyssal_pearl'
  | 'herb_mint' | 'herb_lotus' | 'herb_phoenix' | 'herb_void'
  | 'fish_minnow' | 'fish_bream' | 'fish_carp' | 'fish_perch' | 'fish_trout'
  | 'fish_salmon' | 'fish_pike' | 'fish_tuna' | 'fish_cod' | 'fish_eel'
  | 'fish_crab' | 'fish_lobster' | 'fish_squid' | 'fish_swordfish' | 'fish_aether_koi'
  | 'fishing_junk'

export type EffectStat = 'atk' | 'def' | 'hp' | 'crit' | 'speed' | 'all'

export interface ActiveEffect {
  id: string
  label: string
  type: 'buff' | 'debuff'
  stat: EffectStat
  mult: number
  until: string
}

export interface Resource {
  id: ResourceId
  name: string
  nameRu: string
  icon: string
}

export interface MarketListing {
  id: string
  sellerId?: number
  sellerName: string
  item?: Item
  resourceId?: ResourceId
  resourceAmount?: number
  goldPrice: number
  isPlayerListing?: boolean
}

export interface CraftRecipe {
  id: string
  resultItemId: string
  name: string
  description: string
  resources: Partial<Record<ResourceId, number>>
  goldCost: number
  requiredProfession?: ProfessionId
  requiredProfessionLevel?: number
  isSetCraft?: boolean
  isMythicCraft?: boolean
  requiresMaxUpgrade?: boolean
  setCraftRarity?: 'epic' | 'legendary' | 'lucky'
  sourceInstanceId?: string
  requiredClass?: PlayerClass
}

export interface ProfessionSkill {
  id: string
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  maxLevel: number
  goldCostPerLevel: number
  resourceCostPerLevel?: Partial<Record<ResourceId, number>>
}

export interface Profession {
  id: ProfessionId
  name: string
  nameRu: string
  icon: string
  description: string
  descriptionRu: string
  skills: ProfessionSkill[]
}

export type AllocStatKey = 'atk' | 'hp' | 'def' | 'stealth' | 'endurance'

export interface AllocatedStats {
  atk: number
  hp: number
  def: number
  stealth: number
  endurance: number
}

export interface Stats {
  atk: number
  def: number
  hp: number
  crit: number
  speed: number
}

export interface ClassData {
  id: PlayerClass
  name: string
  nameRu: string
  icon: string
  description: string
  descriptionRu: string
  stats: Stats
  startingSkill: SkillId
  startingWeaponId: string
}

export interface Item {
  id: string
  instanceId?: string
  name: string
  description: string
  slot: ItemSlot
  rarity: ItemRarity
  stats: Partial<Stats>
  icon: string
  sellPrice: number
  upgradeLevel?: number
  starLevel?: number
  setId?: string
  setName?: string
  tier?: number
  durability?: number
  maxDurability?: number
}

export interface Skill {
  id: SkillId
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  damageMultiplier: number
  cooldown: number
  energyCost: number
  icon: string
  healPercent: number
}

export interface EquippedItems {
  helmet: Item | null
  chestplate: Item | null
  leggings: Item | null
  boots: Item | null
  necklace: Item | null
  ring: Item | null
  weapon: Item | null
  pet: Item | null
}

export interface FloorEnemy {
  id: string
  name: string
  pattern: EnemyPattern
  stats: Stats
  expReward: number
  goldReward: [number, number]
  lootTable: string[]
  isBoss?: boolean
  isEpic?: boolean
}

export interface FloorData {
  floor: number
  name: string
  description: string
  theme: string
  enemies: FloorEnemy[]
  boss: FloorEnemy
  mobsRequired: number
  idleGoldPerHour: number
  idleExpPerHour: number
}

export interface Player {
  telegramId: number
  username: string
  displayName: string
  avatarUrl?: string
  level: number
  exp: number
  gold: number
  gems: number
  energy: number
  maxEnergy: number
  currentFloor: number
  highestFloor: number
  farmFloor: number
  floorMobKills: Record<number, number>
  stats: Stats
  statPoints: number
  allocatedStats: AllocatedStats
  equipped: EquippedItems
  inventory: Item[]
  skills: SkillId[]
  skillLevels: Partial<Record<SkillId, number>>
  tutorialCompleted: boolean
  dailyRewardClaimedAt?: string
  dailyRewardStreak: number
  referralCode: string
  referredBy?: string
  partyId?: string
  guildId?: string
  lastOnlineAt: string
  totalPlayTime: number
  pvpWins: number
  pvpLosses: number
  classId?: PlayerClass
  classSelected: boolean
  profession?: ProfessionId
  activeProfessions?: ProfessionId[]
  professionSlotLimit?: number
  professionExp?: Partial<Record<ProfessionId, number>>
  unlockedSetScrolls?: string[]
  ownedTools?: string[]
  mineLevel?: number
  mineDigXp?: number
  fieldLevel?: number
  fieldGatherXp?: number
  huntLevel?: number
  huntXp?: number
  gemSiteLevel?: number
  gemSiteXp?: number
  aetherRiftLevel?: number
  aetherRiftXp?: number
  fishingSpotLevel?: number
  fishingSpotXp?: number
  fishCaughtTotal?: number
  professionLevels: Partial<Record<ProfessionId, number[]>>
  professionMythicLevels: Partial<Record<ProfessionId, number[]>>
  resources: Partial<Record<ResourceId, number>>
  marketListings: MarketListing[]
  energyLastRegenAt?: string
  currentHp?: number
  hpLastRegenAt?: string
  currentMana?: number
  maxMana?: number
  manaLastRegenAt?: string
  expEasterEggClaimed?: boolean
  underwearEasterEggClaimed?: boolean
  bankBalance?: number
  bankLastInterestAt?: string
  bankPendingInterest?: number
  buffInfiniteEnergyUntil?: string
  buffDoubleExpUntil?: string
  buffTripleGoldUntil?: string
  buffDailyBonusUntil?: string
  buffFateGoldUntil?: string
  buffFateExpUntil?: string
  fateCardLastUsedAt?: string
  auraEffectId?: string
  cosmeticAvatarId?: string
  profileFrameId?: string
  unlockedCosmetics?: string[]
  deathDebuffUntil?: string
  lastKilledBy?: string
  friendIds?: number[]
  activeEffects?: ActiveEffect[]
  fairStats?: FairGameStats
  questState?: QuestState
  guildJoinedAt?: string
  monthlyStats?: MonthlyStats
  monthlyRewardsClaimed?: string[]
  notificationSettings?: NotificationSettings
  petLastRewardAt?: string
  saveVersion?: number
}

export interface MonthlyStats {
  monthKey: string
  goldEarned: number
  mobsKilled: number
  fishCaught: number
  highestFloor: number
}

export interface NotificationSettings {
  hpFull: boolean
  energyFull: boolean
  manaFull: boolean
  petReward?: boolean
}

export interface MonthlyLeaderboardEntry {
  rank: number
  telegramId: number
  displayName: string
  username: string
  value: number
}

export interface MonthlyLeaderboardCategory {
  categoryId: string
  nameRu: string
  icon: string
  entries: MonthlyLeaderboardEntry[]
}

export interface MonthlyLeaderboardResponse {
  monthKey: string
  categories: MonthlyLeaderboardCategory[]
}

export interface FairGameStats {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  goldWon: number
  goldLost: number
}

export type QuestEvent =
  | 'kill_mob' | 'win_combat' | 'fish' | 'mine' | 'cook' | 'pvp_win' | 'advance_floor'

export interface QuestDef {
  id: string
  scope: 'daily' | 'weekly' | 'guild'
  nameRu: string
  descriptionRu: string
  event: QuestEvent
  target: number
  rewards: { gold?: number; gems?: number; resources?: Partial<Record<ResourceId, number>> }
}

export interface QuestState {
  dailyDate: string
  dailyProgress: Record<string, number>
  dailyClaimed: string[]
  weeklyKey: string
  weeklyProgress: Record<string, number>
  weeklyClaimed: string[]
  guildClaimed: string[]
  weeklyFloorBaseline?: number
}

export interface GuildGiftPayload {
  id: string
  fromId: number
  fromName: string
  item: Item
  sentAt: string
}

export interface GuildChatMessage {
  id: string
  senderId: number
  senderName: string
  text: string
  timestamp: string
}

export interface CombatLogEntry {
  text: string
  type: 'player' | 'enemy' | 'crit' | 'skill' | 'heal' | 'system'
}

export interface CombatState {
  enemy: FloorEnemy
  playerHp: number
  playerMaxHp: number
  enemyHp: number
  enemyMaxHp: number
  combo: number
  skillCooldowns: Partial<Record<SkillId, number>>
  isBoss: boolean
  floor: number
  combatLog: CombatLogEntry[]
  turn: number
  enemyCombat?: import('@/lib/enemyCombat').EnemyCombatState
  isPvp?: boolean
  pvpOpponentId?: number
  isEpic?: boolean
}

export interface CombatResult {
  victory: boolean
  exp: number
  gold: number
  loot: Item[]
  resources: Partial<Record<ResourceId, number>>
  comboMax: number
  isBoss?: boolean
  lootClaimed?: boolean
  mobKilled?: boolean
  killedBy?: string
  fled?: boolean
  isEpic?: boolean
}

export interface GuildMember {
  telegramId: number
  username: string
  displayName: string
  level: number
  floor: number
  role: 'leader' | 'officer' | 'member'
  online: boolean
}

export interface Guild {
  id: string
  name: string
  tag: string
  level: number
  members: GuildMember[]
  description: string
}

export interface PartyMember {
  telegramId: number
  displayName: string
  level: number
  hp: number
  maxHp: number
  ready: boolean
}

export interface LeaderboardEntry {
  rank: number
  telegramId: number
  username: string
  displayName: string
  floor: number
  level: number
  guildId?: string
  isFriend?: boolean
}

export interface PublicPlayerProfile {
  telegramId: number
  displayName: string
  username: string
  level: number
  highestFloor: number
  classId?: PlayerClass
  stats: { atk: number; def: number; hp: number; crit: number; speed: number }
  equipped: Array<{ slot: string; name: string; rarity: ItemRarity }>
  cosmeticAvatarId?: string
  profileFrameId?: string
  pvpWins: number
  pvpLosses: number
  guildId?: string
  monthlyStats?: MonthlyStats
}

export interface ShopItem {
  id: string
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  type: 'cosmetic' | 'consumable' | 'convenience' | 'equipment' | 'tool' | 'scroll' | 'resource'
  goldPrice?: number
  gemsPrice?: number
  starsPrice?: number
  icon: string
  itemId?: string
  toolId?: string
  scrollId?: string
  bundleCount?: number
  resourceBundle?: Partial<Record<ResourceId, number>>
}

export interface IdleReward {
  gold: number
  exp: number
  minutes: number
}

export interface DailyReward {
  day: number
  gold: number
  gems: number
  itemId?: string
}
