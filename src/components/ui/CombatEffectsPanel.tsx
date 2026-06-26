import { useEffect, useState } from 'react'
import type { Player } from '@/types/game'
import { getActiveEffects, formatEffectRemaining } from '@/lib/activeEffects'
import { hasDeathDebuff } from '@/lib/playerStats'

interface CombatEffectChip {
  id: string
  icon: string
  label: string
  type: 'buff' | 'debuff'
  until: string
}

function effectIcon(id: string, type: 'buff' | 'debuff'): string {
  if (id === 'event_blessing') return '✨'
  if (id === 'event_curse') return '👿'
  if (id === 'potion_might') return '💪'
  if (id.startsWith('food_')) return '🍖'
  if (id === 'death_debuff') return '☠️'
  return type === 'buff' ? '⬆️' : '⬇️'
}

function buildChips(player: Player): CombatEffectChip[] {
  const chips: CombatEffectChip[] = getActiveEffects(player).map((e) => ({
    id: e.id,
    icon: effectIcon(e.id, e.type),
    label: e.label,
    type: e.type,
    until: e.until,
  }))
  if (hasDeathDebuff(player) && player.deathDebuffUntil) {
    chips.unshift({
      id: 'death_debuff',
      icon: '☠️',
      label: 'Дебафф смерти',
      type: 'debuff',
      until: player.deathDebuffUntil,
    })
  }
  return chips
}

export function CombatEffectsPanel({ player }: { player: Player }) {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const chips = buildChips(player)
  if (chips.length === 0) return null

  return (
    <div className="px-3 py-2 border-b border-aether-border bg-aether-surface/80 shrink-0">
      <p className="text-[9px] text-slate-500 mb-1.5 uppercase tracking-wide">Баффы и дебаффы</p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {chips.map((chip) => (
          <div
            key={chip.id}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] ${
              chip.type === 'buff'
                ? 'border-green-500/40 bg-green-500/10 text-green-300'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
            }`}
            title={chip.label}
          >
            <span className="text-sm leading-none">{chip.icon}</span>
            <span className="max-w-[72px] truncate">{chip.label}</span>
            <span className="text-slate-400 font-mono">{formatEffectRemaining(chip.until)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
