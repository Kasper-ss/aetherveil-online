import { cn, formatNumber } from '@/lib/utils'
import { Heart, Zap, Shield, Swords } from 'lucide-react'

interface StatBarProps {
  label: string
  value: number
  max?: number
  icon?: React.ReactNode
  color?: string
  className?: string
}

export function StatBar({ label, value, max, icon, color, className }: StatBarProps) {
  const pct = max ? (value / max) * 100 : 100
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-400">
          {icon}
          {label}
        </span>
        <span className="font-mono text-white">
          {formatNumber(value)}{max ? `/${formatNumber(max)}` : ''}
        </span>
      </div>
      {max && (
        <div className="h-2 rounded-full bg-aether-bg overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', color ?? 'bg-aether-cyan')}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface PlayerStatsPanelProps {
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  atk: number
  def: number
  compact?: boolean
}

export function PlayerStatsPanel({
  hp, maxHp, energy, maxEnergy, atk, def, compact,
}: PlayerStatsPanelProps) {
  if (compact) {
    return (
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1 text-red-400">
          <Heart className="h-3 w-3" /> {hp}/{maxHp}
        </span>
        <span className="flex items-center gap-1 text-yellow-400">
          <Zap className="h-3 w-3" /> {energy}/{maxEnergy}
        </span>
        <span className="flex items-center gap-1 text-orange-400">
          <Swords className="h-3 w-3" /> {atk}
        </span>
        <span className="flex items-center gap-1 text-blue-400">
          <Shield className="h-3 w-3" /> {def}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <StatBar label="HP" value={hp} max={maxHp} icon={<Heart className="h-3 w-3 text-red-400" />} color="bg-red-500" />
      <StatBar label="Energy" value={energy} max={maxEnergy} icon={<Zap className="h-3 w-3 text-yellow-400" />} color="bg-yellow-500" />
      <div className="flex gap-4 pt-1">
        <span className="flex items-center gap-1 text-sm text-orange-400">
          <Swords className="h-4 w-4" /> ATK {atk}
        </span>
        <span className="flex items-center gap-1 text-sm text-blue-400">
          <Shield className="h-4 w-4" /> DEF {def}
        </span>
      </div>
    </div>
  )
}
