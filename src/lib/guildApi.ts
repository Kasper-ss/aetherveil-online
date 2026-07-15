import type { GuildChatMessage } from '@/types/game'
import { getInitData } from '@/lib/telegram'

export const CREATE_GUILD_COST = 80_000
export const CREATE_GUILD_MIN_FLOOR = 5

export interface GuildMemberRecord {
  telegramId: number
  displayName: string
  username: string
  role: 'leader' | 'officer' | 'member'
  joinedAt: string
}

export interface ServerGuild {
  id: string
  name: string
  tag: string
  leaderId: number
  members: GuildMemberRecord[]
  createdAt: string
}

export interface GuildListEntry {
  id: string
  name: string
  tag: string
  memberCount: number
  maxMembers: number
  leaderName: string
}

async function guildRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> {
  const initData = getInitData()
  if (!initData) return null
  try {
    const res = await fetch('/api/multiplayer/guild', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action, ...payload }),
    })
    const data = await res.json() as T & { error?: string }
    if (!res.ok) throw new Error(data.error ?? 'Guild API error')
    return data
  } catch (error) {
    console.warn('[guild]', error)
    return null
  }
}

export async function fetchGuildList(): Promise<{ guilds: GuildListEntry[]; myGuild: ServerGuild | null } | null> {
  return guildRequest('list')
}

export async function createGuildOnServer(name: string, highestFloor: number, gold: number) {
  return guildRequest<{ ok: boolean; guild?: ServerGuild; goldSpent?: number; error?: string }>('create', { name, highestFloor, gold })
}

export async function joinGuildOnServer(guildId: string) {
  return guildRequest<{ ok: boolean; guild?: ServerGuild; error?: string }>('join', { guildId })
}

export async function leaveGuildOnServer() {
  return guildRequest<{ ok: boolean }>('leave')
}

export async function fetchMyGuild() {
  return guildRequest<{ ok: boolean; guild: ServerGuild | null }>('my')
}

export async function sendGuildChatOnServer(text: string) {
  return guildRequest<{ ok: boolean; message?: GuildChatMessage }>('chat_send', { text })
}

export async function pollGuildChat(after?: string) {
  return guildRequest<{ ok: boolean; messages: GuildChatMessage[]; guildId?: string }>('chat_poll', { after })
}

export async function checkSameGuild(toId: number) {
  const data = await guildRequest<{ ok: boolean; same: boolean }>('same_guild', { guildId: toId })
  return data?.same ?? false
}
