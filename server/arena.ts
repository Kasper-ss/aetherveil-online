import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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

export interface ArenaSettleResult {
  ok: boolean
  goldStolen?: number
  error?: string
}

/** Списывает золото и обновляет PvP-статистику противника (офлайн). */
export async function settleArenaFight(input: {
  attackerId: number
  opponentId: number
  victory: boolean
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

    return { ok: true, goldStolen }
  }

  const opponentSave = await loadPlayerSave(input.opponentId)
  if (opponentSave) {
    const opponentFull = { ...opponentSave.full }
    opponentFull.pvpWins = ((opponentFull.pvpWins as number) ?? 0) + 1
    await savePlayerSave(input.opponentId, opponentFull)
  }

  return { ok: true, goldStolen: 0 }
}
