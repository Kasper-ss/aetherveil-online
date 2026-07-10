import { SAVE_VERSION } from '@/lib/playerMigration'

/** Отображаемая версия клиента (синхронизирована с SAVE_VERSION миграций). */
export const GAME_VERSION = `0.${SAVE_VERSION}.0`

export const FEEDBACK_CHANNEL_URL = 'https://t.me/+P3vPLeRTwMRkN2Iy'

export function formatGameVersion(): string {
  return `v${GAME_VERSION}`
}
