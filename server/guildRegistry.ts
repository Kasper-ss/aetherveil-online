export const GUILD_MAX_MEMBERS = 10
export const CREATE_GUILD_COST = 80_000
export const CREATE_GUILD_MIN_FLOOR = 5

export interface GuildMemberRecord {
  telegramId: number
  displayName: string
  username: string
  role: 'leader' | 'officer' | 'member'
  joinedAt: string
}

export interface GuildRecord {
  id: string
  name: string
  tag: string
  leaderId: number
  members: GuildMemberRecord[]
  createdAt: string
}

export interface GuildChatRecord {
  id: string
  guildId: string
  senderId: number
  senderName: string
  text: string
  timestamp: string
}

export interface GuildSummary {
  id: string
  name: string
  tag: string
  memberCount: number
  maxMembers: number
  leaderName: string
}

interface GuildStore {
  guilds: Map<string, GuildRecord>
  chat: Map<string, GuildChatRecord[]>
  memberIndex: Map<number, string>
}

const globalStore = globalThis as typeof globalThis & {
  __aetherveilGuildStore?: GuildStore
}

function store(): GuildStore {
  if (!globalStore.__aetherveilGuildStore) {
    globalStore.__aetherveilGuildStore = {
      guilds: new Map(),
      chat: new Map(),
      memberIndex: new Map(),
    }
  }
  return globalStore.__aetherveilGuildStore
}

function makeTag(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase() || 'Г'
}

function guildId(): string {
  return `guild_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function listGuilds(): GuildSummary[] {
  const s = store()
  return [...s.guilds.values()].map((g) => ({
    id: g.id,
    name: g.name,
    tag: g.tag,
    memberCount: g.members.length,
    maxMembers: GUILD_MAX_MEMBERS,
    leaderName: g.members.find((m) => m.telegramId === g.leaderId)?.displayName ?? 'Лидер',
  }))
}

export function getGuildById(guildId: string): GuildRecord | null {
  return store().guilds.get(guildId) ?? null
}

export function getGuildForMember(telegramId: number): GuildRecord | null {
  const id = store().memberIndex.get(telegramId)
  if (!id) return null
  return store().guilds.get(id) ?? null
}

export function createGuild(input: {
  telegramId: number
  displayName: string
  username: string
  name: string
}): { ok: true; guild: GuildRecord } | { ok: false; error: string } {
  const trimmed = input.name.trim().slice(0, 30)
  if (trimmed.length < 2) return { ok: false, error: 'Название слишком короткое' }

  const s = store()
  if (s.memberIndex.has(input.telegramId)) {
    return { ok: false, error: 'Вы уже состоите в гильдии' }
  }

  const id = guildId()
  const now = new Date().toISOString()
  const guild: GuildRecord = {
    id,
    name: trimmed,
    tag: makeTag(trimmed),
    leaderId: input.telegramId,
    members: [{
      telegramId: input.telegramId,
      displayName: input.displayName,
      username: input.username,
      role: 'leader',
      joinedAt: now,
    }],
    createdAt: now,
  }
  s.guilds.set(id, guild)
  s.memberIndex.set(input.telegramId, id)
  s.chat.set(id, [])
  return { ok: true, guild }
}

export function joinGuild(input: {
  telegramId: number
  displayName: string
  username: string
  guildId: string
}): { ok: true; guild: GuildRecord } | { ok: false; error: string } {
  const s = store()
  if (s.memberIndex.has(input.telegramId)) {
    return { ok: false, error: 'Вы уже в гильдии' }
  }
  const guild = s.guilds.get(input.guildId)
  if (!guild) return { ok: false, error: 'Гильдия не найдена' }
  if (guild.members.length >= GUILD_MAX_MEMBERS) {
    return { ok: false, error: 'Гильдия заполнена' }
  }
  guild.members.push({
    telegramId: input.telegramId,
    displayName: input.displayName,
    username: input.username,
    role: 'member',
    joinedAt: new Date().toISOString(),
  })
  s.memberIndex.set(input.telegramId, guild.id)
  return { ok: true, guild }
}

export function leaveGuild(telegramId: number): boolean {
  const s = store()
  const guildId = s.memberIndex.get(telegramId)
  if (!guildId) return false
  const guild = s.guilds.get(guildId)
  if (!guild) {
    s.memberIndex.delete(telegramId)
    return true
  }
  guild.members = guild.members.filter((m) => m.telegramId !== telegramId)
  s.memberIndex.delete(telegramId)
  if (guild.leaderId === telegramId) {
    if (guild.members.length === 0) {
      s.guilds.delete(guildId)
      s.chat.delete(guildId)
    } else {
      guild.leaderId = guild.members[0].telegramId
      guild.members[0].role = 'leader'
    }
  }
  return true
}

export function areSameGuild(a: number, b: number): boolean {
  const s = store()
  const ga = s.memberIndex.get(a)
  const gb = s.memberIndex.get(b)
  return !!ga && ga === gb
}

export function sendGuildChat(input: {
  guildId: string
  senderId: number
  senderName: string
  text: string
}): GuildChatRecord | null {
  const trimmed = input.text.trim()
  if (!trimmed || trimmed.length > 200) return null
  const guild = store().guilds.get(input.guildId)
  if (!guild) return null
  if (!guild.members.some((m) => m.telegramId === input.senderId)) return null

  const msg: GuildChatRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    guildId: input.guildId,
    senderId: input.senderId,
    senderName: input.senderName,
    text: trimmed,
    timestamp: new Date().toISOString(),
  }
  const list = store().chat.get(input.guildId) ?? []
  list.push(msg)
  store().chat.set(input.guildId, list.slice(-120))
  return msg
}

export function getGuildChat(guildId: string, after?: string): GuildChatRecord[] {
  const list = store().chat.get(guildId) ?? []
  if (!after) return list.slice(-80)
  const idx = list.findIndex((m) => m.id === after)
  if (idx < 0) return list.slice(-80)
  return list.slice(idx + 1)
}
