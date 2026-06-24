import { getMiniAppUrl, setWebhook } from '../../server/telegram.js'

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Откройте эту ссылку в браузере (GET)' }, { status: 405 })
  }

  const setupKey = process.env.TELEGRAM_WEBHOOK_SETUP_KEY
  const url = new URL(request.url)
  const key = url.searchParams.get('key')

  if (!setupKey || key !== setupKey) {
    return Response.json(
      { error: 'Неверный ключ. Добавьте TELEGRAM_WEBHOOK_SETUP_KEY в Vercel и откройте ?key=...' },
      { status: 401 }
    )
  }

  try {
    const appUrl = getMiniAppUrl()
    if (!appUrl) {
      return Response.json(
        { error: 'Укажите MINI_APP_URL в переменных окружения Vercel (https://ваш-проект.vercel.app)' },
        { status: 400 }
      )
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook`
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET

    await setWebhook(webhookUrl, secret)

    return Response.json({
      ok: true,
      message: 'Webhook установлен! Теперь /start должен работать.',
      webhookUrl,
      miniAppUrl: appUrl,
      nextStep: `Откройте бота в Telegram и отправьте /start`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Setup failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
