import { Badge } from '@/components/ui/badge'
import { formatItemStats, RARITY_LABELS_RU } from '@/data/items'
import { formatDurability, getDurabilityRatio, needsRepair } from '@/lib/equipmentDurability'
import { formatItemClassRestriction } from '@/lib/classGear'
import { isRaidExclusiveItem } from '@/data/raidExclusiveGear'
import { RaidExclusiveBadge } from '@/components/ui/RaidExclusiveBadge'
import type { Item } from '@/types/game'

interface ItemSummaryProps {
  item: Item
  showUpgrade?: boolean
}

export function ItemSummary({ item, showUpgrade = true }: ItemSummaryProps) {
  const lvl = item.upgradeLevel ?? 1
  const stars = item.starLevel ?? 0
  const hasUpgrade = showUpgrade && (lvl > 1 || stars > 0)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant={item.rarity} className="text-[8px]">{RARITY_LABELS_RU[item.rarity]}</Badge>
        {isRaidExclusiveItem(item) && <RaidExclusiveBadge />}
        {hasUpgrade && (
          <span className="text-[9px] text-aether-cyan">Ур.{lvl} · ★{stars}</span>
        )}
      </div>
      {formatItemClassRestriction(item) && (
        <p className="text-[9px] text-amber-400/90 mt-0.5">{formatItemClassRestriction(item)}</p>
      )}
      {Object.keys(item.stats ?? {}).length > 0 && (
        <p className="text-[9px] text-aether-cyan mt-0.5 leading-tight">{formatItemStats(item)}</p>
      )}
      {item.slot !== 'consumable' && (
        <p className={`text-[9px] mt-0.5 ${needsRepair(item) ? 'text-amber-500' : 'text-slate-500'}`}>
          Прочность {formatDurability(item)} ({Math.round(getDurabilityRatio(item) * 100)}%)
        </p>
      )}
    </div>
  )
}
