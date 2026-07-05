import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getStockQuotes } from '../../server/stockMarket.js'
import { validateInitData, getBotToken } from '../../server/telegram.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
