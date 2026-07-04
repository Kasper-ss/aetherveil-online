import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMonthlyLeaderboardRecords } from '../../server/playerRegistry.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const board = await getMonthlyLeaderboardRecords()
    return res.status(200).json({ ok: true, ...board })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Monthly leaderboard error'
    return res.status(500).json({ error: message })
  }
}
