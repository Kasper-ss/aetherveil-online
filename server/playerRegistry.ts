import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface PublicPlayerRecord {
  telegram_id: number
  username: string
  display_name: string
  level: number
  highest_floor: number
  guild_id?: string
  updated_at: string
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

const PLAYER_TTL_MS = 7 * 24 * 60 * 60 * 1000

type PlayerMap = Map<number, PublicPlayerRecord>
type ListingMap = Map<string, MarketListingPayload & { created_at: string }>

const globalStore = globalThis as typeof globalThis & {
  __aetherveilPublicPlayers?: PlayerMap
  __aetherveilMarketListings?: ListingMap
}

function players(): PlayerMap {
  if (!globalStore.__aetherveilPublicPlayers) {
    globalStore.__aetherveilPublicPlayers = new Map()
  }
  return globalStore.__aetherveilPublicPlayers
}

function listings(): ListingMap {
  if (!globalStore.__aetherveilMarketListings) {
    globalStore.__aetherveilMarketListings = new Map()
  }
  return globalStore.__aetherveilMarketListings
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

export async function syncPublicPlayer(input: {
  telegramId: number
  username: string
  displayName: string
  level: number
  highestFloor: number
  guildId?: string
  marketListings: MarketListingPayload[]
}) {
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
      updated_at: now,
    })
    await supabase.from('market_listings').delete().eq('seller_id', input.telegramId)
    if (input.marketListings.length > 0) {
      await supabase.from('market_listings').insert(
        input.marketListings.map((l) => ({
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

  for (const [id, listing] of listings().entries()) {
    if (listing.sellerId === input.telegramId) listings().delete(id)
  }
  for (const listing of input.marketListings) {
    listings().set(listing.id, { ...listing, created_at: now })
  }
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
    return listing
  }

  const listing = listings().get(listingId)
  if (!listing || listing.sellerId === buyerId) return null
  listings().delete(listingId)
  const { created_at: _, ...payload } = listing
  return payload
}
