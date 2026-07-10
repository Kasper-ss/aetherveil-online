import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { SOCKET_GEMS, getMaxSockets, MAX_SOCKET_GEM_LEVEL } from '@/data/socketGems'
import { jewelResourceId } from '@/lib/jewelResources'
import { getItemSockets, countEmptySockets } from '@/lib/gemSockets'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { Item, SocketGemId } from '@/types/game'
import type { EquipSlot } from '@/data/items'

interface GemWorkshopPanelProps {
  selectedItem: Item | null
  onSelectItem: (item: Item | null) => void
  gear: Item[]
}

export function GemWorkshopPanel({ selectedItem, onSelectItem, gear }: GemWorkshopPanelProps) {
  const player = usePlayerStore((s) => s.player)
  const combineGem = usePlayerStore((s) => s.combineSocketGem)
  const upgradeGem = usePlayerStore((s) => s.upgradeSocketGem)
  const socketGem = usePlayerStore((s) => s.socketGemIntoItem)

  if (!player) return null

  const gems = player.resources ?? {}

  function jewelCount(gemId: SocketGemId): number {
    return gems[jewelResourceId(gemId)] ?? 0
  }

  function handleCombine(gemId: SocketGemId) {
    if (combineGem(gemId)) hapticSuccess()
    else hapticError()
  }

  function handleUpgrade(gemId: SocketGemId) {
    if (upgradeGem(gemId)) hapticSuccess()
    else hapticError()
  }

  function handleSocket(gemId: SocketGemId) {
    if (!selectedItem?.instanceId) return
    if (socketGem(selectedItem.instanceId, gemId)) {
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-slate-400">
        Ювелирное дело: комбинируйте и улучшайте 10 видов камней. Кузнечное дело: вставляйте в снаряжение.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-medium text-white">Ваши камни</p>
        {SOCKET_GEMS.map((gem) => {
          const count = jewelCount(gem.id)
          const level = player.socketGemLevels?.[gem.id] ?? 1
          return (
            <Card key={gem.id}>
              <CardContent className="p-3 flex items-center gap-2">
                <span className="text-2xl">{gem.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{gem.nameRu}</div>
                  <div className="text-[10px] text-slate-400">
                    Ур.{level}/{MAX_SOCKET_GEM_LEVEL} · ×{count} · +{gem.stat.toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleCombine(gem.id)}>
                    Создать
                  </Button>
                  <Button size="sm" variant="secondary" className="text-[10px] h-7" disabled={level >= MAX_SOCKET_GEM_LEVEL} onClick={() => handleUpgrade(gem.id)}>
                    Улучшить
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-white">Вставка в снаряжение</p>
        <div className="flex flex-wrap gap-1">
          {gear.slice(0, 12).map((item) => (
            <Button
              key={item.instanceId}
              size="sm"
              variant={selectedItem?.instanceId === item.instanceId ? 'default' : 'outline'}
              className="text-[10px]"
              onClick={() => onSelectItem(item)}
            >
              {item.icon} {getMaxSockets(item.slot as EquipSlot, item.rarity)} сл.
            </Button>
          ))}
        </div>
        {selectedItem && (
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-sm text-white">{selectedItem.name}</div>
              <div className="text-[10px] text-slate-400">
                Слоты: {getItemSockets(selectedItem).length}/{getMaxSockets(selectedItem.slot as EquipSlot, selectedItem.rarity)}
                {countEmptySockets(selectedItem) > 0 && ` · свободно ${countEmptySockets(selectedItem)}`}
              </div>
              <div className="flex flex-wrap gap-1">
                {getItemSockets(selectedItem).map((g) => (
                  <Badge key={g} className="text-[9px]">{SOCKET_GEMS.find((x) => x.id === g)?.icon}</Badge>
                ))}
              </div>
              {countEmptySockets(selectedItem) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {SOCKET_GEMS.filter((g) => jewelCount(g.id) > 0).map((g) => (
                    <Button key={g.id} size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleSocket(g.id)}>
                      {g.icon} вставить
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
