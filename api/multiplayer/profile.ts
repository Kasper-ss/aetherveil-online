import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPlayerProfileRecord } from '../../server/playerRegistry.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const telegramId = Number(req.query.telegramId)
  if (!telegramId || Number.isNaN(telegramId)) {
    return res.status(400).json({ error: 'telegramId required' })
  }

  try {
    const profile = await getPlayerProfileRecord(telegramId)
    if (!profile) {
      return res.status(404).json({ error: 'Player not found' })
    }
    return res.status(200).json({ ok: true, profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile error'
    return res.status(500).json({ error: message })
  }
}
