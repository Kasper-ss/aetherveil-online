import type { Player } from '@/types/game'
import { storageGet, storageSet } from '@/lib/utils'
import { savePlayerToSupabase } from '@/lib/supabase'

const LEGACY_SAVE_KEY = 'player'

export function playerSaveKey(telegramId: number): string {
  return `player_${telegramId}`
}

export function loadLocalPlayer(telegramId: number): Player | null {
  const scoped = storageGet<Player | null>(playerSaveKey(telegramId), null)
  if (scoped?.telegramId === telegramId) return scoped

  const legacy = storageGet<Player | null>(LEGACY_SAVE_KEY, null)
  if (legacy?.telegramId === telegramId) {
    storageSet(playerSaveKey(telegramId), legacy)
    return legacy
  }
  return null
}

export function persistPlayerLocal(player: Player): void {
  storageSet(playerSaveKey(player.telegramId), player)
  storageSet(LEGACY_SAVE_KEY, player)
}

let saveChain: Promise<void> = Promise.resolve()

export function enqueuePlayerSave(getPlayer: () => Player | null): void {
  saveChain = saveChain
    .then(async () => {
      const player = getPlayer()
      if (!player) return
      const snapshot: Player = { ...player, lastOnlineAt: new Date().toISOString() }
      persistPlayerLocal(snapshot)
      await savePlayerToSupabase(snapshot)
    })
    .catch((error) => {
      console.error('[Aetherveil] save failed', error)
    })
}
