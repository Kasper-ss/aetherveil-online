import { useEffect, useState } from 'react'

const LOCK_KEY = 'aetherveil_session_lock'
const CHANNEL = 'aetherveil_session'
const STALE_MS = 4000

function readLock(): { id: string; ts: number } | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { id: string; ts: number }
  } catch {
    return null
  }
}

function createSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // ignore
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function useSessionLock(): boolean {
  const [blocked, setBlocked] = useState(false)
  const sessionId = useState(() => createSessionId())[0]

  useEffect(() => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

    function refreshLock() {
      const existing = readLock()
      if (existing && existing.id !== sessionId && Date.now() - existing.ts < STALE_MS) {
        setBlocked(true)
        return
      }
      setBlocked(false)
      localStorage.setItem(LOCK_KEY, JSON.stringify({ id: sessionId, ts: Date.now() }))
    }

    refreshLock()
    const heartbeat = window.setInterval(refreshLock, 1500)

    channel?.addEventListener('message', () => refreshLock())
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCK_KEY) refreshLock()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(heartbeat)
      window.removeEventListener('storage', onStorage)
      channel?.close()
      const existing = readLock()
      if (existing?.id === sessionId) localStorage.removeItem(LOCK_KEY)
    }
  }, [sessionId])

  return blocked
}
