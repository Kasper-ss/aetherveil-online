import type { Player } from '@/types/game'
import type { AchievementDef, AchievementDifficulty, AchievementReward, AchievementTier } from '@/data/achievements'
import {
  countEquippedSlots,
  maxItemStarLevel,
  maxItemUpgradeLevel,
  sumMobKills,
  totalAllocatedStats,
} from '@/data/achievements'

function sumMiniBossKills(player: Player): number {
  return Object.values(player.floorMiniBossKills ?? {}).reduce((sum, n) => sum + n, 0)
}

function countRarity(player: Player, rarity: string): number {
  const all = [...player.inventory, ...Object.values(player.equipped).filter(Boolean)]
  return all.filter((i) => i && i.rarity === rarity).length
}

function totalResources(player: Player): number {
  return Object.values(player.resources).reduce((sum, n) => sum + (n ?? 0), 0)
}

function hasFullyMaxedItem(player: Player): boolean {
  const all = [...player.inventory, ...Object.values(player.equipped).filter(Boolean)]
  return all.some((i) => i && (i.upgradeLevel ?? 1) >= 10 && (i.starLevel ?? 0) >= 10)
}

function hasStockShares(player: Player): boolean {
  return Object.values(player.stockPortfolio ?? {}).some((pos) => (pos?.shares ?? 0) > 0)
}

function ach(
  id: string,
  nameRu: string,
  descriptionRu: string,
  icon: string,
  difficulty: AchievementDifficulty,
  tier: AchievementTier,
  rewardPreviewRu: string,
  reward: AchievementReward,
  check: (p: Player) => boolean,
  progress?: (p: Player) => { current: number; target: number } | null,
): AchievementDef {
  return {
    id,
    nameRu,
    descriptionRu,
    icon,
    tier,
    difficulty,
    rewardPreviewRu,
    reward,
    check,
    progress,
  }
}

