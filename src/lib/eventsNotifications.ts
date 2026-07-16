import { getEventNotification } from '@shared/eventsSchedule'
import { showTelegramAlert } from '@/lib/telegram'

const STORAGE_KEY = 'aetherveil_event_notify_keys'

export function maybeNotifyGameEvent(): void {
  const note = getEventNotification()
  if (!note) return
  let sent: string[] = []
  try {
    sent = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
  } catch {
    sent = []
  }
  if (sent.includes(note.key)) return
  showTelegramAlert(note.text)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...sent, note.key].slice(-32)))
}
