import { getWorldBossNotification } from '@/lib/worldBossSchedule'
import { showTelegramAlert } from '@/lib/telegram'

const STORAGE_KEY = 'aetherveil_wb_notify_keys'

export function maybeNotifyWorldBoss(): void {
  const note = getWorldBossNotification()
  if (!note) return
  let sent: string[] = []
  try {
    sent = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
  } catch {
    sent = []
  }
  if (sent.includes(note.key)) return
  showTelegramAlert(note.text)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...sent, note.key].slice(-24)))
}
