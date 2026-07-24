export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine'
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
export type UniversalSkillId =
  | 'u_fury' | 'u_tough_skin' | 'u_quick_step'
  | 'u_crit_strike' | 'u_regeneration' | 'u_shield'
  | 'u_whirlwind' | 'u_concentration' | 'u_reflect'
  | 'u_berserk' | 'u_barrier' | 'u_sharp_eye'
  | 'u_flash' | 'u_vampirism' | 'u_steadfastness'
  | 'u_chain_lightning' | 'u_healing' | 'u_invulnerability'
  | 'u_dragon_fury' | 'u_mirror' | 'u_speed_boost'
  | 'u_rupture' | 'u_recovery' | 'u_aura'
  | 'u_apocalypse' | 'u_immortality' | 'u_spirit_strength'
  | 'u_blood_dance' | 'u_absolute_defense' | 'u_life_energy'
  | 'u_star_burst' | 'u_eternal_regen' | 'u_absolute_shield'
  | 'u_godlike_strength' | 'u_reality_rift' | 'u_divine_healing'
  | 'u_skill_copy' | 'u_time_slow' | 'u_final_strike'
export type EnemyPattern = 'aggressive' | 'defensive' | 'berserker' | 'boss'
export type PlayerClass =
  | 'warrior' | 'paladin' | 'hunter' | 'rogue' | 'priest'
  | 'shaman' | 'mage' | 'warlock' | 'druid' | 'monk'
export type PlayerRace = 'human' | 'dwarf' | 'night_elf' | 'orc' | 'undead' | 'troll' | 'blood_elf'
export type ProfessionId = 'blacksmith' | 'alchemist' | 'hunter' | 'jeweler' | 'sorcerer'
export type ResourceId =
  | 'iron_ore' | 'herb' | 'hide' | 'meat' | 'gem_shard' | 'mana_crystal'
  | 'aether_dust' | 'star_shard' | 'upgrade_core'
  | 'stone_chunk' | 'gold_ore' | 'raw_diamond' | 'mithril_ore' | 'adamantite'
  | 'sulfur' | 'rare_spice' | 'abyssal_pearl'
  | 'herb_mint' | 'herb_lotus' | 'herb_phoenix' | 'herb_void'
  | 'fish_minnow' | 'fish_bream' | 'fish_carp' | 'fish_perch' | 'fish_trout'
  | 'fish_salmon' | 'fish_pike' | 'fish_tuna' | 'fish_cod' | 'fish_eel'
  | 'fish_crab' | 'fish_lobster' | 'fish_squid' | 'fish_swordfish'   | 'fish_aether_koi'
  | 'fishing_junk'
  | 'jewel_ruby' | 'jewel_sapphire' | 'jewel_emerald' | 'jewel_topaz' | 'jewel_amethyst'
  | 'jewel_onyx' | 'jewel_opal' | 'jewel_jade' | 'jewel_garnet' | 'jewel_diamond'
  | 'wood_plank'
  | 'industrial_gas' | 'aura_ore' | 'goodnes_ore' | 'dark_ore' | 'maximit_ore'
  | 'element_water' | 'element_fire' | 'element_air' | 'element_earth'

export type ElementalBuffId =
  | 'inferno_strike' | 'tidal_edge' | 'gale_fury' | 'stonebreaker' | 'steam_burst'
  | 'lightning_arc' | 'frozen_heart' | 'magma_core' | 'storm_lance' | 'world_sunder'

export interface ElementalWeaponBuff {
  id: ElementalBuffId
  level: number
}

export type SocketGemId =
  | 'ruby' | 'sapphire' | 'emerald' | 'topaz' | 'amethyst'
  | 'onyx' | 'opal' | 'jade' | 'garnet' | 'diamond'

export interface ProductionJob {
  id: string
  machineId: import('@/data/production').ProductionMachineId
  startedAt: string
  readyAt: string
  amount: number
}

