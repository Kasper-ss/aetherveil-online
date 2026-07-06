import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { STOCK_SYMBOLS, STOCKS_UNLOCK_FLOOR, getStockSymbol } from '@/data/stocks'
import { fetchStockQuotes, tradeStockOnServer } from '@/lib/multiplayerSync'
import { formatNumber } from '@/lib/utils'
import {
  buildDefaultStockQuotes,
  formatStockChange,
  formatStockPrice,
  getPortfolioValue,
  getVolatilityLabelRu,
} from '@/lib/stocks'
import { hapticError, hapticSuccess } from '@/lib/telegram'
import type { Player, StockQuote } from '@/types/game'

function MiniChart({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 120
  const h = 36
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        fill="none"
        stroke={positive ? '#22d3ee' : '#f87171'}
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}

export function StockMarketPanel({ player }: { player: Player }) {
  const buyStock = usePlayerStore((s) => s.buyStock)
  const sellStock = usePlayerStore((s) => s.sellStock)
  const collectStockDividends = usePlayerStore((s) => s.collectStockDividends)
  const accrueStockDividendsStore = usePlayerStore((s) => s.accrueStockDividends)
  const cancelStockLimitOrder = usePlayerStore((s) => s.cancelStockLimitOrder)
  const addStockLimitOrder = usePlayerStore((s) => s.addStockLimitOrder)

  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [topGainers, setTopGainers] = useState<Array<{ symbolId: string; change7d: number }>>([])
  const [selectedId, setSelectedId] = useState(STOCK_SYMBOLS[0]?.id ?? '')
  const [shares, setShares] = useState('1')
  const [limitPrice, setLimitPrice] = useState('')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [loading, setLoading] = useState(false)

  const loadQuotes = useCallback(async () => {
    const data = await fetchStockQuotes()
    const quotes = data?.quotes?.length ? data.quotes : buildDefaultStockQuotes()
    setQuotes(quotes)
    setTopGainers(data?.topGainers ?? [])
    if (quotes.length && !selectedId) setSelectedId(quotes[0].symbolId)
    accrueStockDividendsStore(quotes)
  }, [accrueStockDividendsStore, selectedId])

  useEffect(() => {
    loadQuotes()
    const id = setInterval(loadQuotes, 30_000)
    return () => clearInterval(id)
  }, [loadQuotes])

  if (player.highestFloor < STOCKS_UNLOCK_FLOOR) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-slate-400">
          Раздел «Акции» откроется на {STOCKS_UNLOCK_FLOOR}-м этаже.
          <p className="text-[10px] text-slate-500 mt-2">Ваш этаж: {player.highestFloor}</p>
        </CardContent>
      </Card>
    )
  }

  const portfolio = player.stockPortfolio ?? {}
  const pendingDiv = player.stockPendingDividends ?? 0
  const portfolioValue = getPortfolioValue(player, quotes)
  const selected = getStockSymbol(selectedId)
  const quote = quotes.find((q) => q.symbolId === selectedId)
  const pos = portfolio[selectedId]
  const parsedShares = Math.max(1, parseInt(shares, 10) || 1)
  const parsedLimit = parseInt(limitPrice, 10) || quote?.price || 0

  async function handleTrade(side: 'buy' | 'sell') {
    if (!quote) { hapticError(); return }
    if (side === 'sell' && (pos?.shares ?? 0) < parsedShares) { hapticError(); return }
    setLoading(true)
    const result = await tradeStockOnServer({
      symbolId: selectedId,
      side,
      shares: parsedShares,
      expectedPrice: quote.price,
      orderType,
      limitPrice: orderType === 'limit' ? parsedLimit : undefined,
    })
    setLoading(false)
    if (!result?.ok) { hapticError(); return }

    if (orderType === 'limit' && result.executed === false && result.orderId) {
      const ok = addStockLimitOrder({
        id: result.orderId,
        symbolId: selectedId,
        side,
        limitPrice: parsedLimit,
        shares: parsedShares,
        createdAt: new Date().toISOString(),
      })
      if (!ok) { hapticError(); return }
      if (result.quotes) {
        setQuotes(result.quotes)
        setTopGainers(result.topGainers ?? [])
        accrueStockDividendsStore(result.quotes)
      } else {
        loadQuotes()
      }
      hapticSuccess()
      return
    }

    if (side === 'buy' && result.totalGold && result.price) {
      if (!buyStock(selectedId, parsedShares, result.totalGold, result.price)) { hapticError(); return }
    } else if (side === 'sell' && result.totalGold && result.price) {
      if (!sellStock(selectedId, parsedShares, result.totalGold)) { hapticError(); return }
    }
    if (result.quotes) {
      setQuotes(result.quotes)
      setTopGainers(result.topGainers ?? [])
      accrueStockDividendsStore(result.quotes)
    } else {
      loadQuotes()
    }
    hapticSuccess()
  }

  return (
    <div className="space-y-3">
      <Card className="border-aether-gold/30">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Портфель</span>
            <span className="text-aether-gold font-bold">🪙 {formatNumber(portfolioValue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Дивиденды к сбору</span>
            <span className="text-aether-cyan">🪙 {formatNumber(pendingDiv)}</span>
          </div>
          <Button
            className="w-full"
            variant="secondary"
            size="sm"
            disabled={pendingDiv < 1}
            onClick={() => { if (collectStockDividends()) hapticSuccess(); else hapticError() }}
          >
            Собрать дивиденды
          </Button>
        </CardContent>
      </Card>

      {topGainers.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-aether-purple font-medium mb-2">📈 Топ растущих за неделю</p>
            {topGainers.slice(0, 5).map((g, i) => {
              const sym = getStockSymbol(g.symbolId)
              return (
                <div key={g.symbolId} className="flex justify-between text-[11px] py-0.5">
                  <span className="text-slate-300">{i + 1}. {sym?.icon} {sym?.nameRu}</span>
                  <span className={g.change7d >= 0 ? 'text-aether-cyan' : 'text-red-400'}>
                    {formatStockChange(g.change7d)}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="market">
        <TabsList className="w-full">
          <TabsTrigger value="market" className="flex-1 text-xs">Рынок</TabsTrigger>
          <TabsTrigger value="portfolio" className="flex-1 text-xs">Портфель</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 text-xs">Заявки</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-2 mt-3">
          {STOCK_SYMBOLS.map((sym) => {
            const q = quotes.find((x) => x.symbolId === sym.id)
            const isSel = sym.id === selectedId
            return (
              <Card
                key={sym.id}
                className={`cursor-pointer ${isSel ? 'border-aether-cyan' : ''}`}
                onClick={() => setSelectedId(sym.id)}
              >
                <CardContent className="p-3 flex gap-2 items-center">
                  <span className="text-xl">{sym.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{sym.nameRu}</div>
                    <div className="text-[10px] text-slate-500">{sym.descriptionRu}</div>
                    <div className="text-[10px] text-slate-400">
                      Доходность ~{(sym.dividendMin * 100).toFixed(1)}–{(sym.dividendMax * 100).toFixed(1)}%/день · {getVolatilityLabelRu(sym.volatility)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm text-white">{q ? formatStockPrice(q.price) : '…'} 🪙</div>
                    {q && (
                      <div className={`text-[10px] ${q.change7d >= 0 ? 'text-aether-cyan' : 'text-red-400'}`}>
                        {formatStockChange(q.change7d)} / 7д
                      </div>
                    )}
                    {q && <MiniChart data={q.history7d} positive={q.change7d >= 0} />}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {selected && quote && (
            <Card className="border-aether-purple/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">{selected.icon} {selected.nameRu}</span>
                  <Badge variant="rare">{formatStockPrice(quote.price)} 🪙</Badge>
                </div>
                <p className="text-[10px] text-slate-500">
                  У вас: {pos?.shares ?? 0} шт. · Средняя цена: {pos ? formatStockPrice(pos.avgCost) : '—'}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={orderType === 'market' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setOrderType('market')}
                  >
                    Рыночная
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={orderType === 'limit' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setOrderType('limit')}
                  >
                    Лимитная
                  </Button>
                </div>
                <input
                  type="number"
                  min={1}
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Количество"
                />
                {orderType === 'limit' && (
                  <input
                    type="number"
                    min={1}
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
                    placeholder={`Лимит (тек. ${formatStockPrice(quote.price)})`}
                  />
                )}
                <p className="text-[10px] text-slate-500 text-center">
                  {orderType === 'market'
                    ? `Сумма: ~${formatStockPrice(quote.price * parsedShares)} 🪙`
                    : `Лимит: ${formatStockPrice(parsedLimit * parsedShares)} 🪙`}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button disabled={loading} onClick={() => handleTrade('buy')}>Купить</Button>
                  <Button variant="gold" disabled={loading || (pos?.shares ?? 0) < parsedShares} onClick={() => handleTrade('sell')}>
                    Продать
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-2 mt-3">
          {Object.entries(portfolio).filter(([, p]) => p.shares > 0).length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">Нет акций в портфеле</p>
          )}
          {Object.entries(portfolio).filter(([, p]) => p.shares > 0).map(([id, p]) => {
            const sym = getStockSymbol(id)
            const q = quotes.find((x) => x.symbolId === id)
            const value = (q?.price ?? p.avgCost) * p.shares
            const pnl = q ? (q.price - p.avgCost) * p.shares : 0
            return (
              <Card key={id}>
                <CardContent className="p-3 flex justify-between text-xs">
                  <div>
                    <div className="text-white font-medium">{sym?.icon} {sym?.nameRu}</div>
                    <div className="text-slate-500">{p.shares} шт. × {formatStockPrice(p.avgCost)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-aether-gold">🪙 {formatNumber(value)}</div>
                    <div className={pnl >= 0 ? 'text-aether-cyan' : 'text-red-400'}>
                      {pnl >= 0 ? '+' : ''}{formatNumber(pnl)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="orders" className="space-y-2 mt-3">
          {(player.stockLimitOrders ?? []).length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">Нет открытых лимитных заявок</p>
          )}
          {(player.stockLimitOrders ?? []).map((o) => {
            const sym = getStockSymbol(o.symbolId)
            return (
              <Card key={o.id}>
                <CardContent className="p-3 flex justify-between items-center text-xs">
                  <div>
                    <div className="text-white">{sym?.nameRu} · {o.side === 'buy' ? 'Покупка' : 'Продажа'}</div>
                    <div className="text-slate-500">{o.shares} шт. по {formatStockPrice(o.limitPrice)}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { cancelStockLimitOrder(o.id); hapticSuccess() }}>
                    Отмена
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
