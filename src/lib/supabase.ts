import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Player } from '@/types/game'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Supabase client — returns null when env vars are not configured.
 * MVP uses localStorage mock; swap to Supabase when credentials are set.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseEnabled = supabase !== null

/** Load player from Supabase by Telegram user id */
export async function loadPlayerFromSupabase(telegramId: number): Promise<Player | null> {
  if (!supabase) return null

  try {
    const query = supabase
      .from('players')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    const { data, error } = await Promise.race([
      query,
      new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Supabase timeout') }), 5000)
      ),
    ])

    if (error || !data) return null
    const row = data as { data?: Player } & Player
    return (row.data ?? row) as Player
  } catch {
    return null
  }
}

/** Persist player to Supabase (upsert) */
export async function savePlayerToSupabase(player: Player): Promise<void> {
  if (!supabase) return

  await supabase.from('players').upsert(
    {
      telegram_id: player.telegramId,
      data: player,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'telegram_id' }
  )
}

/**
 * SQL schema for Supabase (run in SQL editor):
 *
 * CREATE TABLE players (
 *   telegram_id BIGINT PRIMARY KEY,
 *   data JSONB NOT NULL,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE leaderboard (
 *   telegram_id BIGINT PRIMARY KEY,
 *   username TEXT,
 *   floor INT DEFAULT 1,
 *   level INT DEFAULT 1,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * ALTER TABLE players ENABLE ROW LEVEL SECURITY;
 * -- Add RLS policies based on your auth strategy
 */