export interface ProductionState {
  generators: Partial<Record<import('@/data/production').EnergyGeneratorId, number>>
  machines: Partial<Record<import('@/data/production').ProductionMachineId, number>>
  energyStored: number
  lastTickAt: string
  jobs: ProductionJob[]
}

export interface NurseryState {
  stage: number
  feedProgress: number
}

export interface ActiveBrew {
  recipeId: string
  readyAt: string
}

export interface GemStudyEntry {
  gemId: SocketGemId
  readyAt: string
}

export interface CityPlacedBuilding {
  buildingId: string
  x: number
  y: number
  level: number
  builtAt: string
  /** Initial build or upgrade completion time */
  readyAt?: string
  /** Target level while upgrade is in progress */
  pendingLevel?: number
}

export interface CityState {
  buildings: CityPlacedBuilding[]
  pendingPassive: Partial<Record<ResourceId, number>>
  passiveLastTickAt: string
}

export interface SecretCaveState {
  floor: number
  digsRemaining: number
  maxDigs: number
  rewards: Array<{
    resources: Partial<Record<ResourceId, number>>
    gold: number
    itemId?: string
    chestFound: boolean
  }>
  chestFound: boolean
  claimedIndices: number[]
}

export type PortalType = 'blue' | 'red'

export interface PendingPortalState {
  type: PortalType
  floor: number
}

export interface PortalRunProgress {
  type: PortalType
  floor: number
  mobsKilled: number
  mobsRequired: number
  bossDefeated: boolean
  accumulatedExp: number
  accumulatedGold: number
  accumulatedLoot: Item[]
  accumulatedResources: Partial<Record<ResourceId, number>>
}

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
  setCraftRarity?: 'epic' | 'legendary' | 'lucky' | 'mythic'
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
  stealth?: number
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
  allowedRaces: PlayerRace[] | 'all'
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
  socketedGems?: SocketGemId[]
  supremeEnchantId?: string
  requiredClass?: PlayerClass
  /** Raid boss exclusive — not sold or crafted */
  raidExclusive?: boolean
  exclusiveFloor?: number
  elementalBuffs?: ElementalWeaponBuff[]
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
  isMiniBoss?: boolean
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

export interface StockLimitOrder {
  id: string
  symbolId: string
  side: 'buy' | 'sell'
  limitPrice: number
  shares: number
  createdAt: string
}

