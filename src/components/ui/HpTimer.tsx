import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getCombatMaxHp, getHpRegenIntervalMs, getPlayerCurrentHp, formatDuration } from '@/lib/playerStats'

export function HpTimer() {
  const player = usePlayerStore((s) => s.player)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!player) return null
  const max = getCombatMaxHp(player)
  const current = getPlayerCurrentHp(player)
  if (current >= max) return null

  const interval = getHpRegenIntervalMs(player)
  const last = new Date(player.hpLastRegenAt ?? now).getTime()
  const elapsed = now - last
  const untilNext = Math.max(0, interval - (elapsed % interval))
  const remaining = untilNext + (max - current - 1) * interval

  return (
    <span className="text-[9px] text-slate-500">
      ❤️ {formatDuration(remaining)}
    </span>
  )
}
