import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { getMaxEnergy, getEnergyRegenIntervalMs, formatDuration } from '@/lib/playerStats'

export function EnergyTimer() {
  const player = usePlayerStore((s) => s.player)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!player) return null
  const max = getMaxEnergy(player)
  if (player.energy >= max) return null

  const interval = getEnergyRegenIntervalMs(player)
  const last = new Date(player.energyLastRegenAt ?? now).getTime()
  const elapsed = now - last
  const untilNext = Math.max(0, interval - (elapsed % interval))
  const remaining = player.energy < max
    ? untilNext + (max - player.energy - 1) * interval
    : 0

  return (
    <span className="text-[9px] text-slate-500">
      ⏱ {formatDuration(remaining)}
    </span>
  )
}
