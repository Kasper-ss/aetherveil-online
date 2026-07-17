interface RaidExclusiveBadgeProps {
  className?: string
}

export function RaidExclusiveBadge({ className = '' }: RaidExclusiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[8px] font-semibold px-1.5 py-0.5 rounded-md border border-amber-400/80 bg-gradient-to-r from-amber-500/30 to-orange-500/20 text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.35)] ${className}`}
    >
      🏰 Рейдовый
    </span>
  )
}
