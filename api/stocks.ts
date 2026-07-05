import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cancelStockLimitOrder, getStockQuotes, processStockTrade } from '../server/stockMarket.js'
import { validateInitData, getBotToken } from '../server/telegram.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const initData = String(req.query.initData ?? '')
      const user = validateInitData(initData, getBotToken())
      if (!user && initData) {
        return res.status(401).json({ error: 'Недействительные данные Telegram' })
      }

      const { quotes, topGainers, openOrders } = await getStockQuotes()
      return res.status(200).json({ ok: true, quotes, topGainers, openOrders })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Quotes error'
      return res.status(500).json({ error: message })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as {
        initData?: string
        action?: 'trade' | 'cancel'
        symbolId?: string
        side?: 'buy' | 'sell'
        shares?: number
        expectedPrice?: number
        orderType?: 'market' | 'limit'
        limitPrice?: number
        orderId?: string
      }

      const user = validateInitData(body.initData ?? '', getBotToken())
      if (!user) {
        return res.status(401).json({ error: 'Недействительные данные Telegram' })
      }

      if (body.action === 'cancel') {
        if (!body.orderId) return res.status(400).json({ error: 'orderId обязателен' })
        const ok = await cancelStockLimitOrder(user.id, body.orderId)
        return res.status(ok ? 200 : 404).json({ ok })
      }

      const result = await processStockTrade({
        telegramId: user.id,
        symbolId: String(body.symbolId ?? ''),
        side: body.side === 'sell' ? 'sell' : 'buy',
        shares: Number(body.shares ?? 0),
        expectedPrice: Number(body.expectedPrice ?? 0),
        orderType: body.orderType === 'limit' ? 'limit' : 'market',
        limitPrice: body.limitPrice != null ? Number(body.limitPrice) : undefined,
      })

      if (!result.ok) {
        return res.status(400).json(result)
      }
      return res.status(200).json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Trade error'
      return res.status(500).json({ error: message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
