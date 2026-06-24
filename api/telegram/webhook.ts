import { handleTelegramWebhook } from '../../server/starsPayment.js'

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (secret) {
      const header = request.headers.get('x-telegram-bot-api-secret-token')
      if (header !== secret) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const update = await request.json() as Parameters<typeof handleTelegramWebhook>[0]
    const result = await handleTelegramWebhook(update)
    return Response.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    console.error('[telegram/webhook]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
