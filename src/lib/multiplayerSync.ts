import type { LeaderboardEntry, MarketListing, Player, Item, PublicPlayerProfile, MonthlyLeaderboardResponse } from '@/types/game'
import type { ReferralInviteSummary } from '@/types/game'
import { getInitData } from '@/lib/telegram'
import { buildPublicProfile } from '@/lib/publicProfile'
import { getPlayerRankFromPlayer } from '@/lib/playerRank'
import { loadPlayerFromSupabase } from '@/lib/supabase'
import { buildVitalSyncPayload } from '@/lib/botNotifications'
import { normalizeMonthlyStats } from '@/lib/monthlyStats'

function sortLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.floor - a.floor || b.level - a.level || a.displayName.localeCompare(b.displayName, 'ru'))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

/** Подставляет актуальный локальный прогресс игрока в список рейтинга. */
export function applyLiveSelfToLeaderboard(entries: LeaderboardEntry[], self: Player): LeaderboardEntry[] {
  const withoutSelf = entries.filter((e) => e.telegramId !== self.telegramId)
  return sortLeaderboardEntries([
    ...withoutSelf,
    {
      rank: 0,
      telegramId: self.telegramId,
      username: self.username,
      displayName: self.displayName,
      floor: self.highestFloor,
      level: self.level,
      playerRank: getPlayerRankFromPlayer(self),
    },
  ])
}

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

export interface PropertyAvailability {
  propertyId: string
  owned: number
  limit: number
}

export interface PropertyActionResult {
  ok: boolean
  error?: string
  ownedPropertyId?: string | null
  purchasePrice?: number
  availability: PropertyAvailability[]
  totalPlayers: number
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

export async function propertyActionOnServer(
  player: Player,
  opts: { action: 'buy' | 'sell' | 'status'; propertyId?: string; expectedPrice?: number },
): Promise<PropertyActionResult | null> {
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
        propertyAction: opts,
      }),
    })
    const data = await res.json() as {
      error?: string
      property?: PropertyActionResult
    }
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Ошибка сервера', availability: [], totalPlayers: 0 }
    }
    return data.property ?? null
  } catch (error) {
    console.warn('[multiplayer] property action failed', error)
    return null
  }
}

export async function fetchMonthlyLeaderboard(self: Player): Promise<MonthlyLeaderboardResponse | null> {
  try {
    const includeQs = `include=${self.telegramId}`
    const res = await fetch(`/api/multiplayer/leaderboard?scope=monthly&${includeQs}&_=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    const data = await res.json() as MonthlyLeaderboardResponse & { ok?: boolean }
    if (!res.ok || !data.categories) return null
    return { monthKey: data.monthKey, categories: data.categories }
  } catch {
    return null
  }
}

export function applyLiveSelfToMonthlyBoard(
  board: MonthlyLeaderboardResponse,
  self: Player,
): MonthlyLeaderboardResponse {
  const stats = normalizeMonthlyStats(self)
  if (stats.monthKey !== board.monthKey) return board

  return {
    ...board,
    categories: board.categories.map((cat) => {
      const selfValue = (() => {
        switch (cat.categoryId) {
          case 'gold_earned': return stats.goldEarned
          case 'mobs_killed': return stats.mobsKilled
          case 'fish_caught': return stats.fishCaught
          case 'highest_floor': return stats.highestFloor
          default: return 0
        }
      })()
      if (selfValue <= 0) return cat

      const withoutSelf = cat.entries.filter((e) => e.telegramId !== self.telegramId)
      const rows = [
        ...withoutSelf,
        {
          rank: 0,
          telegramId: self.telegramId,
          displayName: self.displayName,
          username: self.username,
          value: selfValue,
        },
      ]
      rows.sort((a, b) => b.value - a.value || a.displayName.localeCompare(b.displayName, 'ru'))
      return {
        ...cat,
        entries: rows.slice(0, 10).map((row, index) => ({ ...row, rank: index + 1 })),
      }
    }),
  }
}

export async function fetchServerLeaderboard(self: Player): Promise<LeaderboardEntry[]> {
  const includeIds = [...new Set([self.telegramId, ...(self.friendIds ?? [])])]
  const params = new URLSearchParams()
  if (includeIds.length) params.set('include', includeIds.join(','))
  params.set('_', String(Date.now()))

  try {
    const res = await fetch(`/api/multiplayer/leaderboard?${params.toString()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    const data = await res.json() as { entries?: LeaderboardEntry[] }
    if (!res.ok || !data.entries?.length) {
      return applyLiveSelfToLeaderboard(buildSelfOnly(self), self)
    }

    return applyLiveSelfToLeaderboard(data.entries, self)
  } catch {
    return applyLiveSelfToLeaderboard(buildSelfOnly(self), self)
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
    playerRank: getPlayerRankFromPlayer(self),
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

export async function settleArenaOnServer(opts: {
  opponentId: number
  victory: boolean
}): Promise<{ ok: boolean; goldStolen?: number; error?: string } | null> {
  const initData = getInitData()
  if (!initData) return null

  try {
    const res = await fetch('/api/multiplayer/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        arenaSettle: {
          opponentId: opts.opponentId,
          victory: opts.victory,
        },
      }),
    })
    const data = await res.json() as { ok?: boolean; goldStolen?: number; error?: string }
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Ошибка арены' }
    }
    return { ok: true, goldStolen: data.goldStolen ?? 0 }
  } catch {
    return null
  }
}

