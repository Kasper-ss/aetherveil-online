import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { STOCK_SYMBOLS, VOLATILITY_SWING, type StockVolatility } from './stockData.js'

export interface StockQuoteDto {
  symbolId: string
  price: number
  change24h: number
  change7d: number
  history7d: number[]
  dividendRateDaily: number
}

export interface StockLimitOrderDto {
  id: string
  ownerId: number
  symbolId: string
  side: 'buy' | 'sell'
  limitPrice: number
  shares: number
  status: 'open' | 'filled' | 'cancelled'
  createdAt: string
}

export interface StockTradeResult {
  ok: boolean
  error?: string
  executed?: boolean
  orderId?: string
  symbolId?: string
  side?: 'buy' | 'sell'
  shares?: number
  price?: number
  totalGold?: number
  quotes?: StockQuoteDto[]
  topGainers?: Array<{ symbolId: string; change7d: number }>
  filledOrders?: StockLimitOrderDto[]
}

interface SymbolState {
  symbolId: string
  price: number
  lastTickAt: string
  history: Array<{ price: number; at: string }>
  price7dAgo: number
}

const globalStore = globalThis as typeof globalThis & {
  __aetherveilStockState?: Map<string, SymbolState>
  __aetherveilStockOrders?: Map<string, StockLimitOrderDto>
  __aetherveilStockWeekStart?: Record<string, number>
}

function stateMap(): Map<string, SymbolState> {
  if (!globalStore.__aetherveilStockState) {
    globalStore.__aetherveilStockState = new Map()
    for (const sym of STOCK_SYMBOLS) {
      globalStore.__aetherveilStockState.set(sym.id, {
        symbolId: sym.id,
        price: sym.basePrice,
        lastTickAt: new Date().toISOString(),
        history: [{ price: sym.basePrice, at: new Date().toISOString() }],
        price7dAgo: sym.basePrice,
      })
    }
  }
  return globalStore.__aetherveilStockState
}

function ordersMap(): Map<string, StockLimitOrderDto> {
  if (!globalStore.__aetherveilStockOrders) {
    globalStore.__aetherveilStockOrders = new Map()
  }
  return globalStore.__aetherveilStockOrders
}

function weekStartMap(): Record<string, number> {
  if (!globalStore.__aetherveilStockWeekStart) {
    globalStore.__aetherveilStockWeekStart = {}
    for (const sym of STOCK_SYMBOLS) {
      globalStore.__aetherveilStockWeekStart[sym.id] = sym.basePrice
    }
  }
  return globalStore.__aetherveilStockWeekStart
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function volImpactMult(volatility: StockVolatility): number {
  if (volatility === 'very_low') return 0.6
  if (volatility === 'low') return 0.85
  if (volatility === 'medium') return 1
  return 1.25
}

function clampPrice(price: number, base: number): number {
  return Math.max(Math.floor(base * 0.35), Math.min(Math.floor(base * 3.5), Math.floor(price)))
}

function recordHistory(state: SymbolState, price: number) {
  const now = new Date().toISOString()
  state.history.push({ price, at: now })
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  state.history = state.history.filter((h) => new Date(h.at).getTime() >= cutoff)
  if (state.history.length === 0) state.history.push({ price, at: now })
  const oldest = state.history[0]
  state.price7dAgo = oldest?.price ?? price
}

function applyDailyTick(state: SymbolState, volatility: StockVolatility, basePrice: number) {
  const [minSwing, maxSwing] = VOLATILITY_SWING[volatility]
  const swing = minSwing + Math.random() * (maxSwing - minSwing)
  const dir = Math.random() < 0.5 ? -1 : 1
  state.price = clampPrice(state.price * (1 + dir * swing), basePrice)
  state.lastTickAt = new Date().toISOString()
  recordHistory(state, state.price)
}

async function loadStateFromDb(): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const { data } = await supabase.from('stock_market_state').select('*')
  for (const row of data ?? []) {
    const r = row as { symbol_id: string; price: number; last_tick_at: string; history: unknown; price_7d_ago: number }
    const sym = STOCK_SYMBOLS.find((s) => s.id === r.symbol_id)
    let price = Number(r.price)
    const now = new Date().toISOString()
    if (sym && price < sym.basePrice * 0.25) {
      price = sym.basePrice
      const migrated: SymbolState = {
        symbolId: r.symbol_id,
        price,
        lastTickAt: now,
        history: [{ price, at: now }],
        price7dAgo: price,
      }
      stateMap().set(r.symbol_id, migrated)
      await persistState(migrated)
      continue
    }
    stateMap().set(r.symbol_id, {
      symbolId: r.symbol_id,
      price,
      lastTickAt: r.last_tick_at,
      history: Array.isArray(r.history) ? r.history as Array<{ price: number; at: string }> : [],
      price7dAgo: Number(r.price_7d_ago ?? r.price),
    })
  }
}

