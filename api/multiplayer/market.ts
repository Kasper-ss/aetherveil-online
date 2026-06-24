import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMarketListingRecords } from '../../server/playerRegistry.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const listings = await getMarketListingRecords()
    return res.status(200).json({ ok: true, listings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Market error'
    return res.status(500).json({ error: message })
  }
}
