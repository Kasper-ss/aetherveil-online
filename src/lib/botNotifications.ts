import type { Player } from '@/types/game'
import { getCombatMaxHp, getMaxEnergy, getPlayerCurrentHp, getAllocatedStats } from '@/lib/playerStats'
import { getInitData } from '@/lib/telegram'
import { getNotificationSettings } from '@/lib/vitalNotifications'

export interface VitalSyncPayload {
  energy: number
  maxEnergy: number
  currentHp: number
  maxHp: number
  endurance: number
  energyLastRegenAt: string
  hpLastRegenAt: string
  notifyHp: boolean
  notifyEnergy: boolean
}

export function buildVitalSyncPayload(player: Player): VitalSyncPayload {
  const settings = getNotificationSettings(player)
  return {
    energy: player.energy,
    maxEnergy: getMaxEnergy(player),
    currentHp: getPlayerCurrentHp(player),
    maxHp: getCombatMaxHp(player),
    endurance: getAllocatedStats(player).endurance,
    energyLastRegenAt: player.energyLastRegenAt ?? new Date().toISOString(),
    hpLastRegenAt: player.hpLastRegenAt ?? new Date().toISOString(),
    notifyHp: settings.hpFull !== false,
    notifyEnergy: settings.energyFull !== false,
  }
}

export async function requestBotVitalNotify(
  player: Player,
  kind: 'hp' | 'energy' | 'both',
): Promise<void> {
  const initData = getInitData()
  if (!initData) return

  try {
    await fetch('/api/telegram/notify-vital', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        kind,
        vitals: buildVitalSyncPayload(player),
      }),
    })
  } catch (err) {
    console.warn('[botNotifications] notify failed', err)
  }
}
