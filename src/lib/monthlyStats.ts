import type { MonthlyStats, Player } from '@/types/game'

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
  1: { gold: 5000, gems: 30 },
  2: { gold: 3000, gems: 15 },
  3: { gold: 1500, gems: 8 },
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
