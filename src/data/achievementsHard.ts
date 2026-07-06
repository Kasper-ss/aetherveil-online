import type { Player, ProfessionId } from '@/types/game'
import type { AchievementDef } from '@/data/achievements'
import {
  maxItemStarLevel,
  maxItemUpgradeLevel,
  sumMobKills,
  totalAllocatedStats,
} from '@/data/achievements'
import { isProfessionMaxed } from '@/data/classes'

function sumMiniBossKills(player: Player): number {
  return Object.values(player.floorMiniBossKills ?? {}).reduce((sum, n) => sum + n, 0)
}

function countRarity(player: Player, rarity: string): number {
  const all = [
    ...player.inventory,
    ...Object.values(player.equipped).filter(Boolean),
  ]
  return all.filter((i) => i && i.rarity === rarity).length
}

function totalResources(player: Player): number {
  return Object.values(player.resources).reduce((sum, n) => sum + (n ?? 0), 0)
}

function professionXp(player: Player, field: keyof Player): number {
  return Number(player[field] ?? 0)
}

function allProfessionsMaxed(player: Player): boolean {
  const ids: ProfessionId[] = ['blacksmith', 'alchemist', 'hunter', 'jeweler', 'sorcerer']
  return ids.every((id) => isProfessionMaxed(id, player.professionLevels[id] ?? []))
}

function luckyPieces(player: Player): number {
  return Object.values(player.equipped).filter((i) => i?.id?.startsWith('lucky_')).length
}


