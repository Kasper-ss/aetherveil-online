import {
  GAME_EVENT_DEFINITIONS,
  type GameEventDefinition,
  type GameEventKind,
  type GameEventTier,
} from './gameEvents'

export const DAY_MS = 24 * 60 * 60 * 1000
export const WEEK_MS = 7 * DAY_MS
export const EVENTS_EPOCH = Date.UTC(2026, 0, 5, 0, 0, 0)

const SHADOW_INVASION_CYCLE_MS = 21 * DAY_MS
const SHADOW_INVASION_EPOCH = Date.UTC(2026, 0, 12, 12, 0, 0)

export interface ScheduledGameEvent {
  instanceId: string
  kind: GameEventKind
  title: string
  icon: string
  description: string
  buffs: string[]
  tier: GameEventTier
  startAt: number
  endAt: number
  isHardDungeon?: boolean
  lootMult: number
  bossLootMult: number
  goldMult: number
}

function seeded(seed: number, mod: number): number {
  return ((seed * 1103515245 + 12345) >>> 0) % mod
}

export function getWeekStartUtc(now = Date.now()): number {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.getTime()
}

function makeScheduled(
  kind: GameEventKind,
  startAt: number,
  endAt: number,
  instanceSuffix: string,
): ScheduledGameEvent {
  const def = GAME_EVENT_DEFINITIONS[kind]
  return {
    instanceId: `${kind}_${instanceSuffix}`,
    kind,
    title: def.title,
    icon: def.icon,
    description: def.description,
    buffs: def.buffs,
    tier: def.tier,
    startAt,
    endAt,
    isHardDungeon: def.isHardDungeon,
    lootMult: def.lootMult ?? 1,
    bossLootMult: def.bossLootMult ?? def.lootMult ?? 1,
    goldMult: def.goldMult ?? 1,
  }
}

function buildWeeklyEvents(weekStart: number, weekIndex: number): ScheduledGameEvent[] {
  const seed = weekIndex * 9973 + 41
  const eventCount = 1 + seeded(seed, 2)
  const pool: GameEventKind[] = ['blood_moon', 'legendary_hunt', 'dark_portal']
  const first = seeded(seed + 1, 3)
  const second = (first + 1 + seeded(seed + 2, 2)) % 3

  const selected: GameEventKind[] =
    eventCount === 1 ? [pool[first]] : [pool[first], first === second ? pool[(second + 1) % 3] : pool[second]]

  const events: ScheduledGameEvent[] = []
  const suffix = `w${weekIndex}`

  if (selected.length === 1) {
    const kind = selected[0]
    const def = GAME_EVENT_DEFINITIONS[kind]
    if (kind === 'blood_moon') {
      events.push(makeScheduled(kind, weekStart, weekStart + def.durationDays * DAY_MS, suffix))
    } else {
      const maxOffset = 7 - def.durationDays
      const offset = seeded(seed + 3, Math.max(1, maxOffset + 1))
      const start = weekStart + offset * DAY_MS
      events.push(makeScheduled(kind, start, start + def.durationDays * DAY_MS, `${suffix}_${offset}`))
    }
    return events
  }

  const sorted = [...selected].sort(
    (a, b) => GAME_EVENT_DEFINITIONS[a].durationDays - GAME_EVENT_DEFINITIONS[b].durationDays,
  )
  let cursor = seeded(seed + 4, 3)
  for (const kind of sorted) {
    const dur = GAME_EVENT_DEFINITIONS[kind].durationDays
    if (cursor + dur > 7) cursor = Math.max(0, 7 - dur)
    const start = weekStart + cursor * DAY_MS
    events.push(makeScheduled(kind, start, start + dur * DAY_MS, `${suffix}_${kind}`))
    cursor += dur + seeded(seed + kind.charCodeAt(0), 2)
  }
  return events
}

function buildShadowInvasions(rangeStart: number, rangeEnd: number): ScheduledGameEvent[] {
  const events: ScheduledGameEvent[] = []
  let idx = Math.floor((rangeStart - SHADOW_INVASION_EPOCH) / SHADOW_INVASION_CYCLE_MS)
  if (idx < 0) idx = 0
  for (;;) {
    const start = SHADOW_INVASION_EPOCH + idx * SHADOW_INVASION_CYCLE_MS
    const end = start + GAME_EVENT_DEFINITIONS.shadow_invasion.durationDays * DAY_MS
    if (start > rangeEnd) break
    if (end >= rangeStart) {
      events.push(makeScheduled('shadow_invasion', start, end, `s${idx}`))
    }
    idx += 1
  }
  return events
}

