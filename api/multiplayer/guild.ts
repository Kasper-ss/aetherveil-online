import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateInitData, getBotToken } from '../../server/telegram.js'
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
} from '../../server/guildRegistry.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as {
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
      return res.status(401).json({ error: 'Недействительные данные Telegram' })
    }

    const action = body.action ?? 'list'

    if (action === 'list') {
      return res.status(200).json({ ok: true, guilds: listGuilds(), myGuild: getGuildForMember(user.id) })
    }

    if (action === 'create') {
      const floor = Number(body.highestFloor ?? 1)
      const gold = Number(body.gold ?? 0)
      if (floor < CREATE_GUILD_MIN_FLOOR) {
        return res.status(400).json({ error: `Создание доступно с ${CREATE_GUILD_MIN_FLOOR} этажа` })
      }
      if (gold < CREATE_GUILD_COST) {
        return res.status(400).json({ error: `Нужно ${CREATE_GUILD_COST.toLocaleString('ru-RU')} монет` })
      }
      const result = createGuild({
        telegramId: user.id,
        displayName: user.first_name,
        username: user.username ?? `user_${user.id}`,
        name: body.name ?? '',
      })
      if (result.ok === false) return res.status(400).json({ error: result.error })
      return res.status(200).json({
        ok: true,
        guild: result.guild,
        goldSpent: CREATE_GUILD_COST,
      })
    }

    if (action === 'join') {
      const guildId = String(body.guildId ?? '')
      const result = joinGuild({
        telegramId: user.id,
        displayName: user.first_name,
        username: user.username ?? `user_${user.id}`,
        guildId,
      })
      if (result.ok === false) return res.status(400).json({ error: result.error })
      return res.status(200).json({ ok: true, guild: result.guild })
    }

    if (action === 'leave') {
      leaveGuild(user.id)
      return res.status(200).json({ ok: true })
    }

    if (action === 'my') {
      return res.status(200).json({ ok: true, guild: getGuildForMember(user.id) })
    }

    if (action === 'chat_send') {
      const myGuild = getGuildForMember(user.id)
      if (!myGuild) return res.status(400).json({ error: 'Вы не в гильдии' })
      const msg = sendGuildChat({
        guildId: myGuild.id,
        senderId: user.id,
        senderName: user.first_name,
        text: body.text ?? '',
      })
      if (!msg) return res.status(400).json({ error: 'Не удалось отправить' })
      return res.status(200).json({ ok: true, message: msg })
    }

    if (action === 'chat_poll') {
      const myGuild = getGuildForMember(user.id)
      if (!myGuild) return res.status(200).json({ ok: true, messages: [] })
      return res.status(200).json({
        ok: true,
        messages: getGuildChat(myGuild.id, body.after),
        guildId: myGuild.id,
      })
    }

    if (action === 'same_guild') {
      const toId = Math.floor(Number(body.guildId))
      return res.status(200).json({ ok: true, same: areSameGuild(user.id, toId) })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Guild error'
    return res.status(500).json({ error: message })
  }
}
