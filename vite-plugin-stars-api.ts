import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { createStarInvoice, fulfillStarPurchase, handleTelegramWebhook } from './server/starsPayment.js'
import { setWebhook, getMiniAppUrl } from './server/telegram.js'
import { syncPublicPlayer, getLeaderboardRecords, getMarketListingRecords, buyMarketListing } from './server/playerRegistry.js'
import { validateInitData, getBotToken } from './server/telegram.js'
import {
  listGuilds,
  createGuild,
  joinGuild,
  leaveGuild,
  getGuildForMember,
  sendGuildChat,
  getGuildChat,
  areSameGuild,
  CREATE_GUILD_COST,
  CREATE_GUILD_MIN_FLOOR,
} from './server/guildRegistry.js'
import { queueGuildGift } from './server/guildGifts.js'

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

          if (req.method === 'GET' && req.url === '/api/telegram/bot-info') {
            try {
              const token = getBotToken()
              const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
              const data = await response.json() as { ok?: boolean; result?: { username?: string } }
              if (data.ok && data.result?.username) {
                sendJson(res, 200, { username: data.result.username })
              } else {
                sendJson(res, 500, { error: 'getMe failed' })
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Bot info error'
              sendJson(res, 500, { error: message })
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

          if (req.method === 'GET' && req.url?.startsWith('/api/multiplayer/leaderboard')) {
            const url = new URL(req.url, 'http://local')
            const includeRaw = url.searchParams.get('include') ?? ''
            const includeIds = [...new Set(
              includeRaw.split(',').map((part) => Number(part.trim())).filter((id) => id > 0),
            )]
            const players = await getLeaderboardRecords(includeIds)
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

          if (req.method === 'POST' && req.url === '/api/multiplayer/guild') {
            const body = await readJsonBody(req) as {
              initData?: string
              action?: string
              name?: string
              guildId?: string
              text?: string
              after?: string
              highestFloor?: number
              gold?: number
            }
            const user = validateInitData(body.initData ?? '', getBotToken())
            if (!user) {
              sendJson(res, 401, { error: 'Недействительные данные Telegram' })
              return
            }
            const action = body.action ?? 'list'
            if (action === 'list') {
              sendJson(res, 200, { ok: true, guilds: listGuilds(), myGuild: getGuildForMember(user.id) })
              return
            }
            if (action === 'create') {
              const floor = Number(body.highestFloor ?? 1)
              const gold = Number(body.gold ?? 0)
              if (floor < CREATE_GUILD_MIN_FLOOR) {
                sendJson(res, 400, { error: `Создание доступно с ${CREATE_GUILD_MIN_FLOOR} этажа` })
                return
              }
              if (gold < CREATE_GUILD_COST) {
                sendJson(res, 400, { error: `Нужно ${CREATE_GUILD_COST.toLocaleString('ru-RU')} монет` })
                return
              }
              const result = createGuild({
                telegramId: user.id,
                displayName: user.first_name,
                username: user.username ?? `user_${user.id}`,
                name: body.name ?? '',
              })
              if (!result.ok) {
                sendJson(res, 400, { error: result.error })
                return
              }
              sendJson(res, 200, { ok: true, guild: result.guild, goldSpent: CREATE_GUILD_COST })
              return
            }
            if (action === 'join') {
              const result = joinGuild({
                telegramId: user.id,
                displayName: user.first_name,
                username: user.username ?? `user_${user.id}`,
                guildId: String(body.guildId ?? ''),
              })
              if (!result.ok) {
                sendJson(res, 400, { error: result.error })
                return
              }
              sendJson(res, 200, { ok: true, guild: result.guild })
              return
            }
            if (action === 'leave') {
              leaveGuild(user.id)
              sendJson(res, 200, { ok: true })
              return
            }
            if (action === 'my') {
              sendJson(res, 200, { ok: true, guild: getGuildForMember(user.id) })
              return
            }
            if (action === 'chat_send') {
              const myGuild = getGuildForMember(user.id)
              if (!myGuild) {
                sendJson(res, 400, { error: 'Вы не в гильдии' })
                return
              }
              const msg = sendGuildChat({
                guildId: myGuild.id,
                senderId: user.id,
                senderName: user.first_name,
                text: body.text ?? '',
              })
              if (!msg) {
                sendJson(res, 400, { error: 'Не удалось отправить' })
                return
              }
              sendJson(res, 200, { ok: true, message: msg })
              return
            }
            if (action === 'chat_poll') {
              const myGuild = getGuildForMember(user.id)
              if (!myGuild) {
                sendJson(res, 200, { ok: true, messages: [] })
                return
              }
              sendJson(res, 200, {
                ok: true,
                messages: getGuildChat(myGuild.id, body.after),
                guildId: myGuild.id,
              })
              return
            }
            if (action === 'same_guild') {
              const toId = Math.floor(Number(body.guildId))
              sendJson(res, 200, { ok: true, same: areSameGuild(user.id, toId) })
              return
            }
            sendJson(res, 400, { error: 'Unknown action' })
            return
          }

          if (req.method === 'POST' && req.url === '/api/multiplayer/guild-gift') {
            const body = await readJsonBody(req) as {
              initData?: string
              toId?: number
              item?: Record<string, unknown>
            }
            const user = validateInitData(body.initData ?? '', getBotToken())
            if (!user) {
              sendJson(res, 401, { error: 'Недействительные данные Telegram' })
              return
            }
            const toId = Math.floor(Number(body.toId))
            if (!toId || toId === user.id) {
              sendJson(res, 400, { error: 'Некорректный получатель' })
              return
            }
            if (!body.item?.id) {
              sendJson(res, 400, { error: 'Нет предмета для отправки' })
              return
            }
            if (!areSameGuild(user.id, toId)) {
              sendJson(res, 403, { error: 'Игроки не в одной гильдии' })
              return
            }
            const gift = queueGuildGift({
              fromId: user.id,
              fromName: user.first_name,
              toId,
              item: body.item as import('./server/guildGifts.js').GuildGiftItem,
            })
            sendJson(res, 200, { ok: true, giftId: gift.id })
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
