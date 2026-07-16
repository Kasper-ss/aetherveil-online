import type { Player, Stats, GuildMember, GuildChatMessage, QuestEvent } from '@/types/game'
import { getEffectiveStats, getCombatMaxHp } from '@/lib/playerStats'
import { storageGet, storageSet } from '@/lib/utils'
import { GUILD_QUESTS } from '@/data/quests'
import { weekKey } from '@/lib/quests'

export const GUILD_MAX_MEMBERS = 10
export const GUILD_ID = 'guild_tower_1'
const ONLINE_KEY = 'aetherveil_online'
const CHAT_KEY = 'aetherveil_guild_chat'
const ROSTER_KEY = 'aetherveil_guild_roster'
const INVITES_KEY = 'aetherveil_guild_invites'
const GUILD_QUEST_KEY = 'aetherveil_guild_quest_progress'
const GUILD_QUEST_WEEK_KEY = 'aetherveil_guild_quest_week'
const ONLINE_TTL_MS = 90_000

export interface GuildRosterEntry {
  telegramId: number
  displayName: string
  username: string
  role: 'leader' | 'officer' | 'member'
  joinedAt: string
}

export interface GuildInvite {
  guildId: string
  guildName: string
  fromId: number
  fromName: string
  createdAt: string
}

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
  const stats = getEffectiveStats(player)
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
    guildId: player.guildId ?? '',
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

/** PvP arena matchmaking — dormant while FEATURES.pvpArena is false */
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

export function getGuildRoster(): GuildRosterEntry[] {
  return storageGet<GuildRosterEntry[]>(ROSTER_KEY, [])
}

function saveGuildRoster(roster: GuildRosterEntry[]) {
  storageSet(ROSTER_KEY, roster.slice(0, GUILD_MAX_MEMBERS))
}

function ensureRosterLeader(telegramId: number, displayName: string, username: string) {
  const roster = getGuildRoster()
  if (roster.length === 0) {
    saveGuildRoster([{
      telegramId,
      displayName,
      username,
      role: 'leader',
      joinedAt: new Date().toISOString(),
    }])
    return
  }
  if (!roster.some((m) => m.telegramId === telegramId)) {
    const settings = getGuildSettings()
    if (settings.leaderId === telegramId && roster.length < GUILD_MAX_MEMBERS) {
      saveGuildRoster([...roster, {
        telegramId,
        displayName,
        username,
        role: 'leader',
        joinedAt: new Date().toISOString(),
      }])
    }
  }
}

export function isInGuildRoster(telegramId: number): boolean {
  return getGuildRoster().some((m) => m.telegramId === telegramId)
}

export function inviteToGuildById(
  inviterId: number,
  targetId: number,
  inviterName: string,
): boolean {
  if (!isGuildLeader(inviterId)) return false
  const id = Math.floor(targetId)
  if (!id || id === inviterId) return false
  const roster = getGuildRoster()
  if (roster.length >= GUILD_MAX_MEMBERS) return false
  if (roster.some((m) => m.telegramId === id)) return false

  const invites = storageGet<Record<string, GuildInvite[]>>(INVITES_KEY, {})
  const key = String(id)
  const list = invites[key] ?? []
  if (list.some((i) => i.guildId === GUILD_ID)) return false
  const guild = getGuildInfo()
  list.push({
    guildId: GUILD_ID,
    guildName: guild.name,
    fromId: inviterId,
    fromName: inviterName,
    createdAt: new Date().toISOString(),
  })
  invites[key] = list
  storageSet(INVITES_KEY, invites)
  return true
}

export function getGuildInvitesFor(targetId: number): GuildInvite[] {
  const invites = storageGet<Record<string, GuildInvite[]>>(INVITES_KEY, {})
  return invites[String(targetId)] ?? []
}

export function declineGuildInvite(targetId: number, guildId: string): void {
  const invites = storageGet<Record<string, GuildInvite[]>>(INVITES_KEY, {})
  const key = String(targetId)
  invites[key] = (invites[key] ?? []).filter((i) => i.guildId !== guildId)
  storageSet(INVITES_KEY, invites)
}

export function acceptGuildInvite(
  targetId: number,
  displayName: string,
  username: string,
  guildId: string,
): boolean {
  const invites = getGuildInvitesFor(targetId)
  const invite = invites.find((i) => i.guildId === guildId)
  if (!invite) return false
  const roster = getGuildRoster()
  if (roster.length >= GUILD_MAX_MEMBERS) return false
  if (roster.some((m) => m.telegramId === targetId)) return false

  saveGuildRoster([...roster, {
    telegramId: targetId,
    displayName,
    username,
    role: 'member',
    joinedAt: new Date().toISOString(),
  }])
  declineGuildInvite(targetId, guildId)
  return true
}

function ensureGuildQuestWeek(): void {
  const wk = weekKey()
  const stored = storageGet<string>(GUILD_QUEST_WEEK_KEY, '')
  if (stored === wk) return
  storageSet(GUILD_QUEST_KEY, {})
  storageSet(GUILD_QUEST_WEEK_KEY, wk)
}

export function addGuildQuestProgress(event: QuestEvent, amount = 1): void {
  ensureGuildQuestWeek()
  const progress = storageGet<Record<string, number>>(GUILD_QUEST_KEY, {})
  for (const q of GUILD_QUESTS) {
    if (q.event === event) {
      progress[q.id] = (progress[q.id] ?? 0) + amount
    }
  }
  storageSet(GUILD_QUEST_KEY, progress)
}

export function getGuildQuestProgress(): Record<string, number> {
  ensureGuildQuestWeek()
  return storageGet<Record<string, number>>(GUILD_QUEST_KEY, {})
}

export function getGuildMembers(selfId: number, selfName?: string, selfUsername?: string): GuildMember[] {
  ensureGuildLeader(selfId)
  if (selfName) ensureRosterLeader(selfId, selfName, selfUsername ?? `user_${selfId}`)

  const leaderId = getGuildSettings().leaderId
  const roster = getGuildRoster()
  const online = getOnlinePlayers()
  const onlineMap = new Map(online.map((p) => [p.telegramId, p]))
  const now = Date.now()

  const memberIds = new Set<number>()
  const members: GuildMember[] = []

  for (const entry of roster) {
    memberIds.add(entry.telegramId)
    const live = onlineMap.get(entry.telegramId)
    members.push({
      telegramId: entry.telegramId,
      username: live?.username ?? entry.username,
      displayName: live?.displayName ?? entry.displayName,
      level: live?.level ?? 1,
      floor: live?.highestFloor ?? 1,
      role: entry.telegramId === leaderId ? 'leader' : entry.role,
      online: live ? now - new Date(live.lastSeen).getTime() < ONLINE_TTL_MS : false,
    })
  }

  for (const p of online) {
    if (p.guildId !== GUILD_ID || memberIds.has(p.telegramId)) continue
    if (members.length >= GUILD_MAX_MEMBERS) break
    members.push({
      telegramId: p.telegramId,
      username: p.username,
      displayName: p.displayName,
      level: p.level,
      floor: p.highestFloor,
      role: p.telegramId === leaderId ? 'leader' : 'member',
      online: now - new Date(p.lastSeen).getTime() < ONLINE_TTL_MS,
    })
  }

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