export interface StockQuote {
  symbolId: string
  price: number
  change24h: number
  change7d: number
  history7d: number[]
  dividendRateDaily: number
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
  floorMiniBossKills: Record<number, number>
  stats: Stats
  statPoints: number
  allocatedStats: AllocatedStats
  equipped: EquippedItems
  inventory: Item[]
  skills: SkillId[]
  skillLevels: Partial<Record<SkillId, number>>
  universalSkillLevels?: Partial<Record<UniversalSkillId, number>>
  tutorialCompleted: boolean
  dailyRewardClaimedAt?: string
  dailyRewardStreak: number
  referralCode: string
  referredBy?: string
  lifetimeGoldEarned?: number
  referralInvites?: ReferralInviteSummary[]
  referralEarnings?: ReferralEarnings
  referralUncollected?: ReferralUncollected
  ownedPropertyId?: string
  propertyPurchasePrice?: number
  partyId?: string
  guildId?: string
  lastOnlineAt: string
  totalPlayTime: number
  pvpWins: number
  pvpLosses: number
  /** Золото, заработанное победами на арене */
  pvpGoldEarned?: number
  /** Бои на арене за текущий день (UTC) */
  arenaFightsToday?: number
  arenaDayKey?: string
  arenaLastFightAt?: string
  classId?: PlayerClass
  classSelected: boolean
  secondaryClassId?: PlayerClass
  raceId?: PlayerRace
  raceSelected: boolean
  racialCooldownUntil?: string
  racialStealthTurns?: number
  racialBerserkTurns?: number
  pendingCannibalize?: boolean
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
  gothicDamEasterEggClaimed?: boolean
  bankBalance?: number
  bankLastInterestAt?: string
  bankPendingInterest?: number
  stockPortfolio?: Record<string, { shares: number; avgCost: number }>
  stockPendingDividends?: number
  stockLastDividendAt?: string
  stockLimitOrders?: StockLimitOrder[]
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
  welcomeShown?: boolean
  redeemedPromoCodes?: string[]
  buffPromoGoldUntil?: string
  buffPromoGoldMult?: number
  monthlyStats?: MonthlyStats
  monthlyRewardsClaimed?: string[]
  achievementsClaimed?: string[]
  bossTrophies?: string[]
  worldBossLastKillAt?: string
  /** Индекс спавна (каждые 3 дня), в котором игрок уже победил босса */
  worldBossLastSpawnIndex?: number
  worldBossKills?: number
  unlockedTitles?: string[]
  profileTitleId?: string
  achievementBonuses?: import('@/lib/achievementBonuses').AchievementBonuses
  /** Future on-chain state — wallets, NFT bridge; see src/lib/crypto */
  cryptoState?: import('@/lib/crypto').PlayerCryptoState
  notificationSettings?: NotificationSettings
  petLastRewardAt?: string
  vipLevel?: number
  socketGems?: Partial<Record<SocketGemId, number>>
  socketGemLevels?: Partial<Record<SocketGemId, number>>
  activeBrews?: ActiveBrew[]
  pendingSecretCave?: SecretCaveState | null
  pendingPortal?: PendingPortalState | null
  portalRun?: PortalRunProgress | null
  activeRaidId?: string | null
  raidProgress?: Record<string, import('@/lib/raidProgress').RaidProgress>
  raidDeathCooldowns?: Record<string, string>
  completedRaids?: string[]
  cityState?: CityState
  studiedGems?: SocketGemId[]
  activeGemStudies?: GemStudyEntry[]
  productionState?: ProductionState
  nurseryState?: NurseryState
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

export interface ReferralInviteSummary {
  refereeId: number
  displayName: string
  joinedAt: string
  signupRewarded: boolean
  lifetimeGoldEarned: number
  milestoneCount: number
  activated: boolean
}

export interface ReferralEarnings {
  signupGold: number
  milestoneGold: number
  gems: number
  items: number
}

export interface ReferralUncollected {
  gold: number
  gems: number
  items: number
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
  skillCooldowns: Partial<Record<SkillId | UniversalSkillId, number>>
  isBoss: boolean
  floor: number
  combatLog: CombatLogEntry[]
  turn: number
  enemyCombat?: import('@/lib/enemyCombat').EnemyCombatState
  isPvp?: boolean
  pvpOpponentId?: number
  pvpOpponentGold?: number
  isEpic?: boolean
  isMiniBoss?: boolean
  bossPhase?: 1 | 2
  isWorldBoss?: boolean
  isRaid?: boolean
  raidId?: string
  isPortal?: boolean
  portalType?: PortalType
  weakSpotUsed?: boolean
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
  isMiniBoss?: boolean
  isWorldBoss?: boolean
  isRaid?: boolean
  raidId?: string
  raidComplete?: boolean
  isPortal?: boolean
  portalComplete?: boolean
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

export type PlayerRankId = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+'

export interface LeaderboardEntry {
  rank: number
  telegramId: number
  username: string
  displayName: string
  floor: number
  level: number
  guildId?: string
  isFriend?: boolean
  playerRank?: PlayerRankId
}

export interface PublicPlayerProfile {
  telegramId: number
  displayName: string
  username: string
  playerRank?: PlayerRankId
  level: number
  highestFloor: number
  classId?: PlayerClass
  gold: number
  gems: number
  stats: { atk: number; def: number; hp: number; crit: number; speed: number }
  equipped: Array<{ slot: string; name: string; rarity: ItemRarity; setId?: string }>
  activeSets: Array<{ name: string; description: string }>
  cosmeticAvatarId?: string
  profileFrameId?: string
  profileTitleId?: string
  pvpWins: number
  pvpLosses: number
  pvpGoldEarned?: number
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
