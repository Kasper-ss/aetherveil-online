import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getMiniAppUrl, sendMessage } from './telegram.js'

const WORLD_BOSS_CYCLE_MS = 3 * 24 * 60 * 60 * 1000
const WORLD_BOSS_ACTIVE_MS = 24 * 60 * 60 * 1000
const WORLD_BOSS_EPOCH = Date.UTC(2026, 0, 1, 12, 0, 0)

interface NotifyState {
  telegram_id: number
  sent_keys: string[]
  updated_at: string
}

type StateMap = Map<number, NotifyState>

const globalStore = globalThis as typeof globalThis & {
  __aetherveilWorldBossNotify?: StateMap
}

function states(): StateMap {
  if (!globalStore.__aetherveilWorldBossNotify) {
    globalStore.__aetherveilWorldBossNotify = new Map()
  }
  return globalStore.__aetherveilWorldBossNotify
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function getSchedule(now = Date.now()) {
  const spawnIndex = Math.floor((now - WORLD_BOSS_EPOCH) / WORLD_BOSS_CYCLE_MS)
  const spawnAt = WORLD_BOSS_EPOCH + spawnIndex * WORLD_BOSS_CYCLE_MS
  const windowEndsAt = spawnAt + WORLD_BOSS_ACTIVE_MS
  const isActive = now >= spawnAt && now < windowEndsAt
  const nextSpawnAt = isActive
    ? WORLD_BOSS_EPOCH + (spawnIndex + 1) * WORLD_BOSS_CYCLE_MS
    : (now < spawnAt ? spawnAt : WORLD_BOSS_EPOCH + (spawnIndex + 1) * WORLD_BOSS_CYCLE_MS)
  const msUntilNext = Math.max(0, nextSpawnAt - now)
  const daysUntilNext = Math.ceil(msUntilNext / (24 * 60 * 60 * 1000))
  return { spawnIndex, isActive, nextSpawnAt, daysUntilNext }
}

function getNotification(now = Date.now()): { key: string; text: string } | null {
  const schedule = getSchedule(now)
  const nextIndex = schedule.isActive ? schedule.spawnIndex : Math.floor((schedule.nextSpawnAt - WORLD_BOSS_EPOCH) / WORLD_BOSS_CYCLE_MS)

  if (schedule.isActive) {
    return {
      key: `wb_today_${schedule.spawnIndex}`,
      text: 'Сегодня будет Мировой Босс! Архонт Эфирной Бездны открыт для боя.',
    }
  }
  if (schedule.daysUntilNext === 3) {
    return { key: `wb_d3_${nextIndex}`, text: 'Через 3 дня появится Мировой Босс — Архонт Эфирной Бездны!' }
  }
  if (schedule.daysUntilNext === 2) {
    return { key: `wb_d2_${nextIndex}`, text: 'Через 2 дня появится Мировой Босс!' }
  }
  if (schedule.daysUntilNext === 1) {
    return { key: `wb_d1_${nextIndex}`, text: 'Через 1 день появится Мировой Босс!' }
  }
  return null
}

async function loadState(telegramId: number): Promise<NotifyState> {
  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('world_boss_notify_state')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle()
    if (data) {
      const row = data as NotifyState
      states().set(telegramId, row)
      return row
    }
  }
  return states().get(telegramId) ?? { telegram_id: telegramId, sent_keys: [], updated_at: new Date().toISOString() }
}

async function saveState(state: NotifyState): Promise<void> {
  const record = { ...state, updated_at: new Date().toISOString() }
  states().set(state.telegram_id, record)
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('world_boss_notify_state').upsert(record, { onConflict: 'telegram_id' })
  }
}

export async function processWorldBossNotifications(telegramId: number): Promise<{ sent: boolean }> {
  const notification = getNotification()
  if (!notification) return { sent: false }

  const state = await loadState(telegramId)
  if (state.sent_keys.includes(notification.key)) return { sent: false }

  const appUrl = getMiniAppUrl()
  const replyMarkup = appUrl
    ? { inline_keyboard: [[{ text: '⚔️ К боссу', web_app: { url: appUrl } }]] }
    : undefined

  try {
    await sendMessage({
      chat_id: telegramId,
      text: notification.text,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    })
    const sentKeys = [...state.sent_keys, notification.key].slice(-24)
    await saveState({ ...state, sent_keys: sentKeys })
    return { sent: true }
  } catch (err) {
    console.warn('[worldBossNotifications] send failed', err)
    return { sent: false }
  }
}
