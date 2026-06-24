import type { StarProductId } from '@/data/starShop'
import { getInitData, getWebApp, hapticSuccess, isTelegramEnvironment } from '@/lib/telegram'
import { delay } from '@/lib/utils'

export type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending'

export class StarsPaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StarsPaymentError'
  }
}

function openStarsInvoice(invoiceUrl: string): Promise<InvoiceStatus> {
  const webApp = getWebApp() as ReturnType<typeof getWebApp> & {
    openInvoice?: (url: string, callback?: (status: string) => void) => void
  }

  if (!webApp?.openInvoice) {
    return Promise.reject(new StarsPaymentError('Платежи Stars недоступны в этой версии Telegram'))
  }

  return new Promise((resolve) => {
    webApp.openInvoice!(invoiceUrl, (status) => {
      resolve(status as InvoiceStatus)
    })
  })
}

async function fulfillWithRetry(initData: string, payload: string, productId: StarProductId): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await fetch('/api/stars/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, payload, productId }),
    })

    if (res.ok) return

    const data = await res.json().catch(() => ({})) as { error?: string }
    if (data.error === 'not_paid_yet' && attempt < 9) {
      await delay(1000)
      continue
    }

    throw new StarsPaymentError(data.error ?? 'Не удалось подтвердить оплату на сервере')
  }
}

export async function requestStarsPayment(productId: StarProductId): Promise<boolean> {
  if (!isTelegramEnvironment()) {
    if (import.meta.env.DEV && import.meta.env.VITE_STARS_DEV_MOCK === 'true') {
      return window.confirm(`[DEV] Симулировать оплату «${productId}»?`)
    }
    throw new StarsPaymentError('Покупки за Stars доступны только внутри Telegram')
  }

  const initData = getInitData()
  if (!initData) {
    throw new StarsPaymentError('Не удалось получить данные авторизации Telegram')
  }

  const createRes = await fetch('/api/stars/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, productId }),
  })

  const createData = await createRes.json().catch(() => ({})) as {
    invoiceLink?: string
    payload?: string
    error?: string
  }

  if (!createRes.ok || !createData.invoiceLink || !createData.payload) {
    throw new StarsPaymentError(createData.error ?? 'Не удалось создать счёт на оплату')
  }

  const status = await openStarsInvoice(createData.invoiceLink)
  if (status === 'cancelled') return false
  if (status !== 'paid') {
    throw new StarsPaymentError('Оплата не завершена')
  }

  await fulfillWithRetry(initData, createData.payload, productId)
  hapticSuccess()
  return true
}
