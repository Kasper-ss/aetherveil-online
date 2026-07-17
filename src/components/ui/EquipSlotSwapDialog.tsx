import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EquipmentSlotIcon } from '@/components/ui/EquipmentSlotIcon'
import { formatItemStats, RARITY_LABELS_RU, SLOT_LABELS_RU } from '@/data/items'
import { formatItemClassRestriction } from '@/lib/classGear'
import { formatGemSocketSummary, getItemSockets } from '@/lib/gemSockets'
import { SOCKET_GEMS } from '@/data/socketGems'
import { RaidExclusiveBadge } from '@/components/ui/RaidExclusiveBadge'
import { isRaidExclusiveItem } from '@/data/raidExclusiveGear'
import { getRaidItemCardClassName, getRaidItemNameClassName } from '@/lib/raidItemStyle'
import type { Item, EquipSlot } from '@/types/game'

interface EquipSlotSwapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: EquipSlot | null
  equipped: Item | null
  alternatives: Item[]
  onSelect: (item: Item) => void
  onUnequip?: () => void
}

export function EquipSlotSwapDialog({
  open,
  onOpenChange,
  slot,
  equipped,
  alternatives,
  onSelect,
  onUnequip,
}: EquipSlotSwapDialogProps) {
  if (!slot) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{SLOT_LABELS_RU[slot]}</DialogTitle>
        </DialogHeader>

        {equipped && (
          <Card className={getRaidItemCardClassName(equipped, equipped && isRaidExclusiveItem(equipped) ? '' : 'border-aether-cyan/40')}>
            <CardContent className="p-3">
              <p className="text-[10px] text-slate-500 mb-1">Сейчас надето</p>
              <div className="flex items-start gap-2">
                <EquipmentSlotIcon slot={slot} rarity={equipped.rarity} size="sm" raidExclusive={isRaidExclusiveItem(equipped)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${getRaidItemNameClassName(equipped)}`}>{equipped.name}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <Badge variant={equipped.rarity} className="text-[8px]">
                      {RARITY_LABELS_RU[equipped.rarity]}
                    </Badge>
                    {isRaidExclusiveItem(equipped) && <RaidExclusiveBadge />}
                  </div>
                  {formatItemClassRestriction(equipped) && (
                    <p className="text-[10px] text-amber-400/90 mt-1">{formatItemClassRestriction(equipped)}</p>
                  )}
                  <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(equipped)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Слоты камней: {formatGemSocketSummary(equipped)}
                    {getItemSockets(equipped).map((g) => (
                      <span key={g} className="ml-1">{SOCKET_GEMS.find((x) => x.id === g)?.icon}</span>
                    ))}
                  </p>
                </div>
              </div>
              {onUnequip && (
                <Button variant="outline" size="sm" className="w-full mt-2 text-red-400" onClick={onUnequip}>
                  Снять
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-400">
          {alternatives.length > 0 ? 'Выберите предмет для замены:' : 'Нет других предметов этого типа в инвентаре'}
        </p>

        <div className="space-y-2">
          {alternatives.map((item) => (
            <Card
              key={item.instanceId}
              className={`cursor-pointer active:scale-[0.98] transition-transform ${getRaidItemCardClassName(item)}`}
              onClick={() => onSelect(item)}
            >
              <CardContent className="p-3 flex items-start gap-2">
                <EquipmentSlotIcon slot={slot} rarity={item.rarity} size="sm" raidExclusive={isRaidExclusiveItem(item)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${getRaidItemNameClassName(item)}`}>{item.name}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <Badge variant={item.rarity} className="text-[8px]">
                      {RARITY_LABELS_RU[item.rarity]}
                    </Badge>
                    {isRaidExclusiveItem(item) && <RaidExclusiveBadge />}
                  </div>
                  {formatItemClassRestriction(item) && (
                    <p className="text-[10px] text-amber-400/90 mt-1">{formatItemClassRestriction(item)}</p>
                  )}
                  <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(item)}</p>
                  <p className="text-[10px] text-slate-400">Слоты: {formatGemSocketSummary(item)}</p>
                </div>
                <Button size="sm" className="shrink-0 h-8 text-xs">Надеть</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
