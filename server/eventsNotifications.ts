import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEventNotification } from '@shared/eventsSchedule'
import { getMiniAppUrl, sendMessage } from './telegram.js'

interface NotifyState {
  telegram_id: number
  sent_keys: string[]
  updated_at: string
}

type StateMap = Map<number, NotifyState>

const globalStore = globalThis as typeof globalThis & {
  __aetherveilEventNotify?: StateMap
}

function states(): StateMap {
  if (!globalStore.__aetherveilEventNotify) {
    globalStore.__aetherveilEventNotify = new Map()
  }
  return globalStore.__aetherveilEventNotify
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function loadState(telegramId: number): Promise<NotifyState> {
  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('event_notify_state')
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
    await supabase.from('event_notify_state').upsert(record, { onConflict: 'telegram_id' })
  }
}

export async function processEventNotifications(telegramId: number): Promise<{ sent: boolean }> {
  const notification = getEventNotification()
  if (!notification) return { sent: false }

  const state = await loadState(telegramId)
  if (state.sent_keys.includes(notification.key)) return { sent: false }

  const appUrl = getMiniAppUrl()
  const eventsUrl = appUrl ? `${appUrl}/events` : undefined
  const replyMarkup = eventsUrl
    ? { inline_keyboard: [[{ text: '📅 События', web_app: { url: eventsUrl } }]] }
    : undefined

  try {
    await sendMessage({
      chat_id: telegramId,
      text: notification.text,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    })
    const sentKeys = [...state.sent_keys, notification.key].slice(-32)
    await saveState({ ...state, sent_keys: sentKeys })
    return { sent: true }
  } catch (err) {
    console.warn('[eventsNotifications] send failed', err)
    return { sent: false }
  }
}
