import type { LeaderboardEntry } from '@/types/game'

export const GLOBAL_LEADERBOARD_TOP_N = 20

export interface LeaderboardView {
  top: LeaderboardEntry[]
  selfEntry: LeaderboardEntry | null
  selfRank: number | null
  selfInTop: boolean
}

export function buildGlobalLeaderboardView(
  entries: LeaderboardEntry[],
  selfId: number,
  topN = GLOBAL_LEADERBOARD_TOP_N,
): LeaderboardView {
  const sorted = [...entries].sort(
    (a, b) => a.rank - b.rank || b.floor - a.floor || b.level - a.level,
  )
  const selfEntry = sorted.find((e) => e.telegramId === selfId) ?? null
  const top = sorted.slice(0, topN)
  return {
    top,
    selfEntry,
    selfRank: selfEntry?.rank ?? null,
    selfInTop: top.some((e) => e.telegramId === selfId),
  }
}
