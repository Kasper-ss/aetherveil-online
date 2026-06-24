import crypto from 'node:crypto'
import { getStarProduct, isStarProductId } from './starProducts.js'
import { createStarsInvoiceLink, getBotToken, validateInitData } from './telegram.js'
import {
  createPendingPayment,
  getPayment,
  markPaymentFulfilled,
  markPaymentPaid,
} from './paymentStore.js'

function buildPayload(telegramId: number, productId: string): string {
  const nonce = crypto.randomBytes(6).toString('hex')
  return `${productId}:${telegramId}:${Date.now()}:${nonce}`
}

function parsePayloadOwner(payload: string): { productId: string; telegramId: number } | null {
  const [productId, telegramIdRaw] = payload.split(':')
  const telegramId = Number(telegramIdRaw)
  if (!isStarProductId(productId) || !telegramId) return null
  return { productId, telegramId }
}

export async function createStarInvoice(input: { initData: string; productId: string }) {
  const botToken = getBotToken()
  const user = validateInitData(input.initData, botToken)
  if (!user) throw new Error('Недействительные данные Telegram')

  const product = getStarProduct(input.productId)
  if (!product) throw new Error('Неизвестный товар')

  const payload = buildPayload(user.id, product.id)
  await createPendingPayment({
    payload,
    telegram_id: user.id,
    product_id: product.id,
    stars: product.stars,
    status: 'pending',
  })

  const invoiceLink = await createStarsInvoiceLink({
    title: product.nameRu,
    description: product.descriptionRu,
    payload,
    stars: product.stars,
  })

  return { invoiceLink, payload, productId: product.id, stars: product.stars }
}

export async function fulfillStarPurchase(input: {
  initData: string
  payload: string
  productId: string
}) {
  const botToken = getBotToken()
  const user = validateInitData(input.initData, botToken)
  if (!user) throw new Error('Недействительные данные Telegram')

  const owner = parsePayloadOwner(input.payload)
  if (!owner || owner.telegramId !== user.id) throw new Error('Неверный платёжный идентификатор')
  if (owner.productId !== input.productId) throw new Error('Товар не совпадает с оплатой')

  const payment = await getPayment(input.payload)
  if (!payment) throw new Error('Платёж не найден')

  if (payment.status === 'fulfilled') {
    return { success: true, productId: payment.product_id, alreadyFulfilled: true }
  }

  if (payment.status !== 'paid') {
    const err = new Error('not_paid_yet') as Error & { code?: string }
    err.code = 'not_paid_yet'
    throw err
  }

  const ok = await markPaymentFulfilled(input.payload)
  if (!ok) throw new Error('Платёж уже обработан')

  return { success: true, productId: payment.product_id }
}

export async function handleTelegramPaymentWebhook(update: {
  pre_checkout_query?: { id: string; invoice_payload: string; from: { id: number } }
  message?: {
    successful_payment?: {
      invoice_payload: string
      telegram_payment_charge_id?: string
      total_amount: number
      currency: string
    }
  }
}) {
  if (update.pre_checkout_query) {
    const { id, invoice_payload, from } = update.pre_checkout_query
    const owner = parsePayloadOwner(invoice_payload)
    const payment = await getPayment(invoice_payload)
    const product = owner ? getStarProduct(owner.productId) : null
    const valid = !!(
      owner
      && payment
      && product
      && owner.telegramId === from.id
      && payment.telegram_id === from.id
      && payment.stars === product.stars
    )
    const { answerPreCheckoutQuery } = await import('./telegram.js')
    await answerPreCheckoutQuery(id, valid, valid ? undefined : 'Неверный заказ')
    return { handled: 'pre_checkout_query', ok: valid }
  }

  const successful = update.message?.successful_payment
  if (successful) {
    await markPaymentPaid(successful.invoice_payload, successful.telegram_payment_charge_id)
    return { handled: 'successful_payment' }
  }

  return { handled: 'ignored' }
}
