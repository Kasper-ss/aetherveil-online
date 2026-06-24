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
  | 'iron_ore' | 'herb' | 'hide' | 'gem_shard' | 'mana_crystal'
  | 'aether_dust' | 'star_shard' | 'upgrade_core'

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
  setCraftRarity?: 'epic' | 'legendary'
  sourceInstanceId?: string
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
  professionLevels: Partial<Record<ProfessionId, number[]>>
  professionMythicLevels: Partial<Record<ProfessionId, number[]>>
  resources: Partial<Record<ResourceId, number>>
  marketListings: MarketListing[]
  energyLastRegenAt?: string
  currentHp?: number
  hpLastRegenAt?: string
  expEasterEggClaimed?: boolean
  underwearEasterEggClaimed?: boolean
  bankBalance?: number
  bankLastInterestAt?: string
  buffInfiniteEnergyUntil?: string
  buffDoubleExpUntil?: string
  buffTripleGoldUntil?: string
  buffDailyBonusUntil?: string
  auraEffectId?: string
  cosmeticAvatarId?: string
  friendIds?: number[]
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
  isPvp?: boolean
  pvpOpponentId?: number
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

export interface ShopItem {
  id: string
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  type: 'cosmetic' | 'consumable' | 'convenience' | 'equipment'
  goldPrice?: number
  gemsPrice?: number
  starsPrice?: number
  icon: string
  itemId?: string
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
