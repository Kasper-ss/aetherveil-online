import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { createStarInvoice, fulfillStarPurchase, handleTelegramWebhook } from './server/starsPayment.js'
import { setWebhook, getMiniAppUrl } from './server/telegram.js'
import { syncPublicPlayer, getLeaderboardRecords, getMarketListingRecords, buyMarketListing } from './server/playerRegistry.js'
import { validateInitData, getBotToken } from './server/telegram.js'

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
            const result = await handleTelegramWebhook(update as Parameters<typeof handleTelegramWebhook>[0])
            sendJson(res, 200, { ok: true, ...result })
            return
          }

          if (req.method === 'GET' && req.url?.startsWith('/api/telegram/setup-webhook')) {
            const setupKey = process.env.TELEGRAM_WEBHOOK_SETUP_KEY
            const q = new URL(req.url, 'http://localhost').searchParams.get('key')
            if (!setupKey || q !== setupKey) {
              sendJson(res, 401, { error: 'Неверный ключ setup' })
              return
            }
            const appUrl = getMiniAppUrl() || 'http://localhost:5173'
            await setWebhook(`${appUrl}/api/telegram/webhook`, process.env.TELEGRAM_WEBHOOK_SECRET)
            sendJson(res, 200, { ok: true, webhookUrl: `${appUrl}/api/telegram/webhook` })
            return
          }

          if (req.method === 'POST' && req.url === '/api/multiplayer/sync') {
            const body = await readJsonBody(req) as {
              initData?: string
              level?: number
              highestFloor?: number
              displayName?: string
              username?: string
              guildId?: string
              marketListings?: unknown[]
            }
            const user = validateInitData(body.initData ?? '', getBotToken())
            if (!user) {
              sendJson(res, 401, { error: 'Недействительные данные Telegram' })
              return
            }
            const marketListings = (body.marketListings ?? []).map((raw) => {
              const l = raw as Record<string, unknown>
              return {
                id: String(l.id ?? ''),
                sellerId: user.id,
                sellerName: String(l.sellerName ?? user.first_name),
                item: l.item as Record<string, unknown> | undefined,
                resourceId: l.resourceId as string | undefined,
                resourceAmount: l.resourceAmount as number | undefined,
                goldPrice: Number(l.goldPrice ?? 0),
                isPlayerListing: true,
              }
            }).filter((l) => l.id && l.goldPrice > 0)
            const result = await syncPublicPlayer({
              telegramId: user.id,
              username: body.username ?? user.username ?? `user_${user.id}`,
              displayName: body.displayName ?? user.first_name,
              level: Number(body.level ?? 1),
              highestFloor: Number(body.highestFloor ?? 1),
              guildId: body.guildId,
              marketListings,
            })
            sendJson(res, 200, { ok: true, ...result })
            return
          }

          if (req.method === 'GET' && req.url === '/api/multiplayer/leaderboard') {
            const players = await getLeaderboardRecords()
            const entries = players.map((p, index) => ({
              rank: index + 1,
              telegramId: p.telegram_id,
              username: p.username,
              displayName: p.display_name,
              floor: p.highest_floor,
              level: p.level,
              guildId: p.guild_id,
            }))
            sendJson(res, 200, { ok: true, entries })
            return
          }

          if (req.method === 'GET' && req.url === '/api/multiplayer/market') {
            const listings = await getMarketListingRecords()
            sendJson(res, 200, { ok: true, listings })
            return
          }

          if (req.method === 'POST' && req.url === '/api/multiplayer/market-buy') {
            const body = await readJsonBody(req) as { initData?: string; listingId?: string }
            const user = validateInitData(body.initData ?? '', getBotToken())
            if (!user) {
              sendJson(res, 401, { error: 'Недействительные данные Telegram' })
              return
            }
            const listing = await buyMarketListing(user.id, body.listingId ?? '')
            if (!listing) {
              sendJson(res, 404, { error: 'Лот не найден' })
              return
            }
            sendJson(res, 200, { ok: true, listing })
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
