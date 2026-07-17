import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLeaderboardRecords, getMonthlyLeaderboardRecords } from '../../server/playerRegistry.js'

function parseIncludeIds(raw: unknown): number[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return [...new Set(raw.split(',').map((part) => Number(part.trim())).filter((id) => id > 0))]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (req.query.scope === 'monthly') {
      const board = await getMonthlyLeaderboardRecords()
      return res.status(200).json({ ok: true, ...board })
    }

    const includeIds = parseIncludeIds(req.query.include)
    const players = await getLeaderboardRecords(includeIds)
    const entries = players.map((p, index) => ({
      rank: index + 1,
      telegramId: p.telegram_id,
      username: p.username,
      displayName: p.display_name,
      floor: p.highest_floor,
      level: p.level,
      guildId: p.guild_id,
    }))
    return res.status(200).json({ ok: true, entries })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Leaderboard error'
    return res.status(500).json({ error: message })
  }
}
