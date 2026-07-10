import type { MonthlyStats, Player, MonthlyLeaderboardResponse, MonthlyLeaderboardCategory } from '@/types/game'

export function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7)
}

export function defaultMonthlyStats(player?: Player): MonthlyStats {
  return {
    monthKey: monthKey(),
    goldEarned: 0,
    mobsKilled: 0,
    fishCaught: 0,
    highestFloor: player?.highestFloor ?? 1,
  }
}

export function normalizeMonthlyStats(player: Player): MonthlyStats {
  const key = monthKey()
  const cur = player.monthlyStats
  if (!cur || cur.monthKey !== key) {
    return {
      monthKey: key,
      goldEarned: 0,
      mobsKilled: 0,
      fishCaught: 0,
      highestFloor: player.highestFloor,
    }
  }
  return {
    ...cur,
    highestFloor: Math.max(cur.highestFloor, player.highestFloor),
  }
}

type BumpField = 'goldEarned' | 'mobsKilled' | 'fishCaught' | 'highestFloor'

export function bumpMonthlyStat(player: Player, field: BumpField, amount: number): MonthlyStats {
  const stats = normalizeMonthlyStats(player)
  if (field === 'highestFloor') {
    return { ...stats, highestFloor: Math.max(stats.highestFloor, amount) }
  }
  return { ...stats, [field]: stats[field] + amount }
}

export const MONTHLY_CATEGORIES = [
  { id: 'gold_earned', nameRu: 'Заработано золота', icon: '🪙', field: 'goldEarned' as const },
  { id: 'mobs_killed', nameRu: 'Убито мобов', icon: '⚔️', field: 'mobsKilled' as const },
  { id: 'fish_caught', nameRu: 'Поймано рыбы', icon: '🎣', field: 'fishCaught' as const },
  { id: 'highest_floor', nameRu: 'Макс. этаж', icon: '🏰', field: 'highestFloor' as const },
] as const

export const MONTHLY_RANK_REWARDS: Record<1 | 2 | 3, { gold: number; gems: number }> = {
  1: { gold: 100_000, gems: 30 },
  2: { gold: 60_000, gems: 20 },
  3: { gold: 30_000, gems: 10 },
}

export const MONTHLY_LIVE_TOP_COUNT = 5

/** Rewards can be claimed only during the last N days of the month. */
export const MONTHLY_REWARD_CLAIM_WINDOW_DAYS = 5

export function isMonthlyRewardClaimWindowOpen(date = new Date()): boolean {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstClaimDay = lastDay - MONTHLY_REWARD_CLAIM_WINDOW_DAYS + 1
  return date.getDate() >= firstClaimDay
}

export function getDaysUntilMonthlyRewardClaim(date = new Date()): number {
  if (isMonthlyRewardClaimWindowOpen(date)) return 0
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstClaimDay = lastDay - MONTHLY_REWARD_CLAIM_WINDOW_DAYS + 1
  return Math.max(0, firstClaimDay - date.getDate())
}

export function getMonthlyRewardClaimStartDay(date = new Date()): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return lastDay - MONTHLY_REWARD_CLAIM_WINDOW_DAYS + 1
}

export function formatMonthlyRewardClaimHint(date = new Date()): string {
  if (isMonthlyRewardClaimWindowOpen(date)) {
    return `Окно получения наград открыто (последние ${MONTHLY_REWARD_CLAIM_WINDOW_DAYS} дн. месяца)`
  }
  const startDay = getMonthlyRewardClaimStartDay(date)
  const days = getDaysUntilMonthlyRewardClaim(date)
  return `Забрать награды можно с ${startDay} числа (через ${days} дн.)`
}

export const MONTHLY_RANK_BONUSES: Record<1 | 2 | 3, string> = {
  1: 'Титул «Чемпион месяца» и значок в профиле',
  2: 'Значок «Серебряный призёр» в профиле',
  3: 'Значок «Бронзовый призёр» в профиле',
}

export function formatMonthlyReward(rank: 1 | 2 | 3): string {
  const r = MONTHLY_RANK_REWARDS[rank]
  return `${r.gold.toLocaleString('ru-RU')} 🪙 + ${r.gems} 💎`
}

export function getMonthlyRewardRank(rank: number): 1 | 2 | 3 | null {
  if (rank === 1 || rank === 2 || rank === 3) return rank
  return null
}

export function formatMonthlyRewardLine(rank: number): string {
  const rewardRank = getMonthlyRewardRank(rank)
  if (!rewardRank) return 'Без награды'
  return formatMonthlyReward(rewardRank)
}

export function formatMonthlyRewardBonus(rank: number): string | null {
  const rewardRank = getMonthlyRewardRank(rank)
  if (!rewardRank) return null
  return MONTHLY_RANK_BONUSES[rewardRank]
}

export function getPlayerMonthlyCategoryValue(player: Player, categoryId: string): number {
  const cat = MONTHLY_CATEGORIES.find((c) => c.id === categoryId)
  if (!cat) return 0
  return normalizeMonthlyStats(player)[cat.field]
}

export function formatMonthlyCategoryValue(categoryId: string, value: number): string {
  if (categoryId === 'gold_earned') return value.toLocaleString('ru-RU')
  return String(value)
}

export function getGapToBeat(targetValue: number, selfValue: number): number | null {
  if (selfValue > targetValue) return null
  return targetValue - selfValue + 1
}

/** Ensure local player appears in monthly board when server cache is cold. */
export function mergeMonthlyLeaderboardWithPlayer(
  board: MonthlyLeaderboardResponse,
  player: Player,
): MonthlyLeaderboardResponse {
  const stats = normalizeMonthlyStats(player)
  if (stats.monthKey !== board.monthKey) return board

  const categories: MonthlyLeaderboardCategory[] = board.categories.map((cat) => {
    const def = MONTHLY_CATEGORIES.find((c) => c.id === cat.categoryId)
    if (!def) return cat

    const value = stats[def.field]
    if (value <= 0) return cat

    const withoutSelf = cat.entries.filter((e) => e.telegramId !== player.telegramId)
    const rows = [
      ...withoutSelf,
      {
        rank: 0,
        telegramId: player.telegramId,
        displayName: player.displayName,
        username: player.username,
        value,
      },
    ]
    rows.sort((a, b) => b.value - a.value || a.displayName.localeCompare(b.displayName, 'ru'))
    return {
      ...cat,
      entries: rows.slice(0, 10).map((row, index) => ({ ...row, rank: index + 1 })),
    }
  })

  return { ...board, categories }
}
