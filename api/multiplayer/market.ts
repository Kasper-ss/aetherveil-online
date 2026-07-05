import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buyMarketListing, getMarketListingRecords } from '../../server/playerRegistry.js'
import { validateInitData, getBotToken } from '../../server/telegram.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const listings = await getMarketListingRecords()
      return res.status(200).json({ ok: true, listings })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Market error'
      return res.status(500).json({ error: message })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as { initData?: string; listingId?: string }
      const user = validateInitData(body.initData ?? '', getBotToken())
      if (!user) {
        return res.status(401).json({ error: 'Недействительные данные Telegram' })
      }
      if (!body.listingId) {
        return res.status(400).json({ error: 'listingId обязателен' })
      }

      const listing = await buyMarketListing(user.id, body.listingId)
      if (!listing) {
        return res.status(404).json({ error: 'Лот не найден или уже продан' })
      }

      return res.status(200).json({ ok: true, listing })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Buy error'
      return res.status(500).json({ error: message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
