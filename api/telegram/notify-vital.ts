import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateInitData, getBotToken } from '../../server/telegram.js'
import { notifyVitalViaBot, type VitalSyncPayload } from '../../server/vitalNotifications.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as {
      initData?: string
      kind?: 'hp' | 'energy' | 'both'
      vitals?: VitalSyncPayload
    }

    const user = validateInitData(body.initData ?? '', getBotToken())
    if (!user) {
      return res.status(401).json({ error: 'Недействительные данные Telegram' })
    }

    const kind = body.kind
    const vitals = body.vitals
    if (!kind || !vitals) {
      return res.status(400).json({ error: 'kind and vitals required' })
    }

    const sent = await notifyVitalViaBot(user.id, kind, vitals)
    return res.status(200).json({ ok: true, sent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notify error'
    console.error('[telegram/notify-vital]', message)
    return res.status(500).json({ error: message })
  }
}