function buildSecretFloors(rangeStart: number, rangeEnd: number): ScheduledGameEvent[] {
  const events: ScheduledGameEvent[] = []
  const startDate = new Date(rangeStart)
  const endDate = new Date(rangeEnd)
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))

  while (cursor.getTime() <= endDate.getTime()) {
    const y = cursor.getUTCFullYear()
    const m = cursor.getUTCMonth()
    const monthStart = Date.UTC(y, m, 15, 0, 0, 0)
    const monthEnd = monthStart + GAME_EVENT_DEFINITIONS.secret_floor.durationDays * DAY_MS
    if (monthEnd >= rangeStart && monthStart <= rangeEnd) {
      events.push(makeScheduled('secret_floor', monthStart, monthEnd, `${y}_${m + 1}`))
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return events
}

export function getScheduledEventsInRange(rangeStart: number, rangeEnd: number): ScheduledGameEvent[] {
  const events: ScheduledGameEvent[] = []
  const firstWeek = getWeekStartUtc(rangeStart)
  const lastWeek = getWeekStartUtc(rangeEnd)

  for (let ws = firstWeek - WEEK_MS; ws <= lastWeek + WEEK_MS; ws += WEEK_MS) {
    const weekIndex = Math.floor((ws - EVENTS_EPOCH) / WEEK_MS)
    events.push(...buildWeeklyEvents(ws, weekIndex))
  }

  events.push(...buildShadowInvasions(rangeStart, rangeEnd))
  events.push(...buildSecretFloors(rangeStart, rangeEnd))

  const byId = new Map<string, ScheduledGameEvent>()
  for (const ev of events) {
    if (ev.endAt > rangeStart && ev.startAt < rangeEnd) {
      byId.set(ev.instanceId, ev)
    }
  }
  return [...byId.values()].sort((a, b) => a.startAt - b.startAt || a.title.localeCompare(b.title, 'ru'))
}

export function getScheduledEvents(now = Date.now(), horizonDays = 42): ScheduledGameEvent[] {
  return getScheduledEventsInRange(now - DAY_MS, now + horizonDays * DAY_MS)
}

export function getActiveEvents(now = Date.now()): ScheduledGameEvent[] {
  return getScheduledEvents(now).filter((e) => now >= e.startAt && now < e.endAt)
}

export function isEventActive(kind: GameEventKind, now = Date.now()): boolean {
  return getActiveEvents(now).some((e) => e.kind === kind)
}

export function getActiveEventLootMult(isBoss: boolean, now = Date.now()): number {
  let mult = 1
  for (const ev of getActiveEvents(now)) {
    mult *= isBoss ? ev.bossLootMult : ev.lootMult
  }
  return Math.min(mult, 4)
}

export function getActiveEventGoldMult(now = Date.now()): number {
  let mult = 1
  for (const ev of getActiveEvents(now)) {
    mult *= ev.goldMult
  }
  return Math.min(mult, 4)
}

export function getLegendaryHuntExploreBonus(now = Date.now()): number {
  return isEventActive('legendary_hunt', now) ? 0.3 : 0
}

export function formatEventDateTime(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }) + ' UTC'
}

export function formatEventCountdown(ms: number): string {
  if (ms <= 0) return 'Сейчас'
  const totalMin = Math.ceil(ms / 60_000)
  const days = Math.floor(totalMin / (60 * 24))
  const hours = Math.floor((totalMin % (60 * 24)) / 60)
  const mins = totalMin % 60
  if (days > 0) return `${days} д ${hours} ч`
  if (hours > 0) return `${hours} ч ${mins} м`
  return `${mins} м`
}

export function getEventStatus(ev: ScheduledGameEvent, now = Date.now()): 'active' | 'upcoming' | 'ended' {
  if (now >= ev.startAt && now < ev.endAt) return 'active'
  if (now < ev.startAt) return 'upcoming'
  return 'ended'
}

export interface EventNotification {
  key: string
  text: string
}

/** Одно уведомление за синхронизацию — ближайшее по приоритету. */
export function getEventNotification(now = Date.now()): EventNotification | null {
  const events = getScheduledEvents(now, 21)
  let best: { priority: number; note: EventNotification } | null = null

  for (const ev of events) {
    const msUntil = ev.startAt - now
    const isActive = now >= ev.startAt && now < ev.endAt

    if (isActive) {
      const note: EventNotification = {
        key: `${ev.instanceId}_active`,
        text: `${ev.icon} Событие «${ev.title}» уже идёт! ${ev.buffs.join(' · ')}`,
      }
      const priority = 100
      if (!best || priority > best.priority) best = { priority, note }
      continue
    }

    if (msUntil <= 0) continue

    const hoursUntil = msUntil / (60 * 60 * 1000)
    const daysUntil = Math.ceil(msUntil / DAY_MS)

    if (hoursUntil <= 6) {
      const h = Math.max(1, Math.ceil(hoursUntil))
      const note: EventNotification = {
        key: `${ev.instanceId}_h6`,
        text: `⏰ Через ${h} ч. начнётся «${ev.title}»! ${ev.description}`,
      }
      if (!best || 90 > best.priority) best = { priority: 90, note }
    } else if (daysUntil === 1) {
      const note: EventNotification = {
        key: `${ev.instanceId}_d1`,
        text: `📅 Завтра начнётся «${ev.title}»! ${ev.buffs.join(' · ')}`,
      }
      if (!best || 80 > best.priority) best = { priority: 80, note }
    } else if (daysUntil === 2) {
      const note: EventNotification = {
        key: `${ev.instanceId}_d2`,
        text: `📅 Через 2 дня начнётся «${ev.title}».`,
      }
      if (!best || 70 > best.priority) best = { priority: 70, note }
    } else if (daysUntil === 3) {
      const note: EventNotification = {
        key: `${ev.instanceId}_d3`,
        text: `📅 Через 3 дня начнётся «${ev.title}».`,
      }
      if (!best || 60 > best.priority) best = { priority: 60, note }
    }
  }

  return best?.note ?? null
}

export function getDefinition(kind: GameEventKind): GameEventDefinition {
  return GAME_EVENT_DEFINITIONS[kind]
}
