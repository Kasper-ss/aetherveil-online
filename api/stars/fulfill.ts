import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fulfillStarPurchase } from '../../server/starsPayment.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as { initData?: string; payload?: string; productId?: string } | undefined
    if (!body?.initData || !body?.payload || !body?.productId) {
      return res.status(400).json({ error: 'initData, payload и productId обязательны' })
    }
    const result = await fulfillStarPurchase({
      initData: body.initData,
      payload: body.payload,
      productId: body.productId,
    })
    return res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка подтверждения'
    const code = (error as Error & { code?: string }).code
    if (code === 'not_paid_yet' || message === 'not_paid_yet') {
      return res.status(409).json({ error: 'not_paid_yet' })
    }
    const status = message.includes('TELEGRAM_BOT_TOKEN') ? 503 : 400
    return res.status(status).json({ error: message })
  }
}
