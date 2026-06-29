import crypto from 'node:crypto'

export interface ValidatedTelegramUser {
  id: number
  first_name: string
  username?: string
}

export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не настроен на сервере')
  return token
}

export function validateInitData(initData: string, botToken: string): ValidatedTelegramUser | null {
  if (!initData) return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  if (calculatedHash !== hash) return null

  const authDate = Number(params.get('auth_date') ?? 0)
  const maxAgeSec = Number(process.env.TELEGRAM_INITDATA_MAX_AGE_SEC ?? 86_400)
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null

  const userRaw = params.get('user')
  if (!userRaw) return null

  try {
    const user = JSON.parse(userRaw) as ValidatedTelegramUser
    if (!user?.id) return null
    return user
  } catch {
    return null
  }
}

async function callTelegramApi<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = getBotToken()
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json() as { ok: boolean; result?: T; description?: string }
  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API error: ${method}`)
  }
  return data.result as T
}

export function getMiniAppUrl(): string {
  if (process.env.MINI_APP_URL) return process.env.MINI_APP_URL.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`
  return ''
}

export async function sendMessage(params: {
  chat_id: number
  text: string
  reply_markup?: Record<string, unknown>
}) {
  await callTelegramApi<unknown>('sendMessage', params)
}

export async function createStarsInvoiceLink(params: {
  title: string
  description: string
  payload: string
  stars: number
}): Promise<string> {
  return callTelegramApi<string>('createInvoiceLink', {
    title: params.title,
    description: params.description,
    payload: params.payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: params.title, amount: params.stars }],
  })
}

export async function answerPreCheckoutQuery(queryId: string, ok: boolean, errorMessage?: string) {
  await callTelegramApi<boolean>('answerPreCheckoutQuery', {
    pre_checkout_query_id: queryId,
    ok,
    error_message: ok ? undefined : (errorMessage ?? 'Платёж отклонён'),
  })
}

export async function setWebhook(url: string, secretToken?: string) {
  await callTelegramApi<boolean>('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['pre_checkout_query', 'message'],
    drop_pending_updates: true,
  })
}

export async function getWebhookInfo(): Promise<Record<string, unknown>> {
  return callTelegramApi<Record<string, unknown>>('getWebhookInfo', {})
}
