import type { Player, ResourceId } from '@/types/game'
import { EMPTY_ALLOCATED } from '@/lib/playerStats'

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary' | 'secret'

export interface AchievementReward {
  gold?: number
  gems?: number
  statPoints?: number
  resources?: Partial<Record<ResourceId, number>>
  itemId?: string
  titleId?: string
  buff?: Partial<{ expPct: number; goldPct: number; lootPct: number; allStatsPct: number }>
}

export interface AchievementDef {
  id: string
  nameRu: string
  descriptionRu: string
  icon: string
  tier: AchievementTier
  secret?: boolean
  rewardPreviewRu: string
  reward: AchievementReward
  check: (player: Player) => boolean
  progress?: (player: Player) => { current: number; target: number } | null
}

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export function sumMobKills(player: Player): number {
  return Object.values(player.floorMobKills ?? {}).reduce((sum, n) => sum + n, 0)
}

export function totalAllocatedStats(player: Player): number {
  const a = { ...EMPTY_ALLOCATED, ...player.allocatedStats }
  return a.atk + a.hp + a.def + a.stealth + a.endurance
}

export function countEquippedSlots(player: Player): number {
  return EQUIP_SLOTS.filter((s) => player.equipped[s]).length
}

export function hasLegendaryUnderwear(player: Player): boolean {
  if (player.underwearEasterEggClaimed) return true
  if (player.inventory.some((i) => i.id === 'legendary_underwear')) return true
  if (player.equipped.leggings?.id === 'legendary_underwear') return true
  return false
}

export function maxItemUpgradeLevel(player: Player): number {
  let max = 0
  for (const item of [...player.inventory, ...EQUIP_SLOTS.map((s) => player.equipped[s]).filter(Boolean)]) {
    if (!item) continue
    max = Math.max(max, item.upgradeLevel ?? 1)
  }
  return max
}

export function maxItemStarLevel(player: Player): number {
  let max = 0
  for (const item of [...player.inventory, ...EQUIP_SLOTS.map((s) => player.equipped[s]).filter(Boolean)]) {
    if (!item) continue
    max = Math.max(max, item.starLevel ?? 0)
  }
  return max
}

function lvl(n: number) {
  return (p: Player) => p.level >= n
}

function floor(n: number) {
  return (p: Player) => p.highestFloor >= n
}

function kills(n: number) {
  return (p: Player) => sumMobKills(p) >= n
}

function pvp(n: number) {
  return (p: Player) => p.pvpWins >= n
}

function gold(n: number) {
  return (p: Player) => p.gold + (p.bankBalance ?? 0) >= n
}

