import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateInitData, getBotToken } from '../../server/telegram.js'
import { settleArenaFight } from '../../server/arena.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as {
      initData?: string
      opponentId?: number
      victory?: boolean
    }

    const user = validateInitData(body.initData ?? '', getBotToken())
    if (!user) {
      return res.status(401).json({ error: 'Недействительные данные Telegram' })
    }

    const opponentId = Number(body.opponentId)
    if (!opponentId || Number.isNaN(opponentId)) {
      return res.status(400).json({ error: 'opponentId required' })
    }

    const result = await settleArenaFight({
      attackerId: user.id,
      opponentId,
      victory: !!body.victory,
    })

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error })
    }

    return res.status(200).json({ ok: true, goldStolen: result.goldStolen ?? 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Arena error'
    return res.status(500).json({ error: message })
  }
}