async function persistState(state: SymbolState): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.from('stock_market_state').upsert({
    symbol_id: state.symbolId,
    price: state.price,
    last_tick_at: state.lastTickAt,
    history: state.history,
    price_7d_ago: state.price7dAgo,
  })
}

async function ensureMarketTicked(): Promise<void> {
  await loadStateFromDb()
  const map = stateMap()
  const now = Date.now()
  for (const sym of STOCK_SYMBOLS) {
    let state = map.get(sym.id)
    if (!state) {
      state = {
        symbolId: sym.id,
        price: sym.basePrice,
        lastTickAt: new Date().toISOString(),
        history: [{ price: sym.basePrice, at: new Date().toISOString() }],
        price7dAgo: sym.basePrice,
      }
      map.set(sym.id, state)
    } else if (state.price < sym.basePrice * 0.25) {
      const nowIso = new Date().toISOString()
      state.price = sym.basePrice
      state.lastTickAt = nowIso
      state.history = [{ price: sym.basePrice, at: nowIso }]
      state.price7dAgo = sym.basePrice
      await persistState(state)
    }
    const lastTick = new Date(state.lastTickAt).getTime()
    const dayMs = 24 * 60 * 60 * 1000
    if (now - lastTick >= dayMs) {
      const days = Math.min(3, Math.floor((now - lastTick) / dayMs))
      for (let d = 0; d < days; d++) {
        applyDailyTick(state, sym.volatility, sym.basePrice)
      }
      await persistState(state)
    }
    const weekKey = getWeekKey()
    const ws = weekStartMap()
    if (!ws[`${sym.id}_${weekKey}`]) {
      ws[`${sym.id}_${weekKey}`] = state.price
    }
  }
}

