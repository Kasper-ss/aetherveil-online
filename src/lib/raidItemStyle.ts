import { isRaidExclusiveItem } from '@/data/raidExclusiveGear'
import type { Item } from '@/types/game'

export function getRaidItemCardClassName(item: Item | null | undefined, base = ''): string {
  if (!item || !isRaidExclusiveItem(item)) return base
  const raid =
    'border-amber-400/70 bg-gradient-to-br from-amber-500/15 via-aether-card to-orange-600/10 glow-gold ring-1 ring-amber-400/25'
  return base ? `${base} ${raid}` : raid
}

export function getRaidItemNameClassName(item: Item): string {
  return isRaidExclusiveItem(item)
    ? 'text-amber-200 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]'
    : 'text-white'
}
