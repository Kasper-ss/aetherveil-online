import type { LeaderboardEntry, MarketListing, Player, Item } from '@/types/game'
import { getInitData } from '@/lib/telegram'

function mapListing(raw: MarketListing): MarketListing {
  return {
    ...raw,
    item: raw.item ? (raw.item as Item) : undefined,
  }
}

export interface SyncResult {
  pendingGold: number
  soldListingIds: string[]
}

export async function syncPlayerToServer(player: Player): Promise<SyncResult | null> {
  const initData = getInitData()
  if (!initData) return null

  try {
    const res = await fetch('/api/multiplayer/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        level: player.level,
        highestFloor: player.highestFloor,
        displayName: player.displayName,
        username: player.username,
        guildId: player.guildId,
        marketListings: player.marketListings.map((l) => ({
          ...l,
          sellerId: player.telegramId,
        })),
      }),
    })
    const data = await res.json() as { pendingGold?: number; soldListingIds?: string[] }
    if (!res.ok) return null
    return {
      pendingGold: data.pendingGold ?? 0,
      soldListingIds: data.soldListingIds ?? [],
    }
  } catch (error) {
    console.warn('[multiplayer] sync failed', error)
    return null
  }
}

export async function fetchServerLeaderboard(self: Player): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/multiplayer/leaderboard')
    const data = await res.json() as { entries?: LeaderboardEntry[] }
    if (!res.ok || !data.entries) return buildSelfOnly(self)

    const hasSelf = data.entries.some((e) => e.telegramId === self.telegramId)
    const entries = hasSelf
      ? data.entries
      : [
          ...data.entries,
          {
            rank: 0,
            telegramId: self.telegramId,
            username: self.username,
            displayName: self.displayName,
            floor: self.highestFloor,
            level: self.level,
          },
        ]

    return entries
      .sort((a, b) => b.floor - a.floor || b.level - a.level || a.displayName.localeCompare(b.displayName, 'ru'))
      .map((entry, index) => ({ ...entry, rank: index + 1 }))
  } catch {
    return buildSelfOnly(self)
  }
}

function buildSelfOnly(self: Player): LeaderboardEntry[] {
  return [{
    rank: 1,
    telegramId: self.telegramId,
    username: self.username,
    displayName: self.displayName,
    floor: self.highestFloor,
    level: self.level,
  }]
}

export function filterFriendsLeaderboard(entries: LeaderboardEntry[], self: Player): LeaderboardEntry[] {
  const guildId = self.guildId
  const filtered = entries.filter(
    (e) => e.telegramId === self.telegramId || (guildId && e.guildId === guildId),
  )
  return filtered.map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export async function fetchServerMarket(selfId: number): Promise<MarketListing[]> {
  try {
    const res = await fetch('/api/multiplayer/market')
    const data = await res.json() as { listings?: MarketListing[] }
    if (!res.ok || !data.listings) return []
    return data.listings
      .filter((l) => l.sellerId !== selfId)
      .map(mapListing)
  } catch {
    return []
  }
}

export async function buyServerMarketListing(listingId: string): Promise<MarketListing | null> {
  const initData = getInitData()
  if (!initData) return null

  try {
    const res = await fetch('/api/multiplayer/market-buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, listingId }),
    })
    const data = await res.json() as { listing?: MarketListing; error?: string }
    if (!res.ok || !data.listing) return null
    return mapListing(data.listing)
  } catch {
    return null
  }
}
