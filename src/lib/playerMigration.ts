import type { Player } from '@/types/game'
import { createDefaultPlayer } from '@/data/gameData'

/** Bump when migration logic changes. v13 = class-bound gear sets restored. */
export const SAVE_VERSION = 13

export function wipePlayerToFresh(player: Player): Player {
  const fresh = createDefaultPlayer(player.telegramId, player.displayName, player.username)
  return {
    ...fresh,
    referralCode: player.referralCode ?? fresh.referralCode,
    referredBy: player.referredBy,
    raceSelected: false,
    classSelected: false,
    tutorialCompleted: false,
    saveVersion: SAVE_VERSION,
  }
}

export function pickNewerPlayer(a: Player | null, b: Player | null): Player | null {
  if (!a) return b
  if (!b) return a
  const aTime = new Date(a.lastOnlineAt ?? 0).getTime()
  const bTime = new Date(b.lastOnlineAt ?? 0).getTime()
  if (aTime !== bTime) return aTime >= bTime ? a : b
  if ((a.level ?? 1) !== (b.level ?? 1)) return (a.level ?? 1) >= (b.level ?? 1) ? a : b
  if ((a.highestFloor ?? 1) !== (b.highestFloor ?? 1)) {
    return (a.highestFloor ?? 1) >= (b.highestFloor ?? 1) ? a : b
  }
  return a
}
