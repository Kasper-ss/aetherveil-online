import type { LeaderboardEntry, Player } from '@/types/game'
import { getOnlinePlayers } from '@/lib/multiplayer'
import { storageGet, storageSet } from '@/lib/utils'

const MOCK_EPOCH_KEY = 'aetherveil_lb_epoch'

interface MockNpc {
  telegramId: number
  displayName: string
  username: string
  startFloor: number
  startLevel: number
  floorGrowthPerDay: number
  levelGrowthPerDay: number
  isFriend?: boolean
}

const MOCK_NPCS: MockNpc[] = [
  { telegramId: -101, displayName: 'Кирито', username: 'kirito_sao', startFloor: 3, startLevel: 14, floorGrowthPerDay: 0.12, levelGrowthPerDay: 0.9 },
  { telegramId: -102, displayName: 'Асуна', username: 'asuna_yuuki', startFloor: 3, startLevel: 13, floorGrowthPerDay: 0.11, levelGrowthPerDay: 0.85, isFriend: true },
  { telegramId: -103, displayName: 'Кляйн', username: 'klein_samurai', startFloor: 2, startLevel: 10, floorGrowthPerDay: 0.14, levelGrowthPerDay: 1.0 },
  { telegramId: -104, displayName: 'Юйки', username: 'yui_ai', startFloor: 2, startLevel: 9, floorGrowthPerDay: 0.1, levelGrowthPerDay: 0.75, isFriend: true },
  { telegramId: -105, displayName: 'Эгил', username: 'egil_crafter', startFloor: 4, startLevel: 16, floorGrowthPerDay: 0.09, levelGrowthPerDay: 0.7 },
  { telegramId: -106, displayName: 'Синон', username: 'sinon_snipe', startFloor: 2, startLevel: 11, floorGrowthPerDay: 0.13, levelGrowthPerDay: 0.95 },
  { telegramId: -107, displayName: 'Лизбет', username: 'lisbeth_smith', startFloor: 1, startLevel: 7, floorGrowthPerDay: 0.16, levelGrowthPerDay: 1.1, isFriend: true },
  { telegramId: -108, displayName: 'Агил', username: 'agil_merchant', startFloor: 2, startLevel: 12, floorGrowthPerDay: 0.12, levelGrowthPerDay: 0.8 },
]

function getEpochMs(): number {
  const stored = storageGet<number | null>(MOCK_EPOCH_KEY, null)
  if (stored) return stored
  const now = Date.now()
  storageSet(MOCK_EPOCH_KEY, now)
  return now
}

function getMockEntries(): Omit<LeaderboardEntry, 'rank'>[] {
  const days = (Date.now() - getEpochMs()) / 86_400_000

  return MOCK_NPCS.map((npc) => ({
    telegramId: npc.telegramId,
    displayName: npc.displayName,
    username: npc.username,
    floor: Math.min(5, Math.max(1, Math.floor(npc.startFloor + days * npc.floorGrowthPerDay))),
    level: Math.min(60, Math.max(1, Math.floor(npc.startLevel + days * npc.levelGrowthPerDay))),
    isFriend: npc.isFriend,
  }))
}

function sortEntries(entries: Omit<LeaderboardEntry, 'rank'>[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.floor - a.floor || b.level - a.level || a.displayName.localeCompare(b.displayName, 'ru'))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

export function getLeaderboardEntries(self: Player, friendsOnly = false): LeaderboardEntry[] {
  const merged = new Map<number, Omit<LeaderboardEntry, 'rank'>>()

  for (const mock of getMockEntries()) {
    merged.set(mock.telegramId, mock)
  }

  for (const online of getOnlinePlayers()) {
    merged.set(online.telegramId, {
      telegramId: online.telegramId,
      username: online.username,
      displayName: online.displayName,
      floor: online.highestFloor,
      level: online.level,
      isFriend: merged.get(online.telegramId)?.isFriend,
    })
  }

  merged.set(self.telegramId, {
    telegramId: self.telegramId,
    username: self.username,
    displayName: self.displayName,
    floor: self.highestFloor,
    level: self.level,
    isFriend: merged.get(self.telegramId)?.isFriend,
  })

  let entries = Array.from(merged.values())
  if (friendsOnly) {
    entries = entries.filter((e) => e.isFriend || e.telegramId === self.telegramId)
  }

  return sortEntries(entries)
}
