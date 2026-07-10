import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createStarInvoice } from '../../server/starsPayment.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
      miniAppUrl: process.env.MINI_APP_URL ?? null,
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as { initData?: string; productId?: string; vipLevel?: number } | undefined
    if (!body?.initData || !body?.productId) {
      return res.status(400).json({ error: 'initData и productId обязательны' })
    }
    const result = await createStarInvoice({
      initData: body.initData,
      productId: body.productId,
      vipLevel: body.vipLevel,
    })
    return res.status(200).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка создания счёта'
    const status = message.includes('TELEGRAM_BOT_TOKEN') ? 503 : 400
    return res.status(status).json({ error: message })
  }
}
