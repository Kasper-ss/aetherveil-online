import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface PropertyOwnershipRecord {
  owner_id: number
  property_id: string
  purchase_price: number
  created_at: string
}

export interface PropertyAvailabilityDto {
  propertyId: string
  owned: number
  limit: number
}

export interface PropertyActionResult {
  ok: boolean
  error?: string
  ownedPropertyId?: string | null
  purchasePrice?: number
  availability: PropertyAvailabilityDto[]
  totalPlayers: number
}

const globalStore = globalThis as typeof globalThis & {
  __aetherveilPropertyOwnership?: Map<number, PropertyOwnershipRecord>
}

function ownershipMap(): Map<number, PropertyOwnershipRecord> {
  if (!globalStore.__aetherveilPropertyOwnership) {
    globalStore.__aetherveilPropertyOwnership = new Map()
  }
  return globalStore.__aetherveilPropertyOwnership
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Owner slots per property type — grows with total registered players. */
export function getPropertyOwnerLimit(totalPlayers: number): number {
  if (totalPlayers < 15) return 5
  if (totalPlayers < 40) return 10
  if (totalPlayers < 100) return 20
  if (totalPlayers < 250) return 35
  return 50
}

const PROPERTY_IDS = [
  'forest_hut', 'stone_cottage', 'fortified_house', 'guard_tower', 'hunter_villa',
  'master_mansion', 'seeker_castle', 'sky_penthouse', 'legend_fortress', 'ascension_townhouse',
]

async function countTotalPlayers(): Promise<number> {
  const supabase = getSupabase()
  if (supabase) {
    const { count } = await supabase
      .from('public_players')
      .select('*', { count: 'exact', head: true })
    if (typeof count === 'number' && count > 0) return count
  }
  return Math.max(1, ownershipMap().size)
}

async function loadAllOwnership(): Promise<PropertyOwnershipRecord[]> {
  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase.from('property_ownership').select('*')
    const rows = (data ?? []) as PropertyOwnershipRecord[]
    for (const row of rows) {
      ownershipMap().set(row.owner_id, row)
    }
    return rows
  }
  return [...ownershipMap().values()]
}

async function saveOwnership(record: PropertyOwnershipRecord): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('property_ownership').upsert({
      owner_id: record.owner_id,
      property_id: record.property_id,
      purchase_price: record.purchase_price,
      created_at: record.created_at,
    }, { onConflict: 'owner_id' })
  }
  ownershipMap().set(record.owner_id, record)
}

async function deleteOwnership(ownerId: number): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('property_ownership').delete().eq('owner_id', ownerId)
  }
  ownershipMap().delete(ownerId)
}

function buildAvailability(rows: PropertyOwnershipRecord[], totalPlayers: number): PropertyAvailabilityDto[] {
  const limit = getPropertyOwnerLimit(totalPlayers)
  const counts: Record<string, number> = {}
  for (const id of PROPERTY_IDS) counts[id] = 0
  for (const row of rows) {
    counts[row.property_id] = (counts[row.property_id] ?? 0) + 1
  }
  return PROPERTY_IDS.map((propertyId) => ({
    propertyId,
    owned: counts[propertyId] ?? 0,
    limit,
  }))
}

export async function getPropertyStatus(telegramId: number): Promise<Omit<PropertyActionResult, 'ok'>> {
  const rows = await loadAllOwnership()
  const totalPlayers = await countTotalPlayers()
  const mine = rows.find((r) => r.owner_id === telegramId)
  return {
    ownedPropertyId: mine?.property_id ?? null,
    purchasePrice: mine?.purchase_price,
    availability: buildAvailability(rows, totalPlayers),
    totalPlayers,
  }
}

export async function processPropertyAction(input: {
  telegramId: number
  action?: 'buy' | 'sell' | 'status'
  propertyId?: string
  expectedPrice?: number
}): Promise<PropertyActionResult> {
  const rows = await loadAllOwnership()
  const totalPlayers = await countTotalPlayers()
  const availability = buildAvailability(rows, totalPlayers)
  const limit = getPropertyOwnerLimit(totalPlayers)
  const existing = rows.find((r) => r.owner_id === input.telegramId)

  if (!input.action || input.action === 'status') {
    return {
      ok: true,
      ownedPropertyId: existing?.property_id ?? null,
      purchasePrice: existing?.purchase_price,
      availability,
      totalPlayers,
    }
  }

  if (input.action === 'sell') {
    if (!existing) {
      return { ok: false, error: 'У вас нет дома', availability, totalPlayers }
    }
    await deleteOwnership(input.telegramId)
    const refreshed = buildAvailability(rows.filter((r) => r.owner_id !== input.telegramId), totalPlayers)
    return {
      ok: true,
      ownedPropertyId: null,
      purchasePrice: 0,
      availability: refreshed,
      totalPlayers,
    }
  }

  if (input.action === 'buy') {
    if (!input.propertyId) {
      return { ok: false, error: 'Не указан дом', availability, totalPlayers }
    }
    if (existing) {
      return { ok: false, error: 'Сначала продайте текущий дом', availability, totalPlayers }
    }
    if (!PROPERTY_IDS.includes(input.propertyId)) {
      return { ok: false, error: 'Неизвестный дом', availability, totalPlayers }
    }
    const slot = availability.find((a) => a.propertyId === input.propertyId)
    if (slot && slot.owned >= limit) {
      return { ok: false, error: 'Все слоты этого дома заняты', availability, totalPlayers }
    }
    const price = input.expectedPrice ?? 0
    if (price <= 0) {
      return { ok: false, error: 'Неверная цена', availability, totalPlayers }
    }

    const now = new Date().toISOString()
    await saveOwnership({
      owner_id: input.telegramId,
      property_id: input.propertyId,
      purchase_price: price,
      created_at: now,
    })
    const newRows = [...rows.filter((r) => r.owner_id !== input.telegramId), {
      owner_id: input.telegramId,
      property_id: input.propertyId,
      purchase_price: price,
      created_at: now,
    }]
    return {
      ok: true,
      ownedPropertyId: input.propertyId,
      purchasePrice: price,
      availability: buildAvailability(newRows, totalPlayers),
      totalPlayers,
    }
  }

  return { ok: false, error: 'Неизвестное действие', availability, totalPlayers }
}
