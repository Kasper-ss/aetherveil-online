import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMiniAppUrl, setWebhook } from '../../server/telegram.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Откройте эту ссылку в браузере (GET)' })
  }

  const setupKey = process.env.TELEGRAM_WEBHOOK_SETUP_KEY
  const key = typeof req.query.key === 'string' ? req.query.key : undefined

  if (!setupKey || key !== setupKey) {
    return res.status(401).json({
      error: 'Неверный ключ. Добавьте TELEGRAM_WEBHOOK_SETUP_KEY в Vercel и откройте ?key=...',
    })
  }

  try {
    const appUrl = getMiniAppUrl()
    if (!appUrl) {
      return res.status(400).json({
        error: 'Укажите MINI_APP_URL в переменных окружения Vercel (https://ваш-проект.vercel.app)',
      })
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook`
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET

    await setWebhook(webhookUrl, secret)

    return res.status(200).json({
      ok: true,
      message: 'Webhook установлен! Теперь /start должен работать.',
      webhookUrl,
      miniAppUrl: appUrl,
      nextStep: 'Откройте бота в Telegram и отправьте /start',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Setup failed'
    return res.status(500).json({ error: message })
  }
}
