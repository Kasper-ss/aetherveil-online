import type { LeaderboardEntry, MarketListing, Player, Item, PublicPlayerProfile, MonthlyLeaderboardResponse } from '@/types/game'
import type { ReferralInviteSummary } from '@/types/game'
import { getInitData } from '@/lib/telegram'
import { buildPublicProfile } from '@/lib/publicProfile'
import { buildVitalSyncPayload } from '@/lib/botNotifications'

function mapListing(raw: MarketListing): MarketListing {
  return {
    ...raw,
    item: raw.item ? (raw.item as Item) : undefined,
  }
}

export interface SyncResult {
  pendingGold: number
  soldListingIds: string[]
  pendingReferralGold: number
  pendingReferralGems: number
  pendingReferralItems: string[]
  referrals: ReferralInviteSummary[]
  incomingGifts?: Array<{ fromId: number; fromName: string; item: Item }>
}

export async function syncPlayerToServer(
  player: Player,
  opts?: { claimReferralRewards?: boolean },
): Promise<SyncResult | null> {
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
        publicProfile: buildPublicProfile(player),
        vitals: buildVitalSyncPayload(player),
        referredBy: player.referredBy,
        lifetimeGoldEarned: player.lifetimeGoldEarned ?? 0,
        classSelected: player.classSelected,
        tutorialCompleted: player.tutorialCompleted,
        claimReferralRewards: opts?.claimReferralRewards ?? false,
      }),
    })
    const data = await res.json() as {
      pendingGold?: number
      soldListingIds?: string[]
      pendingReferralGold?: number
      pendingReferralGems?: number
      pendingReferralItems?: string[]
      referrals?: ReferralInviteSummary[]
      incomingGifts?: Array<{ fromId: number; fromName: string; item: Item }>
    }
    if (!res.ok) return null
    return {
      pendingGold: data.pendingGold ?? 0,
      soldListingIds: data.soldListingIds ?? [],
      pendingReferralGold: data.pendingReferralGold ?? 0,
      pendingReferralGems: data.pendingReferralGems ?? 0,
      pendingReferralItems: data.pendingReferralItems ?? [],
      referrals: data.referrals ?? [],
      incomingGifts: data.incomingGifts ?? [],
    }
  } catch (error) {
    console.warn('[multiplayer] sync failed', error)
    return null
  }
}

export async function fetchMonthlyLeaderboard(): Promise<MonthlyLeaderboardResponse | null> {
  try {
    const res = await fetch('/api/multiplayer/monthly-leaderboard')
    const data = await res.json() as MonthlyLeaderboardResponse & { ok?: boolean }
    if (!res.ok || !data.categories) return null
    return { monthKey: data.monthKey, categories: data.categories }
  } catch {
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
  const friendSet = new Set([self.telegramId, ...(self.friendIds ?? [])])
  const filtered = entries.filter((e) => friendSet.has(e.telegramId))
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

export async function fetchPlayerProfile(telegramId: number): Promise<PublicPlayerProfile | null> {
  try {
    const res = await fetch(`/api/multiplayer/profile?telegramId=${telegramId}`)
    const data = await res.json() as { profile?: PublicPlayerProfile }
    if (!res.ok || !data.profile) return null
    return data.profile
  } catch {
    return null
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
