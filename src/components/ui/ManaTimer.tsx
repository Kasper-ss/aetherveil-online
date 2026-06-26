import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getMaxMana, getManaRegenIntervalMs, getPlayerCurrentMana, usesMana } from '@/lib/mana'
import { formatDuration } from '@/lib/playerStats'

export function ManaTimer() {
  const player = usePlayerStore((s) => s.player)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!player || !usesMana(player)) return null
  const max = getMaxMana(player)
  const current = getPlayerCurrentMana(player)
  if (current >= max) return null

  const interval = getManaRegenIntervalMs(player)
  const last = new Date(player.manaLastRegenAt ?? now).getTime()
  const elapsed = now - last
  const untilNext = Math.max(0, interval - (elapsed % interval))
  const remaining = untilNext + (max - current - 1) * interval

  return (
    <span className="text-[9px] text-slate-500">
      🔮 {formatDuration(remaining)}
    </span>
  )
}