/** 50 новых достижений с явной сложностью и наградами под неё. */
export const ACHIEVEMENTS_EXTENDED: AchievementDef[] = [
  // —— Лёгкие (13) ——
  ach('ext_easy_floor_2', 'Второй этаж', 'Достичь 2-го этажа башни.', '🪜', 'easy', 'bronze', '150 🪙', { gold: 150 },
    (p) => p.highestFloor >= 2, (p) => ({ current: p.highestFloor, target: 2 })),
  ach('ext_easy_lvl_2', 'Первый уровень', 'Достичь 2 уровня.', '✨', 'easy', 'bronze', '120 🪙', { gold: 120 },
    (p) => p.level >= 2, (p) => ({ current: p.level, target: 2 })),
  ach('ext_easy_kills_10', 'Десять трофеев', 'Убить 10 мобов.', '🗡️', 'easy', 'bronze', '100 🪙 · мясо', { gold: 100, resources: { meat: 3 } },
    (p) => sumMobKills(p) >= 10, (p) => ({ current: sumMobKills(p), target: 10 })),
  ach('ext_easy_equip_4', 'Снаряжён', 'Надеть предметы в 4 слота.', '🛡️', 'easy', 'bronze', '200 🪙', { gold: 200 },
    (p) => countEquippedSlots(p) >= 4, (p) => ({ current: countEquippedSlots(p), target: 4 })),
  ach('ext_easy_inventory_10', 'Заплечный мешок', 'Иметь 10 предметов в инвентаре.', '🎒', 'easy', 'bronze', '250 🪙', { gold: 250 },
    (p) => p.inventory.length >= 10, (p) => ({ current: p.inventory.length, target: 10 })),
  ach('ext_easy_gold_500', 'Мелочь в кармане', 'Накопить 500 золота.', '🪙', 'easy', 'bronze', '150 🪙', { gold: 150 },
    (p) => p.gold + (p.bankBalance ?? 0) >= 500, (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 500 })),
  ach('ext_easy_gems_1', 'Первый кристалл', 'Иметь хотя бы 1 гем.', '💎', 'easy', 'bronze', '100 🪙 · 1 💎', { gold: 100, gems: 1 },
    (p) => p.gems >= 1, (p) => ({ current: p.gems, target: 1 })),
  ach('ext_easy_daily_1', 'Ежедневный визит', 'Забрать ежедневную награду (серия 1).', '📅', 'easy', 'bronze', '100 🪙', { gold: 100 },
    (p) => p.dailyRewardStreak >= 1, (p) => ({ current: p.dailyRewardStreak, target: 1 })),
  ach('ext_easy_farm_3', 'Фарм начался', 'Установить фарм-этаж 3 или выше.', '🌾', 'easy', 'bronze', '180 🪙', { gold: 180 },
    (p) => (p.farmFloor ?? 1) >= 3, (p) => ({ current: p.farmFloor ?? 1, target: 3 })),
  ach('ext_easy_stat_3', 'Три очка силы', 'Вложить 3 очка характеристик.', '📊', 'easy', 'bronze', '150 🪙', { gold: 150 },
    (p) => totalAllocatedStats(p) >= 3, (p) => ({ current: totalAllocatedStats(p), target: 3 })),
  ach('ext_easy_resources_30', 'Склад новичка', 'Иметь 30 единиц ресурсов.', '📦', 'easy', 'bronze', '200 🪙 · травы', { gold: 200, resources: { herb: 5 } },
    (p) => totalResources(p) >= 30, (p) => ({ current: totalResources(p), target: 30 })),
  ach('ext_easy_pvp_3', 'Тройная победа', '3 победы на арене.', '🥊', 'easy', 'silver', '350 🪙 · 1 💎', { gold: 350, gems: 1 },
    (p) => p.pvpWins >= 3, (p) => ({ current: p.pvpWins, target: 3 })),
  ach('ext_easy_class_pick', 'Выбор пути', 'Выбрать класс персонажа.', '🎭', 'easy', 'bronze', '200 🪙', { gold: 200 },
    (p) => p.classSelected === true),

  // —— Средние (13) ——
  ach('ext_med_floor_15', 'Середина пути', 'Достичь 15-го этажа.', '🏰', 'medium', 'silver', '1 200 🪙 · 5 💎', { gold: 1200, gems: 5 },
    (p) => p.highestFloor >= 15, (p) => ({ current: p.highestFloor, target: 15 })),
  ach('ext_med_lvl_15', 'Опытный боец', 'Достичь 15 уровня.', '⭐', 'medium', 'silver', '1 000 🪙 · 4 💎', { gold: 1000, gems: 4 },
    (p) => p.level >= 15, (p) => ({ current: p.level, target: 15 })),
  ach('ext_med_kills_250', 'Зачиститель', 'Убить 250 мобов.', '⚔️', 'medium', 'silver', '900 🪙 · 3 💎', { gold: 900, gems: 3 },
    (p) => sumMobKills(p) >= 250, (p) => ({ current: sumMobKills(p), target: 250 })),
  ach('ext_med_gold_10k', 'Десять тысяч', 'Накопить 10 000 золота.', '💰', 'medium', 'silver', '800 🪙 · 2 💎', { gold: 800, gems: 2 },
    (p) => p.gold + (p.bankBalance ?? 0) >= 10000, (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 10000 })),
  ach('ext_med_bank_10k', 'Надёжный вклад', 'Держать 10 000 в банке.', '🏛️', 'medium', 'gold', '1 000 🪙 · 5 💎', { gold: 1000, gems: 5 },
    (p) => (p.bankBalance ?? 0) >= 10000, (p) => ({ current: p.bankBalance ?? 0, target: 10000 })),
  ach('ext_med_inventory_30', 'Коллекционер', 'Иметь 30 предметов.', '🗃️', 'medium', 'silver', '1 100 🪙 · 4 💎', { gold: 1100, gems: 4 },
    (p) => p.inventory.length >= 30, (p) => ({ current: p.inventory.length, target: 30 })),
  ach('ext_med_equip_full', 'Полная экипировка', 'Заполнить 7 слотов снаряжения.', '⚔️', 'medium', 'gold', '1 500 🪙 · 6 💎', { gold: 1500, gems: 6 },
    (p) => countEquippedSlots(p) >= 7, (p) => ({ current: countEquippedSlots(p), target: 7 })),
  ach('ext_med_daily_10', 'Десять дней подряд', 'Серия ежедневных наград 10 дней.', '📆', 'medium', 'gold', '1 200 🪙 · 5 💎', { gold: 1200, gems: 5 },
    (p) => p.dailyRewardStreak >= 10, (p) => ({ current: p.dailyRewardStreak, target: 10 })),
  ach('ext_med_gems_15', 'Кристальный запас', 'Иметь 15 гемов.', '💠', 'medium', 'silver', '600 🪙 · 3 💎', { gold: 600, gems: 3 },
    (p) => p.gems >= 15, (p) => ({ current: p.gems, target: 15 })),
  ach('ext_med_mini_5', 'Охотник на стражей', 'Убить 5 мини-боссов.', '🔥', 'medium', 'gold', '1 300 🪙 · 4 💎', { gold: 1300, gems: 4 },
    (p) => sumMiniBossKills(p) >= 5, (p) => ({ current: sumMiniBossKills(p), target: 5 })),
  ach('ext_med_pvp_15', 'Боец среднего веса', '15 побед на арене.', '🏆', 'medium', 'gold', '1 400 🪙 · 6 💎', { gold: 1400, gems: 6 },
    (p) => p.pvpWins >= 15, (p) => ({ current: p.pvpWins, target: 15 })),
  ach('ext_med_stats_15', 'Билдер', 'Вложить 15 очков характеристик.', '📈', 'medium', 'gold', '1 500 🪙 · 2 очка', { gold: 1500, statPoints: 2 },
    (p) => totalAllocatedStats(p) >= 15, (p) => ({ current: totalAllocatedStats(p), target: 15 })),
  ach('ext_med_farm_20', 'Фермер башни', 'Фарм-этаж 20 или выше.', '🌾', 'medium', 'gold', '1 000 🪙 · 5 💎', { gold: 1000, gems: 5 },
    (p) => (p.farmFloor ?? 1) >= 20, (p) => ({ current: p.farmFloor ?? 1, target: 20 })),

  // —— Тяжёлые (12) ——
  ach('ext_hard_floor_40', 'Глубокий спуск', 'Достичь 40-го этажа.', '🗼', 'hard', 'gold', '4 000 🪙 · 12 💎', { gold: 4000, gems: 12 },
    (p) => p.highestFloor >= 40, (p) => ({ current: p.highestFloor, target: 40 })),
  ach('ext_hard_lvl_40', 'Мастер уровней', 'Достичь 40 уровня.', '👑', 'hard', 'gold', '3 500 🪙 · 10 💎', { gold: 3500, gems: 10 },
    (p) => p.level >= 40, (p) => ({ current: p.level, target: 40 })),
  ach('ext_hard_kills_3000', 'Три тысячи душ', 'Убить 3 000 мобов.', '💀', 'hard', 'platinum', '4 500 🪙 · 15 💎', { gold: 4500, gems: 15 },
    (p) => sumMobKills(p) >= 3000, (p) => ({ current: sumMobKills(p), target: 3000 })),
  ach('ext_hard_gold_150k', 'Состоятельный', 'Накопить 150 000 золота.', '🏦', 'hard', 'platinum', '3 500 🪙 · 12 💎', { gold: 3500, gems: 12 },
    (p) => p.gold + (p.bankBalance ?? 0) >= 150000, (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 150000 })),
  ach('ext_hard_lifetime_100k', 'Заработанное золото', 'Заработать 100 000 золота за всё время.', '📊', 'hard', 'gold', '4 000 🪙 · 15 💎', { gold: 4000, gems: 15 },
    (p) => (p.lifetimeGoldEarned ?? 0) >= 100000, (p) => ({ current: p.lifetimeGoldEarned ?? 0, target: 100000 })),
  ach('ext_hard_raid_1', 'Первый рейд', 'Завершить 1 рейд.', '🌀', 'hard', 'platinum', '5 000 🪙 · 12 💎', { gold: 5000, gems: 12 },
    (p) => (p.completedRaids ?? []).length >= 1, (p) => ({ current: (p.completedRaids ?? []).length, target: 1 })),
  ach('ext_hard_world_boss_1', 'Удар по Архонту', 'Победить мирового босса 1 раз.', '🌌', 'hard', 'platinum', '6 000 🪙 · 15 💎', { gold: 6000, gems: 15 },
    (p) => (p.worldBossKills ?? 0) >= 1, (p) => ({ current: p.worldBossKills ?? 0, target: 1 })),
  ach('ext_hard_stars_5', 'Пятизвёздочный', 'Довести предмет до 5 звёзд.', '🌟', 'hard', 'gold', '3 000 🪙 · 10 💎', { gold: 3000, gems: 10, resources: { star_shard: 5 } },
    (p) => maxItemStarLevel(p) >= 5, (p) => ({ current: maxItemStarLevel(p), target: 5 })),
  ach('ext_hard_upgrade_7', 'Заточка +7', 'Улучшить предмет до 7 уровня.', '🔨', 'hard', 'gold', '2 800 🪙 · 8 💎', { gold: 2800, gems: 8, resources: { upgrade_core: 3 } },
    (p) => maxItemUpgradeLevel(p) >= 7, (p) => ({ current: maxItemUpgradeLevel(p), target: 7 })),
  ach('ext_hard_trophies_10', 'Охотник за трофеями', 'Собрать 10 трофеев боссов.', '🗿', 'hard', 'platinum', '5 500 🪙 · 14 💎', { gold: 5500, gems: 14 },
    (p) => (p.bossTrophies ?? []).length >= 10, (p) => ({ current: (p.bossTrophies ?? []).length, target: 10 })),
  ach('ext_hard_monthly_gold_10k', 'Продуктивный месяц', 'Заработать 10 000 золота за месяц.', '📆', 'hard', 'gold', '3 200 🪙 · 10 💎', { gold: 3200, gems: 10 },
    (p) => (p.monthlyStats?.goldEarned ?? 0) >= 10000, (p) => ({ current: p.monthlyStats?.goldEarned ?? 0, target: 10000 })),
  ach('ext_hard_stock_investor', 'Инвестор', 'Купить акции на бирже.', '📈', 'hard', 'gold', '3 000 🪙 · 8 💎', { gold: 3000, gems: 8 },
    (p) => hasStockShares(p)),

  // —— Адские (12) ——
  ach('ext_hell_floor_75', 'Бездна башни', 'Достичь 75-го этажа.', '🏰', 'hell', 'legendary', '15 000 🪙 · 35 💎 · +2% лут', { gold: 15000, gems: 35, buff: { lootPct: 0.02 } },
    (p) => p.highestFloor >= 75, (p) => ({ current: p.highestFloor, target: 75 })),
  ach('ext_hell_lvl_55', 'Полубог', 'Достичь 55 уровня.', '💫', 'hell', 'legendary', '12 000 🪙 · 30 💎', { gold: 12000, gems: 30 },
    (p) => p.level >= 55, (p) => ({ current: p.level, target: 55 })),
  ach('ext_hell_kills_25k', 'Геноцид мобов', 'Убить 25 000 мобов.', '☠️', 'hell', 'legendary', '18 000 🪙 · 40 💎', { gold: 18000, gems: 40 },
    (p) => sumMobKills(p) >= 25000, (p) => ({ current: sumMobKills(p), target: 25000 })),
  ach('ext_hell_gold_500k', 'Полумиллионер', 'Накопить 500 000 золота.', '👑', 'hell', 'legendary', '15 000 🪙 · 35 💎', { gold: 15000, gems: 35 },
    (p) => p.gold + (p.bankBalance ?? 0) >= 500000, (p) => ({ current: p.gold + (p.bankBalance ?? 0), target: 500000 })),
  ach('ext_hell_lifetime_1m', 'Золотой миллион', 'Заработать 1 000 000 золота за всё время.', '📊', 'hell', 'legendary', '20 000 🪙 · 45 💎 · +3% золота', { gold: 20000, gems: 45, buff: { goldPct: 0.03 } },
    (p) => (p.lifetimeGoldEarned ?? 0) >= 1000000, (p) => ({ current: p.lifetimeGoldEarned ?? 0, target: 1000000 })),
  ach('ext_hell_divine_1', 'Божественная экипировка', 'Получить божественный предмет.', '☀️', 'hell', 'legendary', '14 000 🪙 · 30 💎', { gold: 14000, gems: 30 },
    (p) => countRarity(p, 'divine') >= 1),
  ach('ext_hell_world_boss_5', 'Каратель Архонта', 'Победить мирового босса 5 раз.', '🌌', 'hell', 'legendary', '16 000 🪙 · 38 💎', { gold: 16000, gems: 38 },
    (p) => (p.worldBossKills ?? 0) >= 5, (p) => ({ current: p.worldBossKills ?? 0, target: 5 })),
  ach('ext_hell_floor_100', 'Вершина мира', 'Достичь 100-го этажа.', '🏔️', 'hell', 'legendary', '25 000 🪙 · 50 💎 · +3% ко всем статам', { gold: 25000, gems: 50, buff: { allStatsPct: 0.03 } },
    (p) => p.highestFloor >= 100, (p) => ({ current: p.highestFloor, target: 100 })),
  ach('ext_hell_mythic_5', 'Мифический арсенал II', 'Иметь 5 мифических предметов.', '✦', 'hell', 'legendary', '14 000 🪙 · 35 💎 · +3% лут', { gold: 14000, gems: 35, buff: { lootPct: 0.03 } },
    (p) => countRarity(p, 'mythic') >= 5),
  ach('ext_hell_max_item', 'Абсолют предмета', 'Довести предмет до 10 ур. и 10★.', '⚡', 'hell', 'legendary', '18 000 🪙 · 40 💎 · осколки', { gold: 18000, gems: 40, resources: { star_shard: 10, upgrade_core: 8 } },
    (p) => hasFullyMaxedItem(p)),
  ach('ext_hell_raid_5', 'Мастер рейдов', 'Завершить 5 рейдов.', '🌀', 'hell', 'legendary', '16 000 🪙 · 38 💎 · +4% EXP', { gold: 16000, gems: 38, buff: { expPct: 0.04 } },
    (p) => (p.completedRaids ?? []).length >= 5, (p) => ({ current: (p.completedRaids ?? []).length, target: 5 })),
  ach('ext_hell_titles_5', 'Носитель титулов', 'Разблокировать 5 титулов.', '🎖️', 'hell', 'legendary', '12 000 🪙 · 30 💎', { gold: 12000, gems: 30 },
    (p) => (p.unlockedTitles ?? []).length >= 5, (p) => ({ current: (p.unlockedTitles ?? []).length, target: 5 })),
]
