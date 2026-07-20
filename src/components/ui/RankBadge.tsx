import type { PlayerRankId } from '@/lib/playerRank'
import { getRankTier } from '@/lib/playerRank'

export function RankBadge({
  rank,
  size = 'sm',
  className = '',
}: {
  rank: PlayerRankId
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const tier = getRankTier(rank)
  const sizeClass = size === 'lg'
    ? 'text-sm px-2.5 py-1 min-w-[2.25rem]'
    : size === 'md'
      ? 'text-xs px-2 py-0.5 min-w-[1.75rem]'
      : 'text-[10px] px-1.5 py-0.5 min-w-[1.5rem]'

  return (
    <span
      className={`inline-flex items-center justify-center font-black rounded border shrink-0 ${sizeClass} ${tier.badgeClass} ${className}`}
      title={tier.labelRu}
    >
      {rank}
    </span>
  )
}
