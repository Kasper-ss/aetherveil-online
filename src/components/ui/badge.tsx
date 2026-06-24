import { cn } from '@/lib/utils'
import type { ItemRarity } from '@/types/game'

const rarityColors: Record<ItemRarity, string> = {
  common: 'bg-slate-600 text-slate-200',
  rare: 'bg-blue-700 text-blue-100',
  epic: 'bg-purple-700 text-purple-100',
  legendary: 'bg-amber-600 text-amber-100',
  mythic: 'bg-gradient-to-r from-fuchsia-700 to-cyan-700 text-white',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | ItemRarity
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        variant === 'default' ? 'bg-aether-border text-slate-300' : rarityColors[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
