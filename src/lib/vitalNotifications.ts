import type { Player, NotificationSettings } from '@/types/game'
import { getCombatMaxHp, getMaxEnergy, getPlayerCurrentHp } from '@/lib/playerStats'
import { getMaxMana, getPlayerCurrentMana, usesMana } from '@/lib/mana'
import { showTelegramAlert } from '@/lib/telegram'
import { requestBotVitalNotify } from '@/lib/botNotifications'
import type { PetReward } from '@/lib/petRewards'

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  hpFull: true,
  energyFull: true,
  manaFull: true,
  petReward: true,
}

const MESSAGES = {
  hp: '❤️ HP полностью восстановлено!',
  energy: '⚡ Энергия полностью восстановлена!',
  mana: '🔮 Мана полностью восстановлена!',
} as const

export function getNotificationSettings(player: Player): NotificationSettings {
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...player.notificationSettings }
}

/** In-game alert only for mana; HP/energy go to Telegram bot */
export function maybeNotifyVitalFull(
  player: Player,
  kind: keyof typeof MESSAGES,
  before: number,
  after: number,
): void {
  const settings = getNotificationSettings(player)
  const enabled = kind === 'hp' ? settings.hpFull : kind === 'energy' ? settings.energyFull : settings.manaFull
  if (!enabled) return

  const max = kind === 'hp'
    ? getCombatMaxHp(player)
    : kind === 'energy'
      ? getMaxEnergy(player)
      : getMaxMana(player)

  if (before >= max || after < max) return

  if (kind === 'mana') {
    const message = MESSAGES[kind]
    showTelegramAlert(message)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Aetherveil Online', { body: message, tag: `vital_${kind}` })
      } catch {
        /* ignore */
      }
    }
  }
}

export function maybeNotifyVitalsViaBot(
  player: Player,
  beforeHp: number,
  beforeEnergy: number,
  afterHp: number,
  afterEnergy: number,
): void {
  const settings = getNotificationSettings(player)
  const maxHp = getCombatMaxHp(player)
  const maxEnergy = getMaxEnergy(player)

  const hpJustFull = settings.hpFull && beforeHp < maxHp && afterHp >= maxHp
  const energyJustFull = settings.energyFull && beforeEnergy < maxEnergy && afterEnergy >= maxEnergy

  if (!hpJustFull && !energyJustFull) return

  const kind = hpJustFull && energyJustFull ? 'both' : hpJustFull ? 'hp' : 'energy'
  void requestBotVitalNotify(player, kind)
}

export function maybeNotifyPetReward(reward: PetReward): void {
  const cyclesLabel = reward.cycles > 1 ? ` (${reward.cycles}× за оффлайн)` : ''
  const message = `${reward.petIcon} ${reward.petName} принёс дар!${cyclesLabel}`
  showTelegramAlert(message)

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Aetherveil Online', { body: message, tag: 'pet_reward' })
    } catch {
      /* ignore */
    }
  }
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function readCurrentVitals(player: Player) {
  return {
    hp: getPlayerCurrentHp(player),
    energy: player.energy,
    mana: usesMana(player) ? getPlayerCurrentMana(player) : 0,
  }
}
