import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EquipmentSlotIcon } from '@/components/ui/EquipmentSlotIcon'
import { usePlayerStore } from '@/store/playerStore'
import { SOCKET_GEMS, getMaxSockets, MAX_SOCKET_GEM_LEVEL, getGemStatValue } from '@/data/socketGems'
import {
  countEmptySockets,
  formatGemSocketSummary,
  getEquippedItemsWithEmptyGemSockets,
  getItemSockets,
  getSocketableGemIdsForItem,
} from '@/lib/gemSockets'
import { formatItemStats, RARITY_LABELS_RU, SLOT_LABELS_RU } from '@/data/items'
import { hapticError, hapticSuccess } from '@/lib/telegram'
import type { Item, SocketGemId } from '@/types/game'
import type { EquipSlot } from '@/data/items'

interface EquipGemSocketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EquipGemSocketDialog({ open, onOpenChange }: EquipGemSocketDialogProps) {
  const player = usePlayerStore((s) => s.player)
  const socketGem = usePlayerStore((s) => s.socketGemIntoItem)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  useEffect(() => {
    if (!open) setSelectedItem(null)
  }, [open])

  if (!player) return null

  const equippedWithSlots = getEquippedItemsWithEmptyGemSockets(player)
  const socketableGems = selectedItem
    ? getSocketableGemIdsForItem(player, selectedItem, { studiedOnly: true })
    : []

  function handleSocket(gemId: SocketGemId) {
    if (!selectedItem?.instanceId) return
    if (socketGem(selectedItem.instanceId, gemId)) {
      hapticSuccess()
      const updated = (Object.values(usePlayerStore.getState().player?.equipped ?? {})
        .find((i) => i?.instanceId === selectedItem.instanceId) ?? null) as Item | null
      if (updated && countEmptySockets(updated) > 0) {
        setSelectedItem(updated)
      } else {
        setSelectedItem(null)
      }
    } else {
      hapticError()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💎 Вставить камень в экипировку</DialogTitle>
        </DialogHeader>

        <p className="text-[10px] text-slate-400">
          Выберите надетый предмет и изученный камень той же редкости. Снимать снаряжение не нужно.
        </p>

        {!selectedItem ? (
          <div className="space-y-2">
            {equippedWithSlots.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Нет надетых предметов со свободными слотами под камни
              </p>
            ) : (
              equippedWithSlots.map((item) => (
                <Card
                  key={item.instanceId}
                  className="cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <EquipmentSlotIcon slot={item.slot as EquipSlot} rarity={item.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500">{SLOT_LABELS_RU[item.slot as EquipSlot]}</p>
                      <p className="text-sm text-white font-medium truncate">{item.name}</p>
                      <Badge variant={item.rarity} className="text-[8px] mt-0.5">
                        {RARITY_LABELS_RU[item.rarity]}
                      </Badge>
                      <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(item)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Слоты: {formatGemSocketSummary(item)}
                        {getItemSockets(item).map((g) => (
                          <span key={g} className="ml-1">
                            {SOCKET_GEMS.find((x) => x.id === g)?.icon}
                          </span>
                        ))}
                      </p>
                    </div>
                    <Button size="sm" className="shrink-0 h-8 text-xs">Выбрать</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Card className="border-aether-cyan/40">
              <CardContent className="p-3 flex items-start gap-2">
                <EquipmentSlotIcon slot={selectedItem.slot as EquipSlot} rarity={selectedItem.rarity} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{selectedItem.name}</p>
                  <Badge variant={selectedItem.rarity} className="text-[8px] mt-0.5">
                    {RARITY_LABELS_RU[selectedItem.rarity]}
                  </Badge>
                  <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(selectedItem)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {getItemSockets(selectedItem).length}/{getMaxSockets(selectedItem.slot as EquipSlot, selectedItem.rarity)} слотов
                    · свободно {countEmptySockets(selectedItem)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedItem(null)}>
              ← Другой предмет
            </Button>

            <p className="text-xs font-medium text-white">Подходящие изученные камни</p>

            {socketableGems.length === 0 ? (
              <p className="text-sm text-amber-400 text-center py-4">
                Нет изученных камней редкости «{RARITY_LABELS_RU[selectedItem.rarity]}» для вставки
              </p>
            ) : (
              <div className="space-y-2">
                {socketableGems.map((gemId) => {
                  const gem = SOCKET_GEMS.find((g) => g.id === gemId)!
                  const level = player.socketGemLevels?.[gemId] ?? 1
                  return (
                    <Card key={gemId}>
                      <CardContent className="p-3 flex items-center gap-2">
                        <span className="text-2xl">{gem.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{gem.nameRu}</p>
                          <p className="text-[10px] text-slate-400">
                            Ур.{level}/{MAX_SOCKET_GEM_LEVEL} · +{getGemStatValue(gemId, level)} {gem.stat.toUpperCase()}
                          </p>
                        </div>
                        <Button size="sm" className="shrink-0" onClick={() => handleSocket(gemId)}>
                          Вставить
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
