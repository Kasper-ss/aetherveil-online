import type { VercelRequest, VercelResponse } from '@vercel/node'
import { syncPublicPlayer } from '../../server/playerRegistry.js'
import { processReferralSync } from '../../server/referrals.js'
import { validateInitData, getBotToken } from '../../server/telegram.js'
import { claimGuildGifts } from '../../server/guildGifts.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body as {
      initData?: string
      level?: number
      highestFloor?: number
      displayName?: string
      username?: string
      guildId?: string
      marketListings?: unknown[]
      publicProfile?: Record<string, unknown>
      referredBy?: string
      lifetimeGoldEarned?: number
      classSelected?: boolean
      tutorialCompleted?: boolean
    }

    const user = validateInitData(body.initData ?? '', getBotToken())
    if (!user) {
      return res.status(401).json({ error: 'Недействительные данные Telegram' })
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
      publicProfile: body.publicProfile,
    })

    const incomingGifts = claimGuildGifts(user.id)

    const referral = await processReferralSync({
      telegramId: user.id,
      referredBy: body.referredBy,
      displayName: body.displayName ?? user.first_name,
      lifetimeGoldEarned: Number(body.lifetimeGoldEarned ?? 0),
      classSelected: !!body.classSelected,
      tutorialCompleted: !!body.tutorialCompleted,
      level: Number(body.level ?? 1),
      highestFloor: Number(body.highestFloor ?? 1),
    })

    return res.status(200).json({ ok: true, ...result, incomingGifts, ...referral })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync error'
    return res.status(500).json({ error: message })
  }
}
