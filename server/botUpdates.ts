import { getMiniAppUrl, sendMessage } from './telegram.js'

export interface TelegramUpdate {
  pre_checkout_query?: { id: string; invoice_payload: string; from: { id: number } }
  message?: {
    chat: { id: number }
    from?: { id: number; first_name?: string }
    text?: string
    successful_payment?: {
      invoice_payload: string
      telegram_payment_charge_id?: string
      total_amount: number
      currency: string
    }
  }
}

export async function handleStartCommand(chatId: number, firstName?: string, startArg?: string) {
  const appUrl = getMiniAppUrl()
  if (!appUrl) {
    throw new Error('MINI_APP_URL не настроен на сервере (укажите URL вашего Vercel-деплоя)')
  }

  let playUrl = appUrl
  if (startArg) {
    const url = new URL(appUrl)
    url.searchParams.set('tgWebAppStartParam', startArg)
    playUrl = url.toString()
  }

  const name = firstName?.trim() || 'игрок'
  await sendMessage({
    chat_id: chatId,
    text: [
      `⚔️ Добро пожаловать в Aetherveil Online, ${name}!`,
      '',
      'VRMMO-башня в стиле SAO: исследуйте этажи, сражайтесь и прокачивайтесь.',
      '',
      'Нажмите кнопку ниже, чтобы открыть игру.',
      'Или используйте кнопку меню (☰) внизу чата.',
    ].join('\n'),
    reply_markup: {
      inline_keyboard: [[{ text: '⚔️ Играть', web_app: { url: playUrl } }]],
    },
  })
}

export function parseStartCommand(text: string): { command: string; arg?: string } | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return null
  const [command, ...rest] = trimmed.split(/\s+/)
  const base = command.split('@')[0].toLowerCase()
  return { command: base, arg: rest.join(' ').trim() || undefined }
}