function getWeekKey(): string {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

function buildHistory7d(state: SymbolState): number[] {
  const dayMs = 24 * 60 * 60 * 1000
  const buckets: number[] = []
  for (let i = 6; i >= 0; i--) {
    const target = Date.now() - i * dayMs
    let closest = state.price
    let bestDiff = Infinity
    for (const h of state.history) {
      const diff = Math.abs(new Date(h.at).getTime() - target)
      if (diff < bestDiff) {
        bestDiff = diff
        closest = h.price
      }
    }
    buckets.push(closest)
  }
  buckets[buckets.length - 1] = state.price
  return buckets
}

function adjustPrice(state: SymbolState, side: 'buy' | 'sell', shares: number, volatility: StockVolatility, basePrice: number) {
  const impact = Math.min(0.08, shares * 0.0015 * volImpactMult(volatility))
  const mult = side === 'buy' ? 1 + impact : 1 - impact
  state.price = clampPrice(state.price * mult, basePrice)
  recordHistory(state, state.price)
}

function matchLimitOrders(symbolId: string, price: number): StockLimitOrderDto[] {
  const filled: StockLimitOrderDto[] = []
  for (const [id, order] of ordersMap()) {
    if (order.status !== 'open' || order.symbolId !== symbolId) continue
    const canFill = order.side === 'buy' ? price <= order.limitPrice : price >= order.limitPrice
    if (!canFill) continue
    const done = { ...order, status: 'filled' as const }
    ordersMap().set(id, done)
    filled.push(done)
  }
  return filled
}

export async function getStockQuotes(): Promise<{
  quotes: StockQuoteDto[]
  topGainers: Array<{ symbolId: string; change7d: number }>
  openOrders: StockLimitOrderDto[]
}> {
  await ensureMarketTicked()
  const quotes: StockQuoteDto[] = []
  const gainers: Array<{ symbolId: string; change7d: number }> = []

  for (const sym of STOCK_SYMBOLS) {
    const state = stateMap().get(sym.id)!
    const history7d = buildHistory7d(state)
    const change7d = state.price7dAgo > 0
      ? (state.price - state.price7dAgo) / state.price7dAgo
      : 0
    const prev = history7d[history7d.length - 2] ?? state.price
    const change24h = prev > 0 ? (state.price - prev) / prev : 0
    quotes.push({
      symbolId: sym.id,
      price: state.price,
      change24h,
      change7d,
      history7d,
      dividendRateDaily: (sym.dividendMin + sym.dividendMax) / 2,
    })
    gainers.push({ symbolId: sym.id, change7d })
  }

  gainers.sort((a, b) => b.change7d - a.change7d)
  const openOrders = [...ordersMap().values()].filter((o) => o.status === 'open')

  return { quotes, topGainers: gainers.slice(0, 5), openOrders }
}

export async function processStockTrade(opts: {
  telegramId: number
  symbolId: string
  side: 'buy' | 'sell'
  shares: number
  expectedPrice: number
  orderType?: 'market' | 'limit'
  limitPrice?: number
}): Promise<StockTradeResult> {
  await ensureMarketTicked()
  const sym = STOCK_SYMBOLS.find((s) => s.id === opts.symbolId)
  if (!sym) return { ok: false, error: 'Неизвестная акция' }
  if (opts.shares < 1 || opts.shares > 9999) return { ok: false, error: 'Некорректное количество' }

  const state = stateMap().get(sym.id)!
  const currentPrice = state.price

  if (opts.orderType === 'limit') {
    if (!opts.limitPrice || opts.limitPrice < 1) {
      return { ok: false, error: 'Укажите лимитную цену' }
    }
    const id = `lo_${opts.telegramId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const order: StockLimitOrderDto = {
      id,
      ownerId: opts.telegramId,
      symbolId: sym.id,
      side: opts.side,
      limitPrice: opts.limitPrice,
      shares: opts.shares,
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    ordersMap().set(id, order)

    const canFillNow = opts.side === 'buy'
      ? currentPrice <= opts.limitPrice
      : currentPrice >= opts.limitPrice
    if (!canFillNow) {
      const { quotes, topGainers } = await getStockQuotes()
      return {
        ok: true,
        executed: false,
        orderId: id,
        symbolId: sym.id,
        side: opts.side,
        shares: opts.shares,
        price: opts.limitPrice,
        quotes,
        topGainers,
      }
    }
    ordersMap().set(id, { ...order, status: 'filled' })
  }

  if (Math.abs(currentPrice - opts.expectedPrice) > Math.max(2, Math.floor(currentPrice * 0.05))) {
    return { ok: false, error: 'Цена изменилась — обновите котировки' }
  }

  const execPrice = opts.orderType === 'limit' && opts.limitPrice
    ? opts.limitPrice
    : currentPrice
  const totalGold = execPrice * opts.shares

  adjustPrice(state, opts.side, opts.shares, sym.volatility, sym.basePrice)
  await persistState(state)
  const filledOrders = matchLimitOrders(sym.id, state.price)
  const { quotes, topGainers } = await getStockQuotes()

  return {
    ok: true,
    executed: true,
    symbolId: sym.id,
    side: opts.side,
    shares: opts.shares,
    price: execPrice,
    totalGold,
    quotes,
    topGainers,
    filledOrders,
  }
}

export async function cancelStockLimitOrder(telegramId: number, orderId: string): Promise<boolean> {
  const order = ordersMap().get(orderId)
  if (!order || order.ownerId !== telegramId || order.status !== 'open') return false
  ordersMap().set(orderId, { ...order, status: 'cancelled' })
  return true
}

export async function getOpenStockOrders(telegramId: number): Promise<StockLimitOrderDto[]> {
  return [...ordersMap().values()].filter((o) => o.ownerId === telegramId && o.status === 'open')
}
