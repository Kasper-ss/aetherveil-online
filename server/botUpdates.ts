import { getMiniAppUrl, sendMessage } from './telegram.js'

export interface TelegramUpdate {
  pre_checkout_query?: { id: string; invoice_payload: string; from: { id: number } }
  message?: {
    message_id?: number
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
  if (startArg?.toLowerCase() === 'appss_verify') {
    await handleAppssVerifyCommand(chatId)
    return
  }

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

/** Hidden verification command — not registered in bot menu */
export const APPSS_VERIFY_CODE = 'appss_18516a'

export async function handleAppssVerifyCommand(chatId: number, messageId?: number) {
  await sendMessage({
    chat_id: chatId,
    text: APPSS_VERIFY_CODE,
    ...(messageId != null ? { reply_parameters: { message_id: messageId } } : {}),
  })
}

export function isAppssVerifyRequest(text: string): boolean {
  const trimmed = text.trim().toLowerCase()
  if (trimmed === 'appss_verify' || trimmed === '/appss_verify') return true
  const parsed = parseStartCommand(text)
  if (!parsed) return false
  if (parsed.command === '/appss_verify') return true
  if (parsed.command === '/start' && parsed.arg?.toLowerCase() === 'appss_verify') return true
  return false
}

export function parseStartCommand(text: string): { command: string; arg?: string } | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return null
  const [command, ...rest] = trimmed.split(/\s+/)
  const base = command.split('@')[0].toLowerCase()
  return { command: base, arg: rest.join(' ').trim() || undefined }
}
