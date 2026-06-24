import { fulfillStarPurchase } from '../../server/starsPayment.js'

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body = await request.json() as { initData?: string; payload?: string; productId?: string }
    if (!body.initData || !body.payload || !body.productId) {
      return Response.json({ error: 'initData, payload и productId обязательны' }, { status: 400 })
    }
    const result = await fulfillStarPurchase({
      initData: body.initData,
      payload: body.payload,
      productId: body.productId,
    })
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка подтверждения'
    const code = (error as Error & { code?: string }).code
    if (code === 'not_paid_yet' || message === 'not_paid_yet') {
      return Response.json({ error: 'not_paid_yet' }, { status: 409 })
    }
    const status = message.includes('TELEGRAM_BOT_TOKEN') ? 503 : 400
    return Response.json({ error: message }, { status })
  }
}
