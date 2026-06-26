export interface MonthlyStatsPayload {
  monthKey: string
  goldEarned: number
  mobsKilled: number
  fishCaught: number
  highestFloor: number
}

export interface MonthlyCategoryDef {
  id: string
  nameRu: string
  icon: string
  field: keyof Omit<MonthlyStatsPayload, 'monthKey'>
}

export const MONTHLY_CATEGORIES: MonthlyCategoryDef[] = [
  { id: 'gold_earned', nameRu: 'Заработано золота', icon: '🪙', field: 'goldEarned' },
  { id: 'mobs_killed', nameRu: 'Убито мобов', icon: '⚔️', field: 'mobsKilled' },
  { id: 'fish_caught', nameRu: 'Поймано рыбы', icon: '🎣', field: 'fishCaught' },
  { id: 'highest_floor', nameRu: 'Макс. этаж', icon: '🏰', field: 'highestFloor' },
]

export function currentMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7)
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

export function buildMonthlyLeaderboardFromProfiles(
  profileMap: Map<number, Record<string, unknown>>,
): MonthlyLeaderboardResponse {
  const key = currentMonthKey()
  const categories: MonthlyLeaderboardCategory[] = MONTHLY_CATEGORIES.map((cat) => {
    const rows: Omit<MonthlyLeaderboardEntry, 'rank'>[] = []
    for (const [id, profile] of profileMap.entries()) {
      const stats = profile.monthlyStats as MonthlyStatsPayload | undefined
      if (!stats || stats.monthKey !== key) continue
      const value = stats[cat.field] ?? 0
      if (value <= 0) continue
      rows.push({
        telegramId: id,
        displayName: String(profile.displayName ?? profile.display_name ?? `Игрок ${id}`),
        username: String(profile.username ?? `user_${id}`),
        value,
      })
    }
    rows.sort((a, b) => b.value - a.value || a.displayName.localeCompare(b.displayName, 'ru'))
    return {
      categoryId: cat.id,
      nameRu: cat.nameRu,
      icon: cat.icon,
      entries: rows.slice(0, 10).map((row, index) => ({ ...row, rank: index + 1 })),
    }
  })
  return { monthKey: key, categories }
}
