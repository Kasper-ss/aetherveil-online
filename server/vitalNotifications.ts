import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getMiniAppUrl, sendMessage } from './telegram.js'

export interface VitalSyncPayload {
  energy: number
  maxEnergy: number
  currentHp: number
  maxHp: number
  endurance: number
  energyLastRegenAt: string
  hpLastRegenAt: string
  notifyHp: boolean
  notifyEnergy: boolean
}

interface VitalNotifyState {
  telegram_id: number
  hp_notified_full: boolean
  energy_notified_full: boolean
  updated_at: string
}

type StateMap = Map<number, VitalNotifyState>

const globalStore = globalThis as typeof globalThis & {
  __aetherveilVitalNotify?: StateMap
}

function states(): StateMap {
  if (!globalStore.__aetherveilVitalNotify) {
    globalStore.__aetherveilVitalNotify = new Map()
  }
  return globalStore.__aetherveilVitalNotify
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function energyRegenIntervalMs(endurance: number): number {
  return Math.max(8_000, 30_000 - endurance * 800)
}

function hpRegenIntervalMs(maxHp: number, endurance: number): number {
  const targetFullHealMs = 3_600_000
  const baseInterval = maxHp > 1 ? Math.floor(targetFullHealMs / (maxHp - 1)) : targetFullHealMs
  const enduranceBonus = Math.min(0.3, endurance * 0.025)
  return Math.max(2_000, Math.floor(baseInterval * (1 - enduranceBonus)))
}

export function projectEnergy(v: VitalSyncPayload, now = Date.now()): number {
  if (v.energy >= v.maxEnergy) return v.maxEnergy
  const interval = energyRegenIntervalMs(v.endurance)
  const last = new Date(v.energyLastRegenAt).getTime()
  const ticks = Math.floor((now - last) / interval)
  if (ticks <= 0) return v.energy
  return Math.min(v.maxEnergy, v.energy + ticks)
}

export function projectHp(v: VitalSyncPayload, now = Date.now()): number {
  if (v.currentHp >= v.maxHp) return v.maxHp
  const interval = hpRegenIntervalMs(v.maxHp, v.endurance)
  const last = new Date(v.hpLastRegenAt).getTime()
  const ticks = Math.floor((now - last) / interval)
  if (ticks <= 0) return v.currentHp
  return Math.min(v.maxHp, v.currentHp + ticks)
}

async function loadState(telegramId: number): Promise<VitalNotifyState> {
  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('vital_notify_state')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle()
    if (data) {
      const row = data as VitalNotifyState
      states().set(telegramId, row)
      return row
    }
  }
  return states().get(telegramId) ?? {
    telegram_id: telegramId,
    hp_notified_full: false,
    energy_notified_full: false,
    updated_at: new Date().toISOString(),
  }
}

async function saveState(state: VitalNotifyState): Promise<void> {
  const now = new Date().toISOString()
  const record = { ...state, updated_at: now }
  states().set(state.telegram_id, record)
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('vital_notify_state').upsert(record, { onConflict: 'telegram_id' })
  }
}

async function sendVitalBotMessage(telegramId: number, text: string): Promise<void> {
  const appUrl = getMiniAppUrl()
  const replyMarkup = appUrl
    ? {
        inline_keyboard: [[{ text: '⚔️ Играть', web_app: { url: appUrl } }]],
      }
    : undefined

  await sendMessage({
    chat_id: telegramId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

export async function processVitalBotNotifications(
  telegramId: number,
  vitals: VitalSyncPayload | undefined,
): Promise<{ sent: string[] }> {
  if (!vitals) return { sent: [] }

  const projectedHp = projectHp(vitals)
  const projectedEnergy = projectEnergy(vitals)
  const hpFull = projectedHp >= vitals.maxHp
  const energyFull = projectedEnergy >= vitals.maxEnergy

  const state = await loadState(telegramId)
  const sent: string[] = []

  if (!hpFull) state.hp_notified_full = false
  if (!energyFull) state.energy_notified_full = false

  const hpJustFull = hpFull && !state.hp_notified_full && vitals.notifyHp
  const energyJustFull = energyFull && !state.energy_notified_full && vitals.notifyEnergy

  try {
    if (hpJustFull && energyJustFull) {
      await sendVitalBotMessage(
        telegramId,
        '❤️⚡ HP и энергия полностью восстановлены! Можно снова в бой.',
      )
      state.hp_notified_full = true
      state.energy_notified_full = true
      sent.push('both')
    } else {
      if (hpJustFull) {
        await sendVitalBotMessage(telegramId, '❤️ HP полностью восстановлено!')
        state.hp_notified_full = true
        sent.push('hp')
      }
      if (energyJustFull) {
        await sendVitalBotMessage(telegramId, '⚡ Энергия полностью восстановлена!')
        state.energy_notified_full = true
        sent.push('energy')
      }
    }
  } catch (err) {
    console.warn('[vitalNotifications] send failed', err)
    return { sent: [] }
  }

  if (sent.length > 0) {
    await saveState(state)
  } else if (!hpFull || !energyFull) {
    await saveState(state)
  }

  return { sent }
}

export async function notifyVitalViaBot(
  telegramId: number,
  kind: 'hp' | 'energy' | 'both',
  vitals: VitalSyncPayload,
): Promise<boolean> {
  const state = await loadState(telegramId)
  const hpFull = vitals.currentHp >= vitals.maxHp
  const energyFull = vitals.energy >= vitals.maxEnergy

  if (kind === 'hp' && (!vitals.notifyHp || !hpFull || state.hp_notified_full)) return false
  if (kind === 'energy' && (!vitals.notifyEnergy || !energyFull || state.energy_notified_full)) return false
  if (kind === 'both' && (!vitals.notifyHp || !vitals.notifyEnergy || !hpFull || !energyFull)) return false
  if (kind === 'both' && state.hp_notified_full && state.energy_notified_full) return false

  const result = await processVitalBotNotifications(telegramId, vitals)
  if (kind === 'both') return result.sent.includes('both')
  return result.sent.includes(kind)
}
