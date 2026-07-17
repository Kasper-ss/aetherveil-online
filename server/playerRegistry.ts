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
    const { error: publicError } = await supabase.from('public_players').upsert({
      telegram_id: record.telegram_id,
      username: record.username,
      display_name: record.display_name,
      level: record.level,
      highest_floor: record.highest_floor,
      guild_id: record.guild_id ?? null,
      monthly_stats: input.publicProfile?.monthlyStats ?? null,
      updated_at: now,
    })
    if (publicError) {
      console.error('[playerRegistry] public_players upsert failed', publicError.message)
    }
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
    if (input.publicProfile) {
      await supabase.from('player_profiles').upsert({
        telegram_id: input.telegramId,
        profile: input.publicProfile,
        updated_at: now,
      })
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

function mapPublicPlayerRow(row: Record<string, unknown>): PublicPlayerRecord {
  return {
    telegram_id: row.telegram_id as number,
    username: (row.username as string) ?? '',
    display_name: (row.display_name as string) ?? '',
    level: (row.level as number) ?? 1,
    highest_floor: (row.highest_floor as number) ?? 1,
    guild_id: row.guild_id as string | undefined,
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  }
}

function sortPublicPlayerRecords(records: PublicPlayerRecord[]): PublicPlayerRecord[] {
  return [...records].sort(
    (a, b) =>
      b.highest_floor - a.highest_floor
      || b.level - a.level
      || a.display_name.localeCompare(b.display_name, 'ru'),
  )
}

function mapPlayerSaveRow(row: { telegram_id: number; data: unknown; updated_at?: string }): PublicPlayerRecord | null {
  const saved = row.data as {
    username?: string
    displayName?: string
    level?: number
    highestFloor?: number
    guildId?: string
  } | null
  if (!saved) return null
  return {
    telegram_id: row.telegram_id,
    username: saved.username ?? '',
    display_name: saved.displayName ?? '',
    level: saved.level ?? 1,
    highest_floor: saved.highestFloor ?? 1,
    guild_id: saved.guildId,
    updated_at: row.updated_at ?? new Date().toISOString(),
  }
}

async function fetchAllRecordsFromPlayerSaves(): Promise<PublicPlayerRecord[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('players')
    .select('telegram_id, data, updated_at')

  if (error) {
    console.error('[playerRegistry] players fetch failed', error.message)
    return []
  }

  const records: PublicPlayerRecord[] = []
  for (const row of data ?? []) {
    const mapped = mapPlayerSaveRow(row as { telegram_id: number; data: unknown; updated_at?: string })
    if (mapped) records.push(mapped)
  }
  return records
}

async function fetchPublicRecordsFromPlayerSaves(ids: number[]): Promise<PublicPlayerRecord[]> {
  const supabase = getSupabase()
  if (!supabase || ids.length === 0) return []

  const { data } = await supabase
    .from('players')
    .select('telegram_id, data, updated_at')
    .in('telegram_id', ids)

  const records: PublicPlayerRecord[] = []
  for (const row of data ?? []) {
    const mapped = mapPlayerSaveRow(row as { telegram_id: number; data: unknown; updated_at?: string })
    if (mapped) records.push(mapped)
  }
  return records
}

function mergePublicPlayerRecord(
  base: PublicPlayerRecord,
  incoming: PublicPlayerRecord,
): PublicPlayerRecord {
  return {
    telegram_id: base.telegram_id,
    username: incoming.username || base.username,
    display_name: incoming.display_name || base.display_name,
    level: Math.max(base.level, incoming.level),
    highest_floor: Math.max(base.highest_floor, incoming.highest_floor),
    guild_id: incoming.guild_id ?? base.guild_id,
    updated_at: incoming.updated_at > base.updated_at ? incoming.updated_at : base.updated_at,
    profile: base.profile,
  }
}

async function refreshIncludedFromPlayerSaves(
  byId: Map<number, PublicPlayerRecord>,
  ids: number[],
): Promise<void> {
  if (ids.length === 0) return
  for (const fresh of await fetchPublicRecordsFromPlayerSaves(ids)) {
    const existing = byId.get(fresh.telegram_id)
    byId.set(fresh.telegram_id, existing ? mergePublicPlayerRecord(existing, fresh) : fresh)
  }
}

export async function getLeaderboardRecords(includeIds: number[] = []): Promise<PublicPlayerRecord[]> {
  const uniqueInclude = [...new Set(includeIds.filter((id) => Number.isFinite(id) && id > 0))]
  const byId = new Map<number, PublicPlayerRecord>()

  for (const record of await fetchAllRecordsFromPlayerSaves()) {
    byId.set(record.telegram_id, record)
  }

  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('public_players')
      .select('*')
      .limit(500)

    for (const row of data ?? []) {
      const pub = mapPublicPlayerRow(row)
      const existing = byId.get(pub.telegram_id)
      byId.set(pub.telegram_id, existing ? mergePublicPlayerRecord(existing, pub) : pub)
    }
  }

  for (const record of players().values()) {
    const existing = byId.get(record.telegram_id)
    byId.set(record.telegram_id, existing ? mergePublicPlayerRecord(existing, record) : record)
  }

  for (const id of uniqueInclude) {
    if (!byId.has(id)) {
      for (const record of await fetchPublicRecordsFromPlayerSaves([id])) {
        byId.set(record.telegram_id, record)
      }
      const mem = players().get(id)
      if (mem) byId.set(id, mem)
    } else {
      await refreshIncludedFromPlayerSaves(byId, [id])
    }
  }

  if (byId.size > 0) {
    return sortPublicPlayerRecords([...byId.values()]).slice(0, 200)
  }

  return sortPublicPlayerRecords([...byId.values()])
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
    const { data, error } = await supabase
      .from('market_listings')
      .delete()
      .eq('id', listingId)
      .neq('seller_id', buyerId)
      .select('*')
      .maybeSingle()
    if (error || !data) return null
    const listing = data.listing as MarketListingPayload
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
    gold: 0,
    gems: 0,
    stats: { atk: 0, def: 0, hp: 0, crit: 0, speed: 0 },
    equipped: [],
    activeSets: [],
    pvpWins: 0,
    pvpLosses: 0,
  }
}

