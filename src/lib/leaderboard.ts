import type { LeaderboardEntry, Player } from '@/types/game'
import { fetchServerLeaderboard, filterFriendsLeaderboard } from '@/lib/multiplayerSync'

export async function getLeaderboardEntries(self: Player, friendsOnly = false): Promise<LeaderboardEntry[]> {
  const entries = await fetchServerLeaderboard(self)
  if (friendsOnly) return filterFriendsLeaderboard(entries, self)
  return entries
}