export async function fetchPlayerProfile(telegramId: number): Promise<PublicPlayerProfile | null> {
  try {
    const res = await fetch(`/api/multiplayer/profile?telegramId=${telegramId}`)
    const data = await res.json() as { profile?: PublicPlayerProfile }
    if (res.ok && data.profile) return data.profile
  } catch (error) {
    console.warn('[multiplayer] profile fetch failed', error)
  }

  try {
    const player = await loadPlayerFromSupabase(telegramId)
    if (player) return buildPublicProfile(player)
  } catch (error) {
    console.warn('[multiplayer] profile supabase fallback failed', error)
  }

  return null
}

export async function buyServerMarketListing(listingId: string): Promise<MarketListing | null> {
  const initData = getInitData()
  if (!initData) return null

  try {
    const res = await fetch('/api/multiplayer/market', {
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

export async function fetchStockQuotes(): Promise<{
  quotes: import('@/types/game').StockQuote[]
  topGainers: Array<{ symbolId: string; change7d: number }>
} | null> {
  const initData = getInitData()
  try {
    const qs = initData ? `?initData=${encodeURIComponent(initData)}` : ''
    const res = await fetch(`/api/stocks${qs}`)
    const data = await res.json() as {
      quotes?: import('@/types/game').StockQuote[]
      topGainers?: Array<{ symbolId: string; change7d: number }>
    }
    if (!res.ok || !data.quotes) return null
    return { quotes: data.quotes, topGainers: data.topGainers ?? [] }
  } catch {
    return null
  }
}

export async function tradeStockOnServer(opts: {
  symbolId: string
  side: 'buy' | 'sell'
  shares: number
  expectedPrice: number
  orderType?: 'market' | 'limit'
  limitPrice?: number
}): Promise<{
  ok: boolean
  executed?: boolean
  orderId?: string
  totalGold?: number
  price?: number
  quotes?: import('@/types/game').StockQuote[]
  topGainers?: Array<{ symbolId: string; change7d: number }>
  error?: string
} | null> {
  const initData = getInitData()
  if (!initData) return null
  try {
    const res = await fetch('/api/stocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action: 'trade', ...opts }),
    })
    return await res.json() as {
      ok: boolean
      executed?: boolean
      orderId?: string
      totalGold?: number
      price?: number
      quotes?: import('@/types/game').StockQuote[]
      topGainers?: Array<{ symbolId: string; change7d: number }>
      error?: string
    }
  } catch {
    return null
  }
}
