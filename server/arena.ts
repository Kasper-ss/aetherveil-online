import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getMiniAppUrl, sendMessage } from './telegram.js'

const ARENA_GOLD_STEAL_PCT = 0.01

interface ArenaPlayerSave {
  gold?: number
  pvpWins?: number
  pvpLosses?: number
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key)
}

async function loadPlayerSave(telegramId: number): Promise<{ data: ArenaPlayerSave; full: Record<string, unknown> } | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data: row } = await supabase
    .from('players')
    .select('data')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  if (!row?.data) return null
  const full = row.data as Record<string, unknown>
  return { data: full as ArenaPlayerSave, full }
}

async function savePlayerSave(telegramId: number, full: Record<string, unknown>): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false

  const { error } = await supabase.from('players').upsert({
    telegram_id: telegramId,
    data: full,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'telegram_id' })

  return !error
}

async function getOpponentGold(telegramId: number): Promise<number> {
  const save = await loadPlayerSave(telegramId)
  if (save?.data.gold != null) return Math.max(0, save.data.gold)

  const supabase = getSupabase()
  if (!supabase) return 0

  const { data } = await supabase
    .from('player_profiles')
    .select('profile')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  const profile = data?.profile as { gold?: number } | undefined
  return Math.max(0, profile?.gold ?? 0)
}

async function patchOpponentPublicProfile(
  telegramId: number,
  patch: { goldDelta?: number; pvpLossesInc?: number; pvpWinsInc?: number },
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  const { data } = await supabase
    .from('player_profiles')
    .select('profile')
    .eq('telegram_id', telegramId)
    .maybeSingle()

  if (!data?.profile) return

  const profile = data.profile as Record<string, unknown>
  const next: Record<string, unknown> = { ...profile }
  if (patch.goldDelta) {
    next.gold = Math.max(0, ((profile.gold as number) ?? 0) + patch.goldDelta)
  }
  if (patch.pvpLossesInc) {
    next.pvpLosses = ((profile.pvpLosses as number) ?? 0) + patch.pvpLossesInc
  }
  if (patch.pvpWinsInc) {
    next.pvpWins = ((profile.pvpWins as number) ?? 0) + patch.pvpWinsInc
  }

  await supabase.from('player_profiles').upsert({
    telegram_id: telegramId,
    profile: next,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'telegram_id' })
}

async function notifyArenaDefeat(input: {
  opponentId: number
  attackerName: string
  goldStolen: number
}): Promise<void> {
  const appUrl = getMiniAppUrl()
  const replyMarkup = appUrl
    ? { inline_keyboard: [[{ text: '⚔️ На арену', web_app: { url: appUrl } }]] }
    : undefined

  const goldLine = input.goldStolen > 0
    ? `💸 Потеряно: 🪙 ${input.goldStolen.toLocaleString('ru-RU')}`
    : '💸 У вас не было золота для похищения.'

  try {
    await sendMessage({
      chat_id: input.opponentId,
      text: [
        '⚔️ Вас победили на арене PvP!',
        '',
        `Победитель: ${input.attackerName}`,
        goldLine,
      ].join('\n'),
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    })
  } catch (err) {
    console.warn('[arena] defeat notify failed', err)
  }
}

export interface ArenaSettleResult {
  ok: boolean
  goldStolen?: number
  error?: string
}

/** Списывает золото и обновляет PvP-статистику противника. */
export async function settleArenaFight(input: {
  attackerId: number
  opponentId: number
  victory: boolean
  attackerName?: string
}): Promise<ArenaSettleResult> {
  if (input.attackerId === input.opponentId) {
    return { ok: false, error: 'Нельзя сражаться с самим собой' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: true, goldStolen: 0 }
  }

  if (input.victory) {
    const opponentGold = await getOpponentGold(input.opponentId)
    const goldStolen = opponentGold > 0 ? Math.max(1, Math.floor(opponentGold * ARENA_GOLD_STEAL_PCT)) : 0

    const opponentSave = await loadPlayerSave(input.opponentId)
    if (opponentSave) {
      const opponentFull = { ...opponentSave.full }
      if (goldStolen > 0) {
        opponentFull.gold = Math.max(0, ((opponentFull.gold as number) ?? 0) - goldStolen)
      }
      opponentFull.pvpLosses = ((opponentFull.pvpLosses as number) ?? 0) + 1
      await savePlayerSave(input.opponentId, opponentFull)
    }

    await patchOpponentPublicProfile(input.opponentId, {
      goldDelta: goldStolen > 0 ? -goldStolen : undefined,
      pvpLossesInc: 1,
    })

    void notifyArenaDefeat({
      opponentId: input.opponentId,
      attackerName: input.attackerName?.trim() || 'Игрок',
      goldStolen,
    })

    return { ok: true, goldStolen }
  }

  const opponentSave = await loadPlayerSave(input.opponentId)
  if (opponentSave) {
    const opponentFull = { ...opponentSave.full }
    opponentFull.pvpWins = ((opponentFull.pvpWins as number) ?? 0) + 1
    await savePlayerSave(input.opponentId, opponentFull)
  }

  await patchOpponentPublicProfile(input.opponentId, { pvpWinsInc: 1 })

  return { ok: true, goldStolen: 0 }
}