function gems(n: number) {
  return (p: Player) => p.gems >= n
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_steps',
    nameRu: 'Первые шаги',
    descriptionRu: 'Завершить обучение.',
    icon: '📜',
    tier: 'bronze',
    rewardPreviewRu: '100 🪙',
    reward: { gold: 100 },
    check: (p) => p.tutorialCompleted,
  },
  {
    id: 'lvl_5',
    nameRu: 'Новичок',
    descriptionRu: 'Достичь 5 уровня.',
    icon: '⭐',
    tier: 'bronze',
    rewardPreviewRu: '150 🪙 · 1 💎',
    reward: { gold: 150, gems: 1 },
    check: lvl(5),
    progress: (p) => ({ current: p.level, target: 5 }),
  },
  {
    id: 'lvl_10',
    nameRu: 'Искатель',
    descriptionRu: 'Достичь 10 уровня.',
    icon: '⭐',
    tier: 'bronze',
    rewardPreviewRu: '300 🪙 · 2 💎',
    reward: { gold: 300, gems: 2 },
    check: lvl(10),
    progress: (p) => ({ current: p.level, target: 10 }),
  },
  {
    id: 'lvl_20',
    nameRu: 'Авантюрист',
    descriptionRu: 'Достичь 20 уровня.',
    icon: '🌟',
    tier: 'silver',
    rewardPreviewRu: '800 🪙 · 5 💎',
    reward: { gold: 800, gems: 5, resources: { herb: 10 } },
    check: lvl(20),
    progress: (p) => ({ current: p.level, target: 20 }),
  },
  {
    id: 'lvl_30',
    nameRu: 'Ветеран',
    descriptionRu: 'Достичь 30 уровня.',
    icon: '🌟',
    tier: 'gold',
    rewardPreviewRu: '2 000 🪙 · 10 💎 · титул',
    reward: { gold: 2000, gems: 10, titleId: 'veteran' },
    check: lvl(30),
    progress: (p) => ({ current: p.level, target: 30 }),
  },
  {
    id: 'lvl_50',
    nameRu: 'Легенда уровней',
    descriptionRu: 'Достичь 50 уровня.',
    icon: '💫',
    tier: 'legendary',
    rewardPreviewRu: '8 000 🪙 · 30 💎 · +3% EXP',
    reward: { gold: 8000, gems: 30, buff: { expPct: 0.03 } },
    check: lvl(50),
    progress: (p) => ({ current: p.level, target: 50 }),
  },
  {
    id: 'floor_3',
    nameRu: 'Восхождение',
    descriptionRu: 'Достичь 3-го этажа башни.',
    icon: '🏰',
    tier: 'bronze',
    rewardPreviewRu: '200 🪙',
    reward: { gold: 200 },
    check: floor(3),
    progress: (p) => ({ current: p.highestFloor, target: 3 }),
  },
  {
    id: 'floor_10',
    nameRu: 'Покоритель башни',
    descriptionRu: 'Достичь 10-го этажа.',
    icon: '🏰',
    tier: 'silver',
    rewardPreviewRu: '1 000 🪙 · 5 💎 · титул',
    reward: { gold: 1000, gems: 5, titleId: 'tower_climber' },
    check: floor(10),
    progress: (p) => ({ current: p.highestFloor, target: 10 }),
  },
  {
    id: 'floor_20',
    nameRu: 'Страж этажей',
    descriptionRu: 'Достичь 20-го этажа.',
    icon: '🗼',
    tier: 'gold',
    rewardPreviewRu: '2 500 🪙 · 12 💎',
    reward: { gold: 2500, gems: 12, resources: { upgrade_core: 2 } },
    check: floor(20),
    progress: (p) => ({ current: p.highestFloor, target: 20 }),
  },
  {
    id: 'floor_30',
    nameRu: 'Хозяин башни',
    descriptionRu: 'Достичь 30-го этажа.',
    icon: '🗼',
    tier: 'platinum',
    rewardPreviewRu: '5 000 🪙 · 20 💎 · +2% лут',
    reward: { gold: 5000, gems: 20, buff: { lootPct: 0.02 } },
    check: floor(30),
    progress: (p) => ({ current: p.highestFloor, target: 30 }),
  },
  {
    id: 'floor_50',
    nameRu: 'Вершина Эфира',
    descriptionRu: 'Достичь 50-го этажа.',
    icon: '👑',
    tier: 'legendary',
    rewardPreviewRu: '12 000 🪙 · 40 💎 · +3% ко всем статам',
    reward: { gold: 12000, gems: 40, buff: { allStatsPct: 0.03 } },
    check: floor(50),
    progress: (p) => ({ current: p.highestFloor, target: 50 }),
  },
  {
    id: 'kills_25',
    nameRu: 'Охотник',
    descriptionRu: 'Убить 25 мобов.',
    icon: '⚔️',
    tier: 'bronze',
    rewardPreviewRu: '120 🪙 · мясо',
    reward: { gold: 120, resources: { meat: 5 } },
    check: kills(25),
    progress: (p) => ({ current: sumMobKills(p), target: 25 }),
  },
  {
    id: 'kills_100',
    nameRu: 'Истребитель',
    descriptionRu: 'Убить 100 мобов.',
    icon: '⚔️',
    tier: 'silver',
    rewardPreviewRu: '600 🪙 · 3 💎',
    reward: { gold: 600, gems: 3 },
    check: kills(100),
    progress: (p) => ({ current: sumMobKills(p), target: 100 }),
  },
  {
    id: 'kills_500',
    nameRu: 'Палач',
    descriptionRu: 'Убить 500 мобов.',
    icon: '🗡️',
    tier: 'gold',
    rewardPreviewRu: '2 000 🪙 · +2% EXP',
    reward: { gold: 2000, gems: 8, buff: { expPct: 0.02 } },
    check: kills(500),
    progress: (p) => ({ current: sumMobKills(p), target: 500 }),
  },
  {
    id: 'kills_2000',
    nameRu: 'Погибель мобов',
    descriptionRu: 'Убить 2000 мобов.',
    icon: '💀',
    tier: 'legendary',
    rewardPreviewRu: '6 000 🪙 · 25 💎 · осколки',
    reward: { gold: 6000, gems: 25, resources: { star_shard: 3, aether_dust: 5 } },
    check: kills(2000),
    progress: (p) => ({ current: sumMobKills(p), target: 2000 }),
  },
  {
    id: 'pvp_first',
    nameRu: 'Первая дуэль',
    descriptionRu: 'Одержать первую победу на арене.',
    icon: '🛡️',
    tier: 'bronze',
    rewardPreviewRu: '250 🪙',
    reward: { gold: 250 },
    check: pvp(1),
    progress: (p) => ({ current: p.pvpWins, target: 1 }),
  },
  {
    id: 'pvp_10',
    nameRu: 'Боец арены',
    descriptionRu: '10 побед на арене.',
    icon: '🥊',
    tier: 'silver',
    rewardPreviewRu: '800 🪙 · 4 💎',
    reward: { gold: 800, gems: 4 },
    check: pvp(10),
    progress: (p) => ({ current: p.pvpWins, target: 10 }),
  },
  {
    id: 'pvp_25',
    nameRu: 'Дуэлянт',
    descriptionRu: '25 побед на арене.',
    icon: '🏆',
    tier: 'gold',
    rewardPreviewRu: '2 000 🪙 · титул',
    reward: { gold: 2000, gems: 10, titleId: 'duelist' },
    check: pvp(25),
    progress: (p) => ({ current: p.pvpWins, target: 25 }),
  },
  {
    id: 'pvp_50',
    nameRu: 'Чемпион арены',
    descriptionRu: '50 побед на арене.',
    icon: '👑',
    tier: 'platinum',
    rewardPreviewRu: '4 000 🪙 · 18 💎 · +2% золота',
    reward: { gold: 4000, gems: 18, buff: { goldPct: 0.02 } },
    check: pvp(50),
    progress: (p) => ({ current: p.pvpWins, target: 50 }),
  },
  {
    id: 'gold_2500',
    nameRu: 'Кошелёк полон',
    descriptionRu: 'Накопить 2 500 золота (включая банк).',
    icon: '🪙',
    tier: 'bronze',
    rewardPreviewRu: '100 🪙 · 1 💎',
    reward: { gold: 100, gems: 1 },
    check: gold(2500),
    progress: (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 2500 }),
  },
  {
    id: 'gold_15000',
    nameRu: 'Богач',
    descriptionRu: 'Накопить 15 000 золота.',
    icon: '💰',
    tier: 'silver',
    rewardPreviewRu: '500 🪙 · 5 💎',
    reward: { gold: 500, gems: 5 },
    check: gold(15000),
    progress: (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 15000 }),
  },
  {
    id: 'gold_50000',
    nameRu: 'Золотой магнат',
    descriptionRu: 'Накопить 50 000 золота.',
    icon: '🏦',
    tier: 'gold',
    rewardPreviewRu: '1 500 🪙 · +2% золота',
    reward: { gold: 1500, gems: 12, buff: { goldPct: 0.02 } },
    check: gold(50000),
    progress: (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 50000 }),
  },
  {
    id: 'gems_25',
    nameRu: 'Коллекционер кристаллов',
    descriptionRu: 'Иметь 25 гемов.',
    icon: '💎',
    tier: 'silver',
    rewardPreviewRu: '3 💎 · руда',
    reward: { gems: 3, resources: { iron_ore: 10 } },
    check: gems(25),
    progress: (p) => ({ current: p.gems, target: 25 }),
  },
  {
    id: 'gems_100',
    nameRu: 'Сокровищница',
    descriptionRu: 'Иметь 100 гемов.',
    icon: '💠',
    tier: 'platinum',
    rewardPreviewRu: '10 💎 · ядра улучшения',
    reward: { gems: 10, resources: { upgrade_core: 3 } },
    check: gems(100),
    progress: (p) => ({ current: p.gems, target: 100 }),
  },
  {
    id: 'bank_5000',
    nameRu: 'Вкладчик',
    descriptionRu: 'Положить 5 000 золота в банк.',
    icon: '🏛️',
    tier: 'silver',
    rewardPreviewRu: '400 🪙 · 2% банка',
    reward: { gold: 400, gems: 3 },
    check: (p) => (p.bankBalance ?? 0) >= 5000,
    progress: (p) => ({ current: p.bankBalance ?? 0, target: 5000 }),
  },
  {
    id: 'daily_streak_3',
    nameRu: 'Прилежный',
    descriptionRu: 'Серия ежедневных наград 3 дня.',
    icon: '📅',
    tier: 'bronze',
    rewardPreviewRu: '200 🪙',
    reward: { gold: 200 },
    check: (p) => p.dailyRewardStreak >= 3,
    progress: (p) => ({ current: p.dailyRewardStreak, target: 3 }),
  },
  {
    id: 'daily_streak_7',
    nameRu: 'Постоянство',
    descriptionRu: 'Серия ежедневных наград 7 дней.',
    icon: '📆',
    tier: 'silver',
    rewardPreviewRu: '600 🪙 · 4 💎',
    reward: { gold: 600, gems: 4 },
    check: (p) => p.dailyRewardStreak >= 7,
    progress: (p) => ({ current: p.dailyRewardStreak, target: 7 }),
  },
  {
    id: 'daily_streak_14',
    nameRu: 'Верность Эфиру',
    descriptionRu: 'Серия ежедневных наград 14 дней.',
    icon: '🗓️',
    tier: 'gold',
    rewardPreviewRu: '1 500 🪙 · 8 💎',
    reward: { gold: 1500, gems: 8 },
    check: (p) => p.dailyRewardStreak >= 14,
    progress: (p) => ({ current: p.dailyRewardStreak, target: 14 }),
  },
  {
    id: 'prof_first',
    nameRu: 'Ремесленник',
    descriptionRu: 'Активировать первую профессию.',
    icon: '🔨',
    tier: 'bronze',
    rewardPreviewRu: '150 🪙 · ресурсы',
    reward: { gold: 150, resources: { iron_ore: 5, herb: 5 } },
    check: (p) => (p.activeProfessions?.length ?? 0) >= 1,
  },
  {
    id: 'prof_dual',
    nameRu: 'Универсал',
    descriptionRu: 'Активировать 2 профессии одновременно.',
    icon: '⚒️',
    tier: 'silver',
    rewardPreviewRu: '500 🪙 · 3 💎',
    reward: { gold: 500, gems: 3 },
    check: (p) => (p.activeProfessions?.length ?? 0) >= 2,
  },
  {
    id: 'mine_100',
    nameRu: 'Шахтёр',
    descriptionRu: 'Набрать 100 XP в шахте.',
    icon: '⛏️',
    tier: 'bronze',
    rewardPreviewRu: '200 🪙 · руда',
    reward: { gold: 200, resources: { iron_ore: 8 } },
    check: (p) => (p.mineDigXp ?? 0) >= 100,
    progress: (p) => ({ current: p.mineDigXp ?? 0, target: 100 }),
  },
  {
    id: 'mine_500',
    nameRu: 'Мастер кузни',
    descriptionRu: 'Набрать 500 XP в шахте.',
    icon: '⛏️',
    tier: 'gold',
    rewardPreviewRu: '1 200 🪙 · титул',
    reward: { gold: 1200, gems: 6, titleId: 'master_smith' },
    check: (p) => (p.mineDigXp ?? 0) >= 500,
    progress: (p) => ({ current: p.mineDigXp ?? 0, target: 500 }),
  },
  {
    id: 'field_100',
    nameRu: 'Травник',
    descriptionRu: 'Набрать 100 XP на поле трав.',
    icon: '🌿',
    tier: 'bronze',
    rewardPreviewRu: '200 🪙 · травы',
    reward: { gold: 200, resources: { herb_mint: 5, herb: 10 } },
    check: (p) => (p.fieldGatherXp ?? 0) >= 100,
    progress: (p) => ({ current: p.fieldGatherXp ?? 0, target: 100 }),
  },
  {
    id: 'field_500',
    nameRu: 'Мудрый алхимик',
    descriptionRu: 'Набрать 500 XP на поле трав.',
    icon: '🧪',
    tier: 'gold',
    rewardPreviewRu: '1 200 🪙 · титул',
    reward: { gold: 1200, gems: 6, titleId: 'alchemist_sage' },
    check: (p) => (p.fieldGatherXp ?? 0) >= 500,
    progress: (p) => ({ current: p.fieldGatherXp ?? 0, target: 500 }),
  },
  {
    id: 'fish_15',
    nameRu: 'Рыболов',
    descriptionRu: 'Поймать 15 рыб.',
    icon: '🎣',
    tier: 'bronze',
    rewardPreviewRu: '180 🪙 · наживка',
    reward: { gold: 180, resources: { meat: 5 } },
    check: (p) => (p.fishCaughtTotal ?? 0) >= 15,
    progress: (p) => ({ current: p.fishCaughtTotal ?? 0, target: 15 }),
  },
  {
    id: 'fish_75',
    nameRu: 'Рыбак-мастер',
    descriptionRu: 'Поймать 75 рыб.',
    icon: '🐟',
    tier: 'gold',
    rewardPreviewRu: '1 500 🪙 · титул',
    reward: { gold: 1500, gems: 8, titleId: 'master_fisher' },
    check: (p) => (p.fishCaughtTotal ?? 0) >= 75,
    progress: (p) => ({ current: p.fishCaughtTotal ?? 0, target: 75 }),
  },
  {
    id: 'hunt_200',
    nameRu: 'Егерь',
    descriptionRu: 'Набрать 200 XP в охотничьих угодьях.',
    icon: '🏹',
    tier: 'silver',
    rewardPreviewRu: '500 🪙 · трофеи',
    reward: { gold: 500, resources: { hide: 10, meat: 10 } },
    check: (p) => (p.huntXp ?? 0) >= 200,
    progress: (p) => ({ current: p.huntXp ?? 0, target: 200 }),
  },
  {
    id: 'gem_200',
    nameRu: 'Самоцветник',
    descriptionRu: 'Набрать 200 XP в кристальных рудниках.',
    icon: '💠',
    tier: 'silver',
    rewardPreviewRu: '500 🪙 · осколки',
    reward: { gold: 500, resources: { gem_shard: 8 } },
    check: (p) => (p.gemSiteXp ?? 0) >= 200,
    progress: (p) => ({ current: p.gemSiteXp ?? 0, target: 200 }),
  },
  {
    id: 'aether_200',
    nameRu: 'Чародей эфира',
    descriptionRu: 'Набрать 200 XP в эфирном разломе.',
    icon: '🔮',
    tier: 'silver',
    rewardPreviewRu: '500 🪙 · кристаллы маны',
    reward: { gold: 500, resources: { mana_crystal: 8 } },
    check: (p) => (p.aetherRiftXp ?? 0) >= 200,
    progress: (p) => ({ current: p.aetherRiftXp ?? 0, target: 200 }),
  },
  {
    id: 'tools_4',
    nameRu: 'Снабженец',
    descriptionRu: 'Купить 4 разных инструмента.',
    icon: '🧰',
    tier: 'bronze',
    rewardPreviewRu: '250 🪙',
    reward: { gold: 250 },
    check: (p) => (p.ownedTools?.length ?? 0) >= 4,
    progress: (p) => ({ current: p.ownedTools?.length ?? 0, target: 4 }),
  },
  {
    id: 'inventory_25',
    nameRu: 'Пакетёр',
    descriptionRu: 'Иметь 25 предметов в инвентаре.',
    icon: '🎒',
    tier: 'silver',
    rewardPreviewRu: '400 🪙',
    reward: { gold: 400 },
    check: (p) => p.inventory.length >= 25,
    progress: (p) => ({ current: p.inventory.length, target: 25 }),
  },
  {
    id: 'equip_6',
    nameRu: 'Экипирован',
    descriptionRu: 'Надеть 6 предметов экипировки.',
    icon: '🛡️',
    tier: 'bronze',
    rewardPreviewRu: '200 🪙',
    reward: { gold: 200 },
    check: (p) => countEquippedSlots(p) >= 6,
    progress: (p) => ({ current: countEquippedSlots(p), target: 6 }),
  },
  {
    id: 'equip_all',
    nameRu: 'Полный комплект',
    descriptionRu: 'Заполнить все 8 слотов экипировки.',
    icon: '✨',
    tier: 'gold',
    rewardPreviewRu: '1 000 🪙 · +2% лут',
    reward: { gold: 1000, gems: 5, buff: { lootPct: 0.02 } },
    check: (p) => countEquippedSlots(p) >= 8,
    progress: (p) => ({ current: countEquippedSlots(p), target: 8 }),
  },
  {
    id: 'upgrade_5',
    nameRu: 'Улучшатель',
    descriptionRu: 'Улучшить предмет до +5.',
    icon: '⬆️',
    tier: 'silver',
    rewardPreviewRu: '600 🪙 · ядро',
    reward: { gold: 600, resources: { upgrade_core: 2 } },
    check: (p) => maxItemUpgradeLevel(p) >= 5,
    progress: (p) => ({ current: maxItemUpgradeLevel(p), target: 5 }),
  },
  {
    id: 'stars_3',
    nameRu: 'Звёздный кузнец',
    descriptionRu: 'Прокачать предмет до 3 звёзд.',
    icon: '🌠',
    tier: 'gold',
    rewardPreviewRu: '1 500 🪙 · 6 💎',
    reward: { gold: 1500, gems: 6 },
    check: (p) => maxItemStarLevel(p) >= 3,
    progress: (p) => ({ current: maxItemStarLevel(p), target: 3 }),
  },
  {
    id: 'fair_5',
    nameRu: 'Игрок ярмарки',
    descriptionRu: 'Сыграть 5 игр на ярмарке.',
    icon: '🎡',
    tier: 'bronze',
    rewardPreviewRu: '300 🪙',
    reward: { gold: 300 },
    check: (p) => (p.fairStats?.gamesPlayed ?? 0) >= 5,
    progress: (p) => ({ current: p.fairStats?.gamesPlayed ?? 0, target: 5 }),
  },
  {
    id: 'fair_win_3',
    nameRu: 'Везунчик',
    descriptionRu: 'Выиграть 3 игры на ярмарке.',
    icon: '🎲',
    tier: 'silver',
    rewardPreviewRu: '800 🪙 · титул',
    reward: { gold: 800, gems: 4, titleId: 'lucky_one' },
    check: (p) => (p.fairStats?.gamesWon ?? 0) >= 3,
    progress: (p) => ({ current: p.fairStats?.gamesWon ?? 0, target: 3 }),
  },
  {
    id: 'stat_master',
    nameRu: 'Распределитель',
    descriptionRu: 'Вложить 20 очков характеристик.',
    icon: '📊',
    tier: 'silver',
    rewardPreviewRu: '3 очка характеристик',
    reward: { statPoints: 3 },
    check: (p) => totalAllocatedStats(p) >= 20,
    progress: (p) => ({ current: totalAllocatedStats(p), target: 20 }),
  },
  {
    id: 'monthly_gold_5k',
    nameRu: 'Заработок месяца',
    descriptionRu: 'Заработать 5 000 золота за текущий месяц.',
    icon: '📈',
    tier: 'gold',
    rewardPreviewRu: '1 000 🪙 · 5 💎',
    reward: { gold: 1000, gems: 5 },
    check: (p) => (p.monthlyStats?.goldEarned ?? 0) >= 5000,
    progress: (p) => ({ current: p.monthlyStats?.goldEarned ?? 0, target: 5000 }),
  },
  {
    id: 'keeper_ancient_traditions',
    nameRu: 'Хранитель Древних Традиций',
    descriptionRu: 'Найти легендарные трусы неуязвимости.',
    icon: '🩲',
    tier: 'secret',
    secret: true,
    rewardPreviewRu: 'Перманентный бафф · редкие ресурсы · эксклюзив · титул',
    reward: {
      gold: 10000,
      gems: 50,
      titleId: 'keeper_ancient_traditions',
      itemId: 'keeper_medallion',
      resources: { star_shard: 5, aether_dust: 8, abyssal_pearl: 3, raw_diamond: 2 },
      buff: { expPct: 0.08, goldPct: 0.08, lootPct: 0.08, allStatsPct: 0.05 },
    },
    check: hasLegendaryUnderwear,
  },
]

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<string, AchievementDef>

export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
  platinum: 'Платина',
  legendary: 'Легенда',
  secret: 'Секрет',
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-300',
  gold: 'text-aether-gold',
  platinum: 'text-cyan-300',
  legendary: 'text-purple-400',
  secret: 'text-fuchsia-400',
}

export function isAchievementMet(player: Player, def: AchievementDef): boolean {
  return def.check(player)
}

export function isAchievementClaimed(player: Player, id: string): boolean {
  return (player.achievementsClaimed ?? []).includes(id)
}

export function canClaimAchievement(player: Player, id: string): boolean {
  const def = ACHIEVEMENT_BY_ID[id]
  if (!def || isAchievementClaimed(player, id)) return false
  return isAchievementMet(player, def)
}

export function countClaimedAchievements(player: Player): number {
  return (player.achievementsClaimed ?? []).length
}
