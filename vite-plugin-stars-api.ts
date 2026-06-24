import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { createStarInvoice, fulfillStarPurchase, handleTelegramPaymentWebhook } from './server/starsPayment.js'

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function starsApiPlugin(): Plugin {
  return {
    name: 'stars-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        try {
          if (req.method === 'POST' && req.url === '/api/stars/create-invoice') {
            const body = await readJsonBody(req) as { initData?: string; productId?: string }
            const result = await createStarInvoice({
              initData: body.initData ?? '',
              productId: body.productId ?? '',
            })
            sendJson(res, 200, result)
            return
          }

          if (req.method === 'POST' && req.url === '/api/stars/fulfill') {
            const body = await readJsonBody(req) as { initData?: string; payload?: string; productId?: string }
            try {
              const result = await fulfillStarPurchase({
                initData: body.initData ?? '',
                payload: body.payload ?? '',
                productId: body.productId ?? '',
              })
              sendJson(res, 200, result)
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Ошибка'
              if (message === 'not_paid_yet') {
                sendJson(res, 409, { error: 'not_paid_yet' })
              } else {
                sendJson(res, 400, { error: message })
              }
            }
            return
          }

          if (req.method === 'POST' && req.url === '/api/telegram/webhook') {
            const update = await readJsonBody(req)
            const result = await handleTelegramPaymentWebhook(update as Parameters<typeof handleTelegramPaymentWebhook>[0])
            sendJson(res, 200, { ok: true, ...result })
            return
          }

          sendJson(res, 404, { error: 'Not found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Server error'
          const status = message.includes('TELEGRAM_BOT_TOKEN') ? 503 : 400
          sendJson(res, status, { error: message })
        }
      })
    },
  }
}
