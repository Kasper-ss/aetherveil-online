import type { Player, Stats, GuildMember, GuildChatMessage } from '@/types/game'
import { getEffectiveStats, getCombatMaxHp } from '@/lib/playerStats'
import { applySetBonuses } from '@/lib/setBonuses'
import { storageGet, storageSet } from '@/lib/utils'

export const GUILD_MAX_MEMBERS = 10
export const GUILD_ID = 'guild_tower_1'
const ONLINE_KEY = 'aetherveil_online'
const CHAT_KEY = 'aetherveil_guild_chat'
const ONLINE_TTL_MS = 90_000

export interface OnlinePlayerSnapshot {
  telegramId: number
  displayName: string
  username: string
  level: number
  highestFloor: number
  classId?: string
  stats: Stats
  maxHp: number
  lastSeen: string
  inArena: boolean
  guildId: string
}

type OnlineRegistry = Record<string, OnlinePlayerSnapshot>

function readOnline(): OnlineRegistry {
  return storageGet<OnlineRegistry>(ONLINE_KEY, {})
}

function writeOnline(registry: OnlineRegistry) {
  storageSet(ONLINE_KEY, registry)
}

function pruneOnline(registry: OnlineRegistry): OnlineRegistry {
  const now = Date.now()
  const pruned: OnlineRegistry = {}
  for (const [id, p] of Object.entries(registry)) {
    if (now - new Date(p.lastSeen).getTime() < ONLINE_TTL_MS * 2) {
      pruned[id] = p
    }
  }
  return pruned
}

export function registerOnlinePlayer(player: Player) {
  const stats = applySetBonuses(player, getEffectiveStats(player))
  const snapshot: OnlinePlayerSnapshot = {
    telegramId: player.telegramId,
    displayName: player.displayName,
    username: player.username,
    level: player.level,
    highestFloor: player.highestFloor,
    classId: player.classId,
    stats: { atk: stats.atk, def: stats.def, hp: stats.hp, crit: stats.crit, speed: stats.speed },
    maxHp: getCombatMaxHp(player),
    lastSeen: new Date().toISOString(),
    inArena: false,
    guildId: player.guildId ?? GUILD_ID,
  }
  const registry = pruneOnline(readOnline())
  registry[String(player.telegramId)] = snapshot
  writeOnline(registry)
}

export function setArenaStatus(telegramId: number, inArena: boolean) {
  const registry = readOnline()
  const key = String(telegramId)
  if (registry[key]) {
    registry[key] = { ...registry[key], inArena, lastSeen: new Date().toISOString() }
    writeOnline(registry)
  }
}

export function getOnlinePlayers(excludeId?: number): OnlinePlayerSnapshot[] {
  const now = Date.now()
  const registry = pruneOnline(readOnline())
  return Object.values(registry).filter((p) => {
    if (excludeId && p.telegramId === excludeId) return false
    return now - new Date(p.lastSeen).getTime() < ONLINE_TTL_MS
  })
}

export function findArenaOpponent(selfId: number): OnlinePlayerSnapshot | null {
  const online = getOnlinePlayers(selfId)
  const candidates = online.filter((p) => p.inArena)
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  if (online.length > 0) {
    return online[Math.floor(Math.random() * online.length)]
  }
  return null
}

export function getGuildMembers(selfId: number): GuildMember[] {
  ensureGuildLeader(selfId)
  const leaderId = getGuildSettings().leaderId
  const online = getOnlinePlayers()
  const self = online.find((p) => p.telegramId === selfId)
  const all = self ? [...online] : online
  if (self && !all.find((p) => p.telegramId === selfId)) {
    const registry = readOnline()
    const me = registry[String(selfId)]
    if (me) all.unshift(me)
  }

  const members: GuildMember[] = all
    .filter((p) => p.guildId === GUILD_ID)
    .slice(0, GUILD_MAX_MEMBERS)
    .map((p) => ({
      telegramId: p.telegramId,
      username: p.username,
      displayName: p.displayName,
      level: p.level,
      floor: p.highestFloor,
      role: p.telegramId === leaderId ? 'leader' as const : 'member' as const,
      online: Date.now() - new Date(p.lastSeen).getTime() < ONLINE_TTL_MS,
    }))

  return members
}

export function getGuildChatMessages(): GuildChatMessage[] {
  return storageGet<GuildChatMessage[]>(CHAT_KEY, []).slice(-80)
}

const GUILD_SETTINGS_KEY = 'aetherveil_guild_settings'

interface GuildSettings {
  name: string
  tag: string
  leaderId: number | null
}

const DEFAULT_GUILD_SETTINGS: GuildSettings = {
  name: 'Стражи Башни',
  tag: 'СБ',
  leaderId: null,
}

function getGuildSettings(): GuildSettings {
  return storageGet(GUILD_SETTINGS_KEY, DEFAULT_GUILD_SETTINGS)
}

export function ensureGuildLeader(telegramId: number) {
  const settings = getGuildSettings()
  if (settings.leaderId === null) {
    storageSet(GUILD_SETTINGS_KEY, { ...settings, leaderId: telegramId })
  }
}

export function isGuildLeader(telegramId: number): boolean {
  ensureGuildLeader(telegramId)
  return getGuildSettings().leaderId === telegramId
}

export function renameGuild(telegramId: number, newName: string): boolean {
  if (!isGuildLeader(telegramId)) return false
  const trimmed = newName.trim().slice(0, 30)
  if (trimmed.length < 2) return false
  const settings = getGuildSettings()
  storageSet(GUILD_SETTINGS_KEY, { ...settings, name: trimmed })
  return true
}

export function getGuildInfo() {
  const settings = getGuildSettings()
  return {
    id: GUILD_ID,
    name: settings.name,
    tag: settings.tag,
    level: 1,
    description: 'Гильдия покорителей Aetherveil. Максимум 10 участников онлайн.',
  }
}

export function sendGuildChatMessage(senderId: number, senderName: string, text: string): GuildChatMessage | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 200) return null
  const messages = getGuildChatMessages()
  const msg: GuildChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    senderId,
    senderName,
    text: trimmed,
    timestamp: new Date().toISOString(),
  }
  messages.push(msg)
  storageSet(CHAT_KEY, messages.slice(-80))
  return msg
}

/** @deprecated use getGuildInfo() */
export const GUILD_INFO = getGuildInfo()
