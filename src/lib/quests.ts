import type { Player, QuestEvent, QuestState } from '@/types/game'
import { DAILY_QUESTS, WEEKLY_QUESTS } from '@/data/quests'

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function weekKey(): string {
  const d = new Date()
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${week}`
}

export function defaultQuestState(player?: Player): QuestState {
  return {
    dailyDate: todayKey(),
    dailyProgress: {},
    dailyClaimed: [],
    weeklyKey: weekKey(),
    weeklyProgress: {},
    weeklyClaimed: [],
    guildClaimed: [],
    weeklyFloorBaseline: player?.highestFloor ?? 1,
  }
}

export function normalizeQuestState(player: Player): QuestState {
  const base = player.questState ?? defaultQuestState(player)
  const today = todayKey()
  const wk = weekKey()
  let state = { ...base }

  if (state.dailyDate !== today) {
    state = {
      ...state,
      dailyDate: today,
      dailyProgress: {},
      dailyClaimed: [],
    }
  }
  if (state.weeklyKey !== wk) {
    state = {
      ...state,
      weeklyKey: wk,
      weeklyProgress: {},
      weeklyClaimed: [],
      weeklyFloorBaseline: player.highestFloor,
    }
  }
  return state
}

export function bumpQuestEvent(
  state: QuestState,
  event: QuestEvent,
  amount = 1,
  highestFloor?: number,
): QuestState {
  const next = { ...state, dailyProgress: { ...state.dailyProgress }, weeklyProgress: { ...state.weeklyProgress } }

  for (const q of DAILY_QUESTS) {
    if (q.event === event) {
      next.dailyProgress[q.id] = (next.dailyProgress[q.id] ?? 0) + amount
    }
  }
  for (const q of WEEKLY_QUESTS) {
    if (q.event === event) {
      if (event === 'advance_floor' && highestFloor !== undefined) {
        const baseline = state.weeklyFloorBaseline ?? highestFloor
        next.weeklyProgress[q.id] = Math.max(0, highestFloor - baseline)
      } else {
        next.weeklyProgress[q.id] = (next.weeklyProgress[q.id] ?? 0) + amount
      }
    }
  }
  return next
}

export function getQuestProgress(state: QuestState, questId: string, scope: 'daily' | 'weekly'): number {
  if (scope === 'daily') return state.dailyProgress[questId] ?? 0
  return state.weeklyProgress[questId] ?? 0
}

export function isQuestClaimed(state: QuestState, questId: string, scope: 'daily' | 'weekly' | 'guild'): boolean {
  if (scope === 'daily') return state.dailyClaimed.includes(questId)
  if (scope === 'weekly') return state.weeklyClaimed.includes(questId)
  return state.guildClaimed.includes(questId)
}
