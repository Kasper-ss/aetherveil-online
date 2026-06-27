import type { Player } from '@/types/game'

/** Bump when migration logic changes — never wipe player data on version mismatch */
export const SAVE_VERSION = 4

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
