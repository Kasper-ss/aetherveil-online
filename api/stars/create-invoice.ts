import { createStarInvoice } from '../../server/starsPayment.js'

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    return Response.json({
      ok: true,
      hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
      miniAppUrl: process.env.MINI_APP_URL ?? null,
    })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body = await request.json() as { initData?: string; productId?: string }
    if (!body.initData || !body.productId) {
      return Response.json({ error: 'initData и productId обязательны' }, { status: 400 })
    }
    const result = await createStarInvoice({
      initData: body.initData,
      productId: body.productId,
    })
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка создания счёта'
    const status = message.includes('TELEGRAM_BOT_TOKEN') ? 503 : 400
    return Response.json({ error: message }, { status })
  }
}
