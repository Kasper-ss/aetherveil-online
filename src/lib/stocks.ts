import type { Player, StockQuote } from '@/types/game'
import { getStockDailyDividendRate, STOCK_SYMBOLS } from '@/data/stocks'

export function buildDefaultStockQuotes(): StockQuote[] {
  return STOCK_SYMBOLS.map((sym) => ({
    symbolId: sym.id,
    price: sym.basePrice,
    change24h: 0,
    change7d: 0,
    history7d: Array.from({ length: 7 }, () => sym.basePrice),
    dividendRateDaily: (sym.dividendMin + sym.dividendMax) / 2,
  }))
}

export function getPortfolioValue(player: Player, quotes: StockQuote[]): number {
  const portfolio = player.stockPortfolio ?? {}
  let total = 0
  for (const q of quotes) {
    const pos = portfolio[q.symbolId]
    if (pos?.shares) total += pos.shares * q.price
  }
  return total
}

export function accrueStockDividends(player: Player, quotes: StockQuote[]): number {
  const portfolio = player.stockPortfolio ?? {}
  const lastAt = player.stockLastDividendAt
    ? new Date(player.stockLastDividendAt).getTime()
    : Date.now() - 60_000
  const elapsedMs = Date.now() - lastAt
  if (elapsedMs < 60_000) return 0

  const dayMs = 24 * 60 * 60 * 1000
  const days = elapsedMs / dayMs
  if (days <= 0) return 0

  let accrued = 0
  for (const sym of STOCK_SYMBOLS) {
    const pos = portfolio[sym.id]
    if (!pos?.shares) continue
    const quote = quotes.find((q) => q.symbolId === sym.id)
    const price = quote?.price ?? sym.basePrice
    const invested = pos.shares * price
    const rate = quote?.dividendRateDaily ?? getStockDailyDividendRate(sym.id)
    accrued += Math.floor(invested * rate * days)
  }
  return accrued
}

export function formatStockChange(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${(pct * 100).toFixed(1)}%`
}

export function formatStockPrice(price: number): string {
  return Math.floor(price).toLocaleString('ru-RU')
}

export function getVolatilityLabelRu(volatility: string): string {
  if (volatility === 'very_low') return 'Очень низкая'
  if (volatility === 'low') return 'Низкая'
  if (volatility === 'medium') return 'Средняя'
  return 'Высокая'
}
