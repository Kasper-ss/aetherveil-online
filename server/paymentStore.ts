import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type PaymentStatus = 'pending' | 'paid' | 'fulfilled'

export interface PaymentRecord {
  payload: string
  telegram_id: number
  product_id: string
  stars: number
  status: PaymentStatus
  charge_id?: string | null
  created_at?: string
  paid_at?: string | null
  fulfilled_at?: string | null
}

type MemoryStore = Map<string, PaymentRecord>

const globalStore = globalThis as typeof globalThis & { __aetherveilPayments?: MemoryStore }

function memoryStore(): MemoryStore {
  if (!globalStore.__aetherveilPayments) {
    globalStore.__aetherveilPayments = new Map()
  }
  return globalStore.__aetherveilPayments
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function createPendingPayment(record: PaymentRecord): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('star_payments').insert({
      payload: record.payload,
      telegram_id: record.telegram_id,
      product_id: record.product_id,
      stars: record.stars,
      status: 'pending',
    })
    if (error) {
      console.error('[paymentStore] Supabase insert failed, using memory:', error.message)
      memoryStore().set(record.payload, { ...record, status: 'pending' })
      return
    }
    return
  }
  memoryStore().set(record.payload, { ...record, status: 'pending' })
}

export async function getPayment(payload: string): Promise<PaymentRecord | null> {
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase
      .from('star_payments')
      .select('*')
      .eq('payload', payload)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data as PaymentRecord | null
  }
  return memoryStore().get(payload) ?? null
}

export async function markPaymentPaid(payload: string, chargeId?: string): Promise<void> {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  if (supabase) {
    const { error } = await supabase
      .from('star_payments')
      .update({ status: 'paid', paid_at: now, charge_id: chargeId ?? null })
      .eq('payload', payload)
      .neq('status', 'fulfilled')
    if (error) throw new Error(error.message)
    return
  }
  const record = memoryStore().get(payload)
  if (record && record.status !== 'fulfilled') {
    memoryStore().set(payload, { ...record, status: 'paid', paid_at: now, charge_id: chargeId })
  }
}

export async function markPaymentFulfilled(payload: string): Promise<boolean> {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  if (supabase) {
    const { data, error } = await supabase
      .from('star_payments')
      .update({ status: 'fulfilled', fulfilled_at: now })
      .eq('payload', payload)
      .eq('status', 'paid')
      .select('payload')
    if (error) throw new Error(error.message)
    return (data?.length ?? 0) > 0
  }
  const record = memoryStore().get(payload)
  if (!record || record.status !== 'paid') return false
  memoryStore().set(payload, { ...record, status: 'fulfilled', fulfilled_at: now })
  return true
}
