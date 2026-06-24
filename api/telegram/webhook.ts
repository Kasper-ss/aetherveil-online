import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleTelegramWebhook } from '../../server/starsPayment.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (secret) {
      const header = req.headers['x-telegram-bot-api-secret-token']
      if (header !== secret) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
    }

    const result = await handleTelegramWebhook(
      req.body as Parameters<typeof handleTelegramWebhook>[0],
    )
    return res.status(200).json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    console.error('[telegram/webhook]', message)
    return res.status(500).json({ error: message })
  }
}
