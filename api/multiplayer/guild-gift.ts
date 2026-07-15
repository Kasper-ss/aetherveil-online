import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateInitData, getBotToken } from '../../server/telegram.js'
import { queueGuildGift } from '../../server/guildGifts.js'
import { areSameGuild } from '../../server/guildRegistry.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as {
      initData?: string
      toId?: number
      item?: Record<string, unknown>
    }

    const user = validateInitData(body.initData ?? '', getBotToken())
    if (!user) {
      return res.status(401).json({ error: 'Недействительные данные Telegram' })
    }

    const toId = Math.floor(Number(body.toId))
    if (!toId || toId === user.id) {
      return res.status(400).json({ error: 'Некорректный получатель' })
    }
    if (!body.item?.id) {
      return res.status(400).json({ error: 'Нет предмета для отправки' })
    }
    if (!areSameGuild(user.id, toId)) {
      return res.status(403).json({ error: 'Игроки не в одной гильдии' })
    }

    const gift = queueGuildGift({
      fromId: user.id,
      fromName: user.first_name,
      toId,
      item: body.item as import('../../server/guildGifts.js').GuildGiftItem,
    })

    return res.status(200).json({ ok: true, giftId: gift.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gift error'
    return res.status(500).json({ error: message })
  }
}