export const ACHIEVEMENTS_HARD: AchievementDef[] = [
  { id: 'hard_lvl_60', nameRu: 'Легенда уровней', descriptionRu: 'Достигнуть 60 уровня.', icon: '👑', tier: 'legendary', rewardPreviewRu: '12 000 🪙 · 30 💎', reward: { gold: 12000, gems: 30, titleId: 'tower_climber' }, check: (p) => p.level >= 60, progress: (p) => ({ current: p.level, target: 60 }) },
  { id: 'hard_kills_5k', nameRu: 'Мясорубка', descriptionRu: 'Убить 5 000 мобов на этажах.', icon: '⚔️', tier: 'platinum', rewardPreviewRu: '3 000 🪙 · 8 💎', reward: { gold: 3000, gems: 8 }, check: (p) => sumMobKills(p) >= 5000, progress: (p) => ({ current: sumMobKills(p), target: 5000 }) },
  { id: 'hard_kills_15k', nameRu: 'Погибель мобов', descriptionRu: 'Убить 15 000 мобов.', icon: '💀', tier: 'legendary', rewardPreviewRu: '8 000 🪙 · 20 💎', reward: { gold: 8000, gems: 20 }, check: (p) => sumMobKills(p) >= 15000, progress: (p) => ({ current: sumMobKills(p), target: 15000 }) },
  { id: 'hard_gold_100k', nameRu: 'Состояние', descriptionRu: 'Иметь 100 000 золота (включая банк).', icon: '💰', tier: 'gold', rewardPreviewRu: '2 000 🪙', reward: { gold: 2000 }, check: (p) => p.gold + (p.bankBalance ?? 0) >= 100000, progress: (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 100000 }) },
  { id: 'hard_gold_250k', nameRu: 'Магнат', descriptionRu: 'Иметь 250 000 золота.', icon: '🏦', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 10 💎', reward: { gold: 5000, gems: 10 }, check: (p) => p.gold + (p.bankBalance ?? 0) >= 250000, progress: (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 250000 }) },
  { id: 'hard_lifetime_500k', nameRu: 'Золотой поток', descriptionRu: 'Заработать 500 000 золота за всё время.', icon: '📊', tier: 'platinum', rewardPreviewRu: '4 000 🪙 · 12 💎', reward: { gold: 4000, gems: 12 }, check: (p) => (p.lifetimeGoldEarned ?? 0) >= 500000, progress: (p) => ({ current: p.lifetimeGoldEarned ?? 0, target: 500000 }) },
  { id: 'hard_gems_250', nameRu: 'Коллекционер гемов', descriptionRu: 'Накопить 250 гемов.', icon: '💎', tier: 'platinum', rewardPreviewRu: '3 000 🪙 · 15 💎', reward: { gold: 3000, gems: 15 }, check: (p) => p.gems >= 250, progress: (p) => ({ current: p.gems, target: 250 }) },
  { id: 'hard_bank_25k', nameRu: 'Банкир', descriptionRu: 'Держать 25 000 золота в банке.', icon: '🏛️', tier: 'gold', rewardPreviewRu: '1 500 🪙 · 5 💎', reward: { gold: 1500, gems: 5 }, check: (p) => (p.bankBalance ?? 0) >= 25000, progress: (p) => ({ current: p.bankBalance ?? 0, target: 25000 }) },
  { id: 'hard_bank_100k', nameRu: 'Хранитель сокровищ', descriptionRu: 'Держать 100 000 золота в банке.', icon: '🔒', tier: 'platinum', rewardPreviewRu: '6 000 🪙 · 12 💎', reward: { gold: 6000, gems: 12 }, check: (p) => (p.bankBalance ?? 0) >= 100000, progress: (p) => ({ current: p.bankBalance ?? 0, target: 100000 }) },
  { id: 'hard_mine_1500', nameRu: 'Шахтёр-ветеран', descriptionRu: 'Набрать 1 500 XP шахты.', icon: '⛏️', tier: 'gold', rewardPreviewRu: '1 200 🪙 · iron_ore', reward: { gold: 1200, resources: { iron_ore: 30, mithril_ore: 5 } }, check: (p) => professionXp(p, 'mineDigXp') >= 1500, progress: (p) => ({ current: professionXp(p, 'mineDigXp'), target: 1500 }) },
  { id: 'hard_mine_4000', nameRu: 'Повелитель руд', descriptionRu: 'Набрать 4 000 XP шахты.', icon: '🪨', tier: 'platinum', rewardPreviewRu: '3 500 🪙 · руда', reward: { gold: 3500, resources: { adamantite: 8, raw_diamond: 4 } }, check: (p) => professionXp(p, 'mineDigXp') >= 4000, progress: (p) => ({ current: professionXp(p, 'mineDigXp'), target: 4000 }) },
  { id: 'hard_field_1500', nameRu: 'Травник-мастер', descriptionRu: 'Набрать 1 500 XP поля.', icon: '🌿', tier: 'gold', rewardPreviewRu: '1 200 🪙', reward: { gold: 1200, resources: { herb: 25, herb_phoenix: 3 } }, check: (p) => professionXp(p, 'fieldGatherXp') >= 1500, progress: (p) => ({ current: professionXp(p, 'fieldGatherXp'), target: 1500 }) },
  { id: 'hard_field_4000', nameRu: 'Повелитель трав', descriptionRu: 'Набрать 4 000 XP поля.', icon: '🌺', tier: 'platinum', rewardPreviewRu: '3 500 🪙', reward: { gold: 3500, resources: { herb_void: 5, herb_phoenix: 8 } }, check: (p) => professionXp(p, 'fieldGatherXp') >= 4000, progress: (p) => ({ current: professionXp(p, 'fieldGatherXp'), target: 4000 }) },
  { id: 'hard_fish_300', nameRu: 'Морской волк', descriptionRu: 'Набрать 300 XP рыбалки.', icon: '🐟', tier: 'gold', rewardPreviewRu: '1 500 🪙', reward: { gold: 1500, resources: { fish_salmon: 10, fish_tuna: 5 } }, check: (p) => professionXp(p, 'fishingSpotXp') >= 300, progress: (p) => ({ current: professionXp(p, 'fishingSpotXp'), target: 300 }) },
  { id: 'hard_fish_800', nameRu: 'Ловец бездны', descriptionRu: 'Набрать 800 XP рыбалки.', icon: '🦑', tier: 'platinum', rewardPreviewRu: '4 000 🪙 · титул', reward: { gold: 4000, gems: 8, titleId: 'master_fisher', resources: { fish_aether_koi: 3 } }, check: (p) => professionXp(p, 'fishingSpotXp') >= 800, progress: (p) => ({ current: professionXp(p, 'fishingSpotXp'), target: 800 }) },
  { id: 'hard_hunt_800', nameRu: 'Охотник элиты', descriptionRu: 'Набрать 800 XP охоты.', icon: '🏹', tier: 'gold', rewardPreviewRu: '1 500 🪙', reward: { gold: 1500, resources: { meat: 25, hide: 15 } }, check: (p) => professionXp(p, 'huntXp') >= 800, progress: (p) => ({ current: professionXp(p, 'huntXp'), target: 800 }) },
  { id: 'hard_hunt_2500', nameRu: 'Альфа-охотник', descriptionRu: 'Набрать 2 500 XP охоты.', icon: '🐺', tier: 'platinum', rewardPreviewRu: '4 000 🪙', reward: { gold: 4000, resources: { abyssal_pearl: 2, rare_spice: 10 } }, check: (p) => professionXp(p, 'huntXp') >= 2500, progress: (p) => ({ current: professionXp(p, 'huntXp'), target: 2500 }) },
  { id: 'hard_gem_800', nameRu: 'Собиратель кристаллов', descriptionRu: 'Набрать 800 XP кристаллов.', icon: '💠', tier: 'gold', rewardPreviewRu: '1 800 🪙', reward: { gold: 1800, resources: { gem_shard: 20, mana_crystal: 10 } }, check: (p) => professionXp(p, 'gemSiteXp') >= 800, progress: (p) => ({ current: professionXp(p, 'gemSiteXp'), target: 800 }) },
  { id: 'hard_aether_800', nameRu: 'Проводник эфира', descriptionRu: 'Набрать 800 XP эфира.', icon: '✨', tier: 'gold', rewardPreviewRu: '1 800 🪙', reward: { gold: 1800, resources: { aether_dust: 15, star_shard: 5 } }, check: (p) => professionXp(p, 'aetherRiftXp') >= 800, progress: (p) => ({ current: professionXp(p, 'aetherRiftXp'), target: 800 }) },
  { id: 'hard_upgrade_8', nameRu: 'Кузнец-энтузиаст', descriptionRu: 'Улучшить предмет до 8 уровня.', icon: '🔨', tier: 'gold', rewardPreviewRu: '2 000 🪙', reward: { gold: 2000, resources: { upgrade_core: 3 } }, check: (p) => maxItemUpgradeLevel(p) >= 8, progress: (p) => ({ current: maxItemUpgradeLevel(p), target: 8 }) },
  { id: 'hard_upgrade_10', nameRu: 'Максимальная заточка', descriptionRu: 'Улучшить предмет до 10 уровня.', icon: '⚒️', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · титул', reward: { gold: 5000, gems: 10, titleId: 'master_smith' }, check: (p) => maxItemUpgradeLevel(p) >= 10, progress: (p) => ({ current: maxItemUpgradeLevel(p), target: 10 }) },
  { id: 'hard_stars_7', nameRu: 'Звёздный кузнец', descriptionRu: 'Довести предмет до 7 звёзд.', icon: '🌟', tier: 'gold', rewardPreviewRu: '2 500 🪙', reward: { gold: 2500, resources: { star_shard: 8 } }, check: (p) => maxItemStarLevel(p) >= 7, progress: (p) => ({ current: maxItemStarLevel(p), target: 7 }) },
  { id: 'hard_stars_10', nameRu: 'Созвездие силы', descriptionRu: 'Довести предмет до 10 звёзд.', icon: '✨', tier: 'platinum', rewardPreviewRu: '6 000 🪙 · 12 💎', reward: { gold: 6000, gems: 12, resources: { star_shard: 15 } }, check: (p) => maxItemStarLevel(p) >= 10, progress: (p) => ({ current: maxItemStarLevel(p), target: 10 }) },
  { id: 'hard_mythic_3', nameRu: 'Мифический арсенал', descriptionRu: 'Иметь 3 мифических предмета.', icon: '🌌', tier: 'legendary', rewardPreviewRu: '10 000 🪙 · 25 💎', reward: { gold: 10000, gems: 25 }, check: (p) => countRarity(p, 'mythic') >= 3 },
  { id: 'hard_legendary_5', nameRu: 'Легендарная коллекция', descriptionRu: 'Иметь 5 легендарных предметов.', icon: '📦', tier: 'platinum', rewardPreviewRu: '3 500 🪙', reward: { gold: 3500, resources: { aether_dust: 10 } }, check: (p) => countRarity(p, 'legendary') >= 5 },
  { id: 'hard_inventory_100', nameRu: 'Архивариус', descriptionRu: 'Иметь 100 предметов.', icon: '🗄️', tier: 'platinum', rewardPreviewRu: '4 000 🪙 · 8 💎', reward: { gold: 4000, gems: 8 }, check: (p) => p.inventory.length >= 100, progress: (p) => ({ current: p.inventory.length, target: 100 }) },
  { id: 'hard_equip_full_epic', nameRu: 'Эпический страж', descriptionRu: 'Надеть эпические вещи в 6 слотов.', icon: '💜', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 10 💎', reward: { gold: 5000, gems: 10 }, check: (p) => Object.values(p.equipped).filter((i) => i && (i.rarity === 'epic' || i.rarity === 'legendary' || i.rarity === 'mythic') && i.slot !== 'pet').length >= 6 },
  { id: 'hard_stats_50', nameRu: 'Атрибутный титан', descriptionRu: 'Вложить 50 очков характеристик.', icon: '📈', tier: 'platinum', rewardPreviewRu: '5 очков характеристик', reward: { statPoints: 5, gold: 2000 }, check: (p) => totalAllocatedStats(p) >= 50, progress: (p) => ({ current: totalAllocatedStats(p), target: 50 }) },
  { id: 'hard_stats_80', nameRu: 'Абсолютный билд', descriptionRu: 'Вложить 80 очков характеристик.', icon: '🧠', tier: 'legendary', rewardPreviewRu: '8 очков · 5 000 🪙', reward: { statPoints: 8, gold: 5000, gems: 15 }, check: (p) => totalAllocatedStats(p) >= 80, progress: (p) => ({ current: totalAllocatedStats(p), target: 80 }) },
  { id: 'hard_daily_30', nameRu: 'Непрерывность', descriptionRu: 'Серия ежедневных наград 30 дней.', icon: '📅', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 20 💎', reward: { gold: 5000, gems: 20 }, check: (p) => p.dailyRewardStreak >= 30, progress: (p) => ({ current: p.dailyRewardStreak, target: 30 }) },
  { id: 'hard_monthly_gold_25k', nameRu: 'Золотой месяц', descriptionRu: 'Заработать 25 000 золота за месяц.', icon: '📆', tier: 'platinum', rewardPreviewRu: '3 000 🪙 · 10 💎', reward: { gold: 3000, gems: 10 }, check: (p) => (p.monthlyStats?.goldEarned ?? 0) >= 25000, progress: (p) => ({ current: p.monthlyStats?.goldEarned ?? 0, target: 25000 }) },
  { id: 'hard_fair_win_10', nameRu: 'Король ярмарки', descriptionRu: 'Выиграть 10 игр на ярмарке.', icon: '🏆', tier: 'platinum', rewardPreviewRu: '4 000 🪙 · 12 💎', reward: { gold: 4000, gems: 12 }, check: (p) => (p.fairStats?.gamesWon ?? 0) >= 10, progress: (p) => ({ current: p.fairStats?.gamesWon ?? 0, target: 10 }) },
  { id: 'hard_pvp_100', nameRu: 'Гладиатор', descriptionRu: 'Одержать 100 побед в PvP.', icon: '⚔️', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · титул', reward: { gold: 5000, gems: 15, titleId: 'duelist' }, check: (p) => p.pvpWins >= 100, progress: (p) => ({ current: p.pvpWins, target: 100 }) },
  { id: 'hard_referral_3', nameRu: 'Вербовщик', descriptionRu: 'Пригласить 3 активных друзей.', icon: '🤝', tier: 'gold', rewardPreviewRu: '2 500 🪙 · 10 💎', reward: { gold: 2500, gems: 10 }, check: (p) => (p.referralInvites ?? []).filter((i) => i.activated).length >= 3 },
  { id: 'hard_referral_10', nameRu: 'Посол башни', descriptionRu: 'Пригласить 10 активных друзей.', icon: '📣', tier: 'platinum', rewardPreviewRu: '6 000 🪙 · 20 💎', reward: { gold: 6000, gems: 20 }, check: (p) => (p.referralInvites ?? []).filter((i) => i.activated).length >= 10 },
  { id: 'hard_world_boss_3', nameRu: 'Охотник на Архонта', descriptionRu: 'Победить мирового босса 3 раза.', icon: '🌌', tier: 'platinum', rewardPreviewRu: '8 000 🪙 · титул', reward: { gold: 8000, gems: 20, titleId: 'world_boss_slayer' }, check: (p) => (p.worldBossKills ?? 0) >= 3, progress: (p) => ({ current: p.worldBossKills ?? 0, target: 3 }) },
  { id: 'hard_trophies_25', nameRu: 'Музей побед', descriptionRu: 'Собрать 25 трофеев боссов.', icon: '🗿', tier: 'platinum', rewardPreviewRu: '7 000 🪙 · 15 💎', reward: { gold: 7000, gems: 15 }, check: (p) => (p.bossTrophies ?? []).length >= 25, progress: (p) => ({ current: (p.bossTrophies ?? []).length, target: 25 }) },
  { id: 'hard_resources_2000', nameRu: 'Империя ресурсов', descriptionRu: 'Иметь 2 000 единиц ресурсов.', icon: '🏭', tier: 'platinum', rewardPreviewRu: '4 500 🪙', reward: { gold: 4500, gems: 10 }, check: (p) => totalResources(p) >= 2000, progress: (p) => ({ current: totalResources(p), target: 2000 }) },
  { id: 'hard_lucky_4', nameRu: 'Удача на тебе', descriptionRu: 'Надеть 4 вещи Lucky-сета.', icon: '🍀', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 10 💎', reward: { gold: 5000, gems: 10 }, check: (p) => luckyPieces(p) >= 4, progress: (p) => ({ current: luckyPieces(p), target: 4 }) },
  { id: 'hard_lucky_full', nameRu: 'Полная удача', descriptionRu: 'Надеть полный Lucky-сет (7 вещей).', icon: '🎰', tier: 'legendary', rewardPreviewRu: '12 000 🪙 · 25 💎', reward: { gold: 12000, gems: 25, titleId: 'lucky_one' }, check: (p) => luckyPieces(p) >= 7 },
  { id: 'hard_mini_15', nameRu: 'Истребитель стражей', descriptionRu: 'Убить 15 мини-боссов.', icon: '🔥', tier: 'gold', rewardPreviewRu: '2 500 🪙 · 5 💎', reward: { gold: 2500, gems: 5 }, check: (p) => sumMiniBossKills(p) >= 15, progress: (p) => ({ current: sumMiniBossKills(p), target: 15 }) },
  { id: 'hard_mini_30', nameRu: 'Каратель этажей', descriptionRu: 'Убить 30 мини-боссов.', icon: '⚡', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 12 💎', reward: { gold: 5000, gems: 12, resources: { star_shard: 5 } }, check: (p) => sumMiniBossKills(p) >= 30, progress: (p) => ({ current: sumMiniBossKills(p), target: 30 }) },
  { id: 'hard_floor_mob_500', nameRu: 'Зачистка этажа', descriptionRu: 'Убить 500 мобов на одном этаже.', icon: '🗡️', tier: 'platinum', rewardPreviewRu: '4 000 🪙', reward: { gold: 4000, gems: 8 }, check: (p) => Object.values(p.floorMobKills ?? {}).some((n) => n >= 500) },
  { id: 'hard_elite_hunter', nameRu: 'Элитный охотник', descriptionRu: 'Достичь 35 этажа и 35 уровня.', icon: '🏹', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 12 💎', reward: { gold: 5000, gems: 12 }, check: (p) => p.highestFloor >= 35 && p.level >= 35 },
  { id: 'hard_prof_triple', nameRu: 'Три мастерства', descriptionRu: 'Максимально прокачать 3 профессии.', icon: '🎓', tier: 'platinum', rewardPreviewRu: '5 000 🪙 · 15 💎', reward: { gold: 5000, gems: 15 }, check: (p) => (['blacksmith', 'alchemist', 'hunter', 'jeweler', 'sorcerer'] as ProfessionId[]).filter((id) => isProfessionMaxed(id, p.professionLevels[id] ?? [])).length >= 3 },
  { id: 'legend_tower_sovereign', nameRu: 'Властелин Башни', descriptionRu: 'Достичь 50 этажа и 48 уровня.', icon: '🏰', tier: 'legendary', rewardPreviewRu: '20 000 🪙 · 40 💎 · титул', reward: { gold: 20000, gems: 40, titleId: 'tower_climber', buff: { allStatsPct: 0.03 } }, check: (p) => p.highestFloor >= 50 && p.level >= 48 },
  { id: 'legend_mythic_collector', nameRu: 'Коллекционер мифа', descriptionRu: 'Иметь 7 мифических предметов.', icon: '✦', tier: 'legendary', rewardPreviewRu: '15 000 🪙 · 35 💎', reward: { gold: 15000, gems: 35, buff: { lootPct: 0.05 } }, check: (p) => countRarity(p, 'mythic') >= 7 },
  { id: 'legend_gold_emperor', nameRu: 'Золотой император', descriptionRu: 'Заработать 2 500 000 золота за всё время.', icon: '👑', tier: 'legendary', rewardPreviewRu: '25 000 🪙 · 50 💎', reward: { gold: 25000, gems: 50, buff: { goldPct: 0.05 } }, check: (p) => (p.lifetimeGoldEarned ?? 0) >= 2500000, progress: (p) => ({ current: p.lifetimeGoldEarned ?? 0, target: 2500000 }) },
  { id: 'legend_mini_extinction', nameRu: 'Истребление стражей', descriptionRu: 'Убить 40 мини-боссов за всё время.', icon: '💥', tier: 'legendary', rewardPreviewRu: '12 000 🪙 · 30 💎', reward: { gold: 12000, gems: 30, resources: { aether_dust: 20, star_shard: 10 }, buff: { lootPct: 0.04 } }, check: (p) => sumMiniBossKills(p) >= 40, progress: (p) => ({ current: sumMiniBossKills(p), target: 40 }) },
  { id: 'legend_five_masters', nameRu: 'Пять мастерств', descriptionRu: 'Максимально прокачать все 5 профессий.', icon: '🌟', tier: 'legendary', rewardPreviewRu: '18 000 🪙 · 40 💎 · титул', reward: { gold: 18000, gems: 40, titleId: 'alchemist_sage', buff: { expPct: 0.05, allStatsPct: 0.02 } }, check: allProfessionsMaxed },
]