async function fetchMonthlyProfilesFromPlayerSaves(ids: number[]): Promise<Array<{ id: number; profile: Record<string, unknown> }>> {
  const supabase = getSupabase()
  if (!supabase || ids.length === 0) return []

  const { data } = await supabase.from('players').select('telegram_id, data').in('telegram_id', ids)
  const result: Array<{ id: number; profile: Record<string, unknown> }> = []
  for (const row of data ?? []) {
    const saved = row.data as {
      displayName?: string
      username?: string
      monthlyStats?: Record<string, unknown>
    } | null
    result.push({
      id: row.telegram_id as number,
      profile: {
        displayName: saved?.displayName ?? '',
        username: saved?.username ?? '',
        monthlyStats: saved?.monthlyStats,
      },
    })
  }
  return result
}

async function fetchMonthlyProfilesFromAllPlayerSaves(monthKey: string): Promise<ProfileMap> {
  const profileMap: ProfileMap = new Map()
  const supabase = getSupabase()
  if (!supabase) return profileMap

  const { data } = await supabase.from('players').select('telegram_id, data')
  for (const row of data ?? []) {
    const saved = row.data as {
      displayName?: string
      username?: string
      monthlyStats?: Record<string, unknown>
    } | null
    const stats = saved?.monthlyStats
    if (!stats || stats.monthKey !== monthKey) continue
    profileMap.set(row.telegram_id as number, {
      displayName: saved?.displayName ?? '',
      username: saved?.username ?? '',
      monthlyStats: stats,
    })
  }
  return profileMap
}

function mergeMonthlyProfile(
  base: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const baseStats = base.monthlyStats as Record<string, number> | undefined
  const incomingStats = incoming.monthlyStats as Record<string, number> | undefined
  if (!baseStats || !incomingStats) return { ...base, ...incoming }
  return {
    ...base,
    ...incoming,
    monthlyStats: {
      ...baseStats,
      ...incomingStats,
      monthKey: baseStats.monthKey ?? incomingStats.monthKey,
      goldEarned: Math.max(baseStats.goldEarned ?? 0, incomingStats.goldEarned ?? 0),
      mobsKilled: Math.max(baseStats.mobsKilled ?? 0, incomingStats.mobsKilled ?? 0),
      fishCaught: Math.max(baseStats.fishCaught ?? 0, incomingStats.fishCaught ?? 0),
      highestFloor: Math.max(baseStats.highestFloor ?? 0, incomingStats.highestFloor ?? 0),
    },
  }
}

export async function getMonthlyLeaderboardRecords(includeIds: number[] = []) {
  const uniqueInclude = [...new Set(includeIds.filter((id) => Number.isFinite(id) && id > 0))]
  const monthKey = currentMonthKey()
  const profileMap: ProfileMap = new Map(await fetchMonthlyProfilesFromAllPlayerSaves(monthKey))

  for (const [id, profile] of profiles()) {
    const stats = profile.monthlyStats as Record<string, unknown> | undefined
    if (!stats || stats.monthKey !== monthKey) continue
    const existing = profileMap.get(id)
    profileMap.set(id, existing ? mergeMonthlyProfile(existing, profile) : profile)
  }

  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('public_players')
      .select('telegram_id, username, display_name, monthly_stats')
      .not('monthly_stats', 'is', null)
      .limit(500)

    for (const row of data ?? []) {
      const stats = row.monthly_stats as Record<string, unknown> | null
      if (!stats || stats.monthKey !== monthKey) continue
      const id = row.telegram_id as number
      const incoming = {
        displayName: row.display_name,
        username: row.username,
        monthlyStats: stats,
      }
      const existing = profileMap.get(id)
      profileMap.set(id, existing ? mergeMonthlyProfile(existing, incoming) : incoming)
    }

    for (const { id, profile } of await fetchMonthlyProfilesFromPlayerSaves(uniqueInclude)) {
      const stats = profile.monthlyStats as Record<string, unknown> | undefined
      if (!stats || stats.monthKey !== monthKey) continue
      const existing = profileMap.get(id)
      profileMap.set(id, existing ? mergeMonthlyProfile(existing, profile) : profile)
    }
  }

  return buildMonthlyLeaderboardFromProfiles(profileMap)
}
