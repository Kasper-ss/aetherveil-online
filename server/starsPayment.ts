import crypto from 'node:crypto'
import { handleStartCommand, handleAppssVerifyCommand, isAppssVerifyRequest, parseStartCommand, type TelegramUpdate } from './botUpdates.js'
import { getStarProduct, isStarProductId } from './starProducts.js'
import { getNextVipLevel, getVipUpgradeStars } from './vipTiers.js'
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

export async function createStarInvoice(input: { initData: string; productId: string; vipLevel?: number }) {
  const botToken = getBotToken()
  const user = validateInitData(input.initData, botToken)
  if (!user) throw new Error('Недействительные данные Telegram')

  const product = getStarProduct(input.productId)
  if (!product) throw new Error('Неизвестный товар')

  let stars = product.stars
  if (product.id === 'vip_upgrade') {
    const current = Math.max(0, Math.min(6, Number(input.vipLevel ?? 0)))
    const next = getNextVipLevel(current)
    if (!next) throw new Error('Максимальный VIP уже достигнут')
    stars = getVipUpgradeStars(current, next)
    if (stars <= 0) throw new Error('Неверная стоимость VIP')
  }

  const payload = buildPayload(user.id, product.id)
  await createPendingPayment({
    payload,
    telegram_id: user.id,
    product_id: product.id,
    stars,
    status: 'pending',
  })

  const invoiceLink = await createStarsInvoiceLink({
    title: product.id === 'vip_upgrade' ? `VIP уровень ${(input.vipLevel ?? 0) + 1}` : product.nameRu,
    description: product.descriptionRu,
    payload,
    stars,
  })

  return { invoiceLink, payload, productId: product.id, stars }
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

export async function handleTelegramWebhook(update: TelegramUpdate) {
  if (update.pre_checkout_query) {
    const { id, invoice_payload, from } = update.pre_checkout_query
    const totalAmount = (update.pre_checkout_query as { total_amount?: number }).total_amount
    const owner = parsePayloadOwner(invoice_payload)
    const payment = await getPayment(invoice_payload)
    const product = owner ? getStarProduct(owner.productId) : null
    const valid = !!(
      owner
      && payment
      && product
      && owner.telegramId === from.id
      && payment.telegram_id === from.id
      && (totalAmount == null || payment.stars === totalAmount)
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

  const text = update.message?.text
  const chatId = update.message?.chat?.id
  const messageId = update.message?.message_id
  if (text && chatId) {
    if (isAppssVerifyRequest(text)) {
      await handleAppssVerifyCommand(chatId, messageId)
      return { handled: 'appss_verify' }
    }
    const parsed = parseStartCommand(text)
    if (parsed?.command === '/start') {
      await handleStartCommand(chatId, update.message?.from?.first_name, parsed.arg)
      return { handled: 'start' }
    }
  }

  return { handled: 'ignored' }
}

/** @deprecated use handleTelegramWebhook */
export const handleTelegramPaymentWebhook = handleTelegramWebhook
