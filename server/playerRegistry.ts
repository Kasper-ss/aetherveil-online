import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buildMonthlyLeaderboardFromProfiles, currentMonthKey } from './monthlyLeaderboard.js'

export interface PublicPlayerRecord {
  telegram_id: number
  username: string
  display_name: string
  level: number
  highest_floor: number
  guild_id?: string
  updated_at: string
  profile?: Record<string, unknown>
}

export interface MarketListingPayload {
  id: string
  sellerId: number
  sellerName: string
  item?: Record<string, unknown>
  resourceId?: string
  resourceAmount?: number
  goldPrice: number
  isPlayerListing?: boolean
}

export interface SyncResult {
  pendingGold: number
  soldListingIds: string[]
}

interface MarketSaleRecord {
  id: string
  listing_id: string
  seller_id: number
  buyer_id: number
  gold_amount: number
  settled: boolean
  created_at: string
}

const PLAYER_TTL_MS = 7 * 24 * 60 * 60 * 1000

type PlayerMap = Map<number, PublicPlayerRecord>
type ProfileMap = Map<number, Record<string, unknown>>
type ListingMap = Map<string, MarketListingPayload & { created_at: string }>
type SalesMap = Map<string, MarketSaleRecord>

const globalStore = globalThis as typeof globalThis & {
  __aetherveilPublicPlayers?: PlayerMap
  __aetherveilPlayerProfiles?: ProfileMap
  __aetherveilMarketListings?: ListingMap
  __aetherveilMarketSales?: SalesMap
}

function players(): PlayerMap {
  if (!globalStore.__aetherveilPublicPlayers) {
    globalStore.__aetherveilPublicPlayers = new Map()
  }
  return globalStore.__aetherveilPublicPlayers
}

function profiles(): ProfileMap {
  if (!globalStore.__aetherveilPlayerProfiles) {
    globalStore.__aetherveilPlayerProfiles = new Map()
  }
  return globalStore.__aetherveilPlayerProfiles
}

function listings(): ListingMap {
  if (!globalStore.__aetherveilMarketListings) {
    globalStore.__aetherveilMarketListings = new Map()
  }
  return globalStore.__aetherveilMarketListings
}

function sales(): SalesMap {
  if (!globalStore.__aetherveilMarketSales) {
    globalStore.__aetherveilMarketSales = new Map()
  }
  return globalStore.__aetherveilMarketSales
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function prunePlayers(map: PlayerMap): PlayerMap {
  const now = Date.now()
  for (const [id, p] of map.entries()) {
    if (now - new Date(p.updated_at).getTime() > PLAYER_TTL_MS) {
      map.delete(id)
    }
  }
  return map
}

async function getSoldListingIdsForSeller(sellerId: number): Promise<Set<string>> {
  const supabase = getSupabase()
  const sold = new Set<string>()

  if (supabase) {
    const { data } = await supabase
      .from('market_sales')
      .select('listing_id')
      .eq('seller_id', sellerId)
    for (const row of data ?? []) {
      sold.add(row.listing_id as string)
    }
    return sold
  }

  for (const sale of sales().values()) {
    if (sale.seller_id === sellerId) sold.add(sale.listing_id)
  }
  return sold
}

async function collectPendingSales(sellerId: number): Promise<{ gold: number; listingIds: string[] }> {
  const supabase = getSupabase()
  let gold = 0
  const listingIds: string[] = []

  if (supabase) {
    const { data } = await supabase
      .from('market_sales')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('settled', false)

    for (const row of data ?? []) {
      gold += row.gold_amount as number
      listingIds.push(row.listing_id as string)
    }

    if (listingIds.length > 0) {
      await supabase
        .from('market_sales')
        .update({ settled: true })
        .eq('seller_id', sellerId)
        .eq('settled', false)
    }
    return { gold, listingIds }
  }

  for (const [id, sale] of sales().entries()) {
    if (sale.seller_id === sellerId && !sale.settled) {
      gold += sale.gold_amount
      listingIds.push(sale.listing_id)
      sales().set(id, { ...sale, settled: true })
    }
  }
  return { gold, listingIds }
}

async function recordMarketSale(input: {
  listingId: string
  sellerId: number
  buyerId: number
  goldAmount: number
}) {
  const id = `sale_${input.listingId}_${Date.now()}`
  const now = new Date().toISOString()
  const record: MarketSaleRecord = {
    id,
    listing_id: input.listingId,
    seller_id: input.sellerId,
    buyer_id: input.buyerId,
    gold_amount: input.goldAmount,
    settled: false,
    created_at: now,
  }

  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('market_sales').insert({
      id: record.id,
      listing_id: record.listing_id,
      seller_id: record.seller_id,
      buyer_id: record.buyer_id,
      gold_amount: record.gold_amount,
      settled: false,
      created_at: now,
    })
  }
  sales().set(id, record)
}

