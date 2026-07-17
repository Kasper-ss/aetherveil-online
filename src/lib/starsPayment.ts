import type { StarProductId } from '@/data/starShop'
import {
  getInitData,
  getWebApp,
  hapticSuccess,
  isTelegramEnvironment,
} from '@/lib/telegram'
import { delay } from '@/lib/utils'

export type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending'

export class StarsPaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StarsPaymentError'
  }
}

async function fetchStarsApi<T>(
  url: string,
  body: Record<string, unknown>,
  timeoutMs = 25_000,
): Promise<{ ok: boolean; status: number; data: T }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const text = await res.text()
    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      const hint =
        res.status === 404 || text.includes('<!doctype')
          ? 'Сервер оплаты недоступен. Проверьте деплой на Vercel и переменные TELEGRAM_BOT_TOKEN, MINI_APP_URL.'
          : `Ошибка сервера (${res.status})`
      throw new StarsPaymentError(hint)
    }

    return { ok: res.ok, status: res.status, data }
  } catch (error) {
    if (error instanceof StarsPaymentError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new StarsPaymentError('Сервер оплаты не отвечает. Попробуйте позже.')
    }
    throw new StarsPaymentError('Нет связи с сервером оплаты')
  } finally {
    clearTimeout(timer)
  }
}

function openStarsInvoice(invoiceUrl: string): Promise<InvoiceStatus> {
  const webApp = getWebApp()
  if (!webApp?.openInvoice) {
    return Promise.reject(
      new StarsPaymentError('Обновите Telegram — оплата Stars недоступна в этой версии'),
    )
  }

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (status: InvoiceStatus) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      webApp.offEvent?.('invoiceClosed', onInvoiceClosed)
      resolve(status)
    }

    const fail = (message: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      webApp.offEvent?.('invoiceClosed', onInvoiceClosed)
      reject(new StarsPaymentError(message))
    }

    const onInvoiceClosed = (data?: unknown) => {
      const status = (data as { status?: string } | undefined)?.status
      if (status) finish(status as InvoiceStatus)
    }

    const timer = setTimeout(() => {
      fail('Окно оплаты не ответило. Обновите Telegram и попробуйте снова.')
    }, 90_000)

    webApp.onEvent?.('invoiceClosed', onInvoiceClosed)

    const openInvoice = webApp.openInvoice
    if (!openInvoice) {
      fail('Обновите Telegram — оплата Stars недоступна в этой версии')
      return
    }

    try {
      openInvoice.call(webApp, invoiceUrl, (status) => finish(status as InvoiceStatus))
    } catch {
      fail('Не удалось открыть окно оплаты')
    }
  })
}

async function fulfillWithRetry(
  initData: string,
  payload: string,
  productId: StarProductId,
): Promise<{ alreadyFulfilled: boolean }> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { ok, data } = await fetchStarsApi<{ error?: string; alreadyFulfilled?: boolean }>('/api/stars/fulfill', {
      initData,
      payload,
      productId,
    })

    if (ok) return { alreadyFulfilled: !!data.alreadyFulfilled }

    if (data.error === 'not_paid_yet' && attempt < 11) {
      await delay(1000)
      continue
    }

    if (data.error === 'not_paid_yet') {
      throw new StarsPaymentError(
        'Оплата получена, но сервер ещё не подтвердил платёж. Настройте webhook: /api/telegram/setup-webhook',
      )
    }

    throw new StarsPaymentError(data.error ?? 'Не удалось подтвердить оплату на сервере')
  }
  return { alreadyFulfilled: false }
}

export interface StarsPaymentResult {
  paid: boolean
  alreadyFulfilled?: boolean
}

export async function requestStarsPayment(
  productId: StarProductId,
  opts?: { vipLevel?: number },
): Promise<StarsPaymentResult> {
  if (!isTelegramEnvironment()) {
    if (import.meta.env.DEV && import.meta.env.VITE_STARS_DEV_MOCK === 'true') {
      const ok = window.confirm(`[DEV] Симулировать оплату «${productId}»?`)
      return { paid: ok }
    }
    throw new StarsPaymentError('Покупки за Stars доступны только внутри Telegram')
  }

  const initData = getInitData()
  if (!initData) {
    throw new StarsPaymentError('Не удалось получить данные авторизации Telegram. Перезапустите игру из бота.')
  }

  const { ok, data: createData } = await fetchStarsApi<{
    invoiceLink?: string
    payload?: string
    error?: string
  }>('/api/stars/create-invoice', { initData, productId, vipLevel: opts?.vipLevel })

  if (!ok || !createData.invoiceLink || !createData.payload) {
    throw new StarsPaymentError(createData.error ?? 'Не удалось создать счёт на оплату')
  }

  const status = await openStarsInvoice(createData.invoiceLink)
  if (status === 'cancelled') return { paid: false }
  if (status !== 'paid') {
    throw new StarsPaymentError('Оплата не завершена')
  }

  const fulfill = await fulfillWithRetry(initData, createData.payload, productId)
  hapticSuccess()
  return { paid: true, alreadyFulfilled: fulfill.alreadyFulfilled }
}