export async function syncPublicPlayer(input: {
  telegramId: number
  username: string
  displayName: string
  level: number
  highestFloor: number
  guildId?: string
  marketListings: MarketListingPayload[]
  publicProfile?: Record<string, unknown>
}): Promise<SyncResult> {
  const payout = await collectPendingSales(input.telegramId)
  const soldIds = await getSoldListingIdsForSeller(input.telegramId)
  const activeListings = input.marketListings.filter((l) => !soldIds.has(l.id))

  const soldFromClient = input.marketListings
    .filter((l) => soldIds.has(l.id))
    .map((l) => l.id)

  const now = new Date().toISOString()
  const record: PublicPlayerRecord = {
    telegram_id: input.telegramId,
    username: input.username,
    display_name: input.displayName,
    level: input.level,
    highest_floor: input.highestFloor,
    guild_id: input.guildId,
    updated_at: now,
  }

  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('public_players').upsert({
      telegram_id: record.telegram_id,
      username: record.username,
      display_name: record.display_name,
      level: record.level,
      highest_floor: record.highest_floor,
      guild_id: record.guild_id ?? null,
      monthly_stats: input.publicProfile?.monthlyStats ?? null,
      updated_at: now,
    })
    await supabase.from('market_listings').delete().eq('seller_id', input.telegramId)
    if (activeListings.length > 0) {
      await supabase.from('market_listings').insert(
        activeListings.map((l) => ({
          id: l.id,
          seller_id: input.telegramId,
          seller_name: l.sellerName,
          listing: l,
          created_at: now,
        })),
      )
    }
  }

  const playerMap = prunePlayers(players())
  playerMap.set(input.telegramId, record)
  if (input.publicProfile) {
    profiles().set(input.telegramId, input.publicProfile)
  }

  for (const [id, listing] of listings().entries()) {
    if (listing.sellerId === input.telegramId) listings().delete(id)
  }
  for (const listing of activeListings) {
    listings().set(listing.id, { ...listing, created_at: now })
  }

  const soldListingIds = [...new Set([...payout.listingIds, ...soldFromClient])]
  return { pendingGold: payout.gold, soldListingIds }
}

export async function getLeaderboardRecords(): Promise<PublicPlayerRecord[]> {
  const supabase = getSupabase()
  if (supabase) {
    const since = new Date(Date.now() - PLAYER_TTL_MS).toISOString()
    const { data } = await supabase
      .from('public_players')
      .select('*')
      .gte('updated_at', since)
      .order('highest_floor', { ascending: false })
      .order('level', { ascending: false })
      .limit(100)
    if (data?.length) {
      return data.map((row) => ({
        telegram_id: row.telegram_id as number,
        username: row.username as string,
        display_name: row.display_name as string,
        level: row.level as number,
        highest_floor: row.highest_floor as number,
        guild_id: row.guild_id as string | undefined,
        updated_at: row.updated_at as string,
      }))
    }
  }

  return [...prunePlayers(players()).values()].sort(
    (a, b) => b.highest_floor - a.highest_floor || b.level - a.level,
  )
}

export async function getMarketListingRecords(): Promise<MarketListingPayload[]> {
  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('market_listings')
      .select('listing')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data?.length) {
      return data.map((row) => row.listing as MarketListingPayload)
    }
  }

  return [...listings().values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(({ created_at: _, ...listing }) => listing)
}

export async function buyMarketListing(
  buyerId: number,
  listingId: string,
): Promise<MarketListingPayload | null> {
  const supabase = getSupabase()

  if (supabase) {
    const { data } = await supabase
      .from('market_listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle()
    if (!data) return null
    const listing = data.listing as MarketListingPayload
    if (listing.sellerId === buyerId) return null
    await supabase.from('market_listings').delete().eq('id', listingId)
    listings().delete(listingId)
    await recordMarketSale({
      listingId,
      sellerId: listing.sellerId,
      buyerId,
      goldAmount: listing.goldPrice,
    })
    return listing
  }

  const listing = listings().get(listingId)
  if (!listing || listing.sellerId === buyerId) return null
  listings().delete(listingId)
  const { created_at: _, ...payload } = listing
  await recordMarketSale({
    listingId,
    sellerId: payload.sellerId,
    buyerId,
    goldAmount: payload.goldPrice,
  })
  return payload
}

export async function getPlayerProfileRecord(telegramId: number): Promise<Record<string, unknown> | null> {
  const cached = profiles().get(telegramId)
  if (cached) return cached

  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('player_profiles')
      .select('profile')
      .eq('telegram_id', telegramId)
      .maybeSingle()
    if (data?.profile) {
      const profile = data.profile as Record<string, unknown>
      profiles().set(telegramId, profile)
      return profile
    }
  }

  const player = players().get(telegramId)
  if (!player) return null

  return {
    telegramId: player.telegram_id,
    displayName: player.display_name,
    username: player.username,
    level: player.level,
    highestFloor: player.highest_floor,
    guildId: player.guild_id,
    stats: { atk: 0, def: 0, hp: 0, crit: 0, speed: 0 },
    equipped: [],
    pvpWins: 0,
    pvpLosses: 0,
  }
}

export async function getMonthlyLeaderboardRecords() {
  const profileMap: ProfileMap = new Map(profiles())

  const supabase = getSupabase()
  if (supabase) {
    const since = new Date(Date.now() - PLAYER_TTL_MS).toISOString()
    const monthKey = currentMonthKey()
    const { data } = await supabase
      .from('public_players')
      .select('telegram_id, username, display_name, monthly_stats')
      .gte('updated_at', since)

    for (const row of data ?? []) {
      const stats = row.monthly_stats as Record<string, unknown> | null
      if (!stats || stats.monthKey !== monthKey) continue
      const id = row.telegram_id as number
      const existing = profileMap.get(id) ?? {}
      profileMap.set(id, {
        ...existing,
        displayName: row.display_name,
        username: row.username,
        monthlyStats: stats,
      })
    }
  }

  return buildMonthlyLeaderboardFromProfiles(profileMap)
}
