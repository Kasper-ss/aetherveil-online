import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { SOCKET_GEMS, getMaxSockets, MAX_SOCKET_GEM_LEVEL, getGemStatValue } from '@/data/socketGems'
import { jewelResourceId } from '@/lib/jewelResources'
import { getItemSockets, countEmptySockets, canSocketGem } from '@/lib/gemSockets'
import { canWorkWithGem, isGemStudied, isGemStudying, getGemStudyRemainingMs, formatGemStudyCountdown } from '@/lib/gemStudy'
import {
  formatGemCraftCost,
  getCombineBlockReason,
  getGemCombineCost,
  getGemUpgradeCost,
  getGemUpgradeSuccessChance,
  getJewelerRank,
  getRequiredJewelerRankForCombine,
  getRequiredJewelerRankForUpgrade,
  getUpgradeBlockReason,
} from '@/lib/gemCrafting'
import { RARITY_LABELS_RU } from '@/data/items'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { Item, SocketGemId } from '@/types/game'
import type { EquipSlot } from '@/data/items'

interface GemWorkshopPanelProps {
  selectedItem: Item | null
  onSelectItem: (item: Item | null) => void
  gear: Item[]
  onNotice?: (message: string) => void
}

export function GemWorkshopPanel({ selectedItem, onSelectItem, gear, onNotice }: GemWorkshopPanelProps) {
  const player = usePlayerStore((s) => s.player)
  const combineGem = usePlayerStore((s) => s.combineSocketGem)
  const upgradeGem = usePlayerStore((s) => s.upgradeSocketGem)
  const socketGem = usePlayerStore((s) => s.socketGemIntoItem)

  if (!player) return null

  const p = player
  const gems = p.resources ?? {}
  const jewelerRank = getJewelerRank(player)

  function jewelCount(gemId: SocketGemId): number {
    return gems[jewelResourceId(gemId)] ?? 0
  }

  function handleCombine(gemId: SocketGemId) {
    const reason = getCombineBlockReason(p, gemId)
    if (reason) {
      onNotice?.(reason)
      hapticError()
      return
    }
    if (combineGem(gemId)) {
      hapticSuccess()
      onNotice?.(`Создан: ${SOCKET_GEMS.find((g) => g.id === gemId)?.nameRu}`)
    } else {
      hapticError()
    }
  }

  function handleUpgrade(gemId: SocketGemId) {
    const reason = getUpgradeBlockReason(p, gemId)
    if (reason) {
      onNotice?.(reason)
      hapticError()
      return
    }
    const level = p.socketGemLevels?.[gemId] ?? 1
    const chance = Math.round(getGemUpgradeSuccessChance(gemId, level, jewelerRank) * 100)
    if (upgradeGem(gemId)) {
      hapticSuccess()
      onNotice?.(`Улучшено до ур.${level + 1}!`)
    } else {
      hapticError()
      onNotice?.(`Огранка не удалась (${chance}% шанс) — ресурсы потрачены`)
    }
  }

  function handleSocket(gemId: SocketGemId) {
    if (!selectedItem?.instanceId) return
    if (socketGem(selectedItem.instanceId, gemId)) {
      hapticSuccess()
      onNotice?.('Камень вставлен')
    } else {
      hapticError()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-slate-400">
        Сначала изучите камень (вкладка «Изучение»). Создание и улучшение требуют ранг ювелира,
        больше ресурсов и золота; улучшение может провалиться — ресурсы при этом тратятся.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-medium text-white">Ваши камни</p>
        {SOCKET_GEMS.map((gem) => {
          const count = jewelCount(gem.id)
          const gemLevel = p.socketGemLevels?.[gem.id] ?? 0
          const craftLevel = gemLevel > 0 ? gemLevel : 1
          const displayLevel = gemLevel > 0 ? gemLevel : 1
          const studied = isGemStudied(p, gem.id)
          const studying = isGemStudying(p, gem.id)
          const canWork = canWorkWithGem(p, gem.id)
          const studyLeft = getGemStudyRemainingMs(p, gem.id)
          const combineCost = getGemCombineCost(gem.id, craftLevel)
          const upgradeCost = gemLevel > 0 && gemLevel < MAX_SOCKET_GEM_LEVEL ? getGemUpgradeCost(gem.id, gemLevel) : null
          const upgradeChance = gemLevel > 0 && gemLevel < MAX_SOCKET_GEM_LEVEL
            ? Math.round(getGemUpgradeSuccessChance(gem.id, gemLevel, jewelerRank) * 100)
            : null
          const combineRank = getRequiredJewelerRankForCombine(gem.id, craftLevel)
          const upgradeRank = gemLevel > 0 && gemLevel < MAX_SOCKET_GEM_LEVEL ? getRequiredJewelerRankForUpgrade(gemLevel) : null
          const combineBlock = getCombineBlockReason(p, gem.id)
          const upgradeBlock = getUpgradeBlockReason(p, gem.id)

          return (
            <Card key={gem.id} className={studied ? 'border-aether-cyan/30' : ''}>
              <CardContent className="p-3 flex items-start gap-2">
                <span className="text-2xl shrink-0">{gem.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{gem.nameRu}</div>
                  <div className="text-[10px] text-slate-400">
                    Ур.{displayLevel}/{MAX_SOCKET_GEM_LEVEL} · ×{count} · +{getGemStatValue(gem.id, displayLevel)} {gem.stat.toUpperCase()}
                    · {RARITY_LABELS_RU[gem.rarity]}
                  </div>
                  {!studied && !studying && (
                    <div className="text-[10px] text-amber-400">Требуется изучение</div>
                  )}
                  {studying && (
                    <div className="text-[10px] text-amber-400">
                      Изучается: {formatGemStudyCountdown(studyLeft)}
                    </div>
                  )}
                  {canWork && (
                    <div className="text-[9px] text-slate-500 mt-1 space-y-0.5">
                      <div>
                        Создать: {formatGemCraftCost(combineCost)}
                        {combineRank > 1 && ` · ранг ${combineRank}`}
                      </div>
                      {upgradeCost && (
                        <div>
                          Улучшить: {formatGemCraftCost(upgradeCost)}
                          {upgradeRank && ` · ранг ${upgradeRank}`}
                          {upgradeChance != null && ` · ${upgradeChance}% успех`}
                        </div>
                      )}
                      {combineBlock && studied && (
                        <div className="text-amber-400/90">{combineBlock}</div>
                      )}
                      {upgradeBlock && studied && gemLevel > 0 && gemLevel < MAX_SOCKET_GEM_LEVEL && (
                        <div className="text-amber-400/90">{upgradeBlock}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    disabled={!canWork || !!combineBlock}
                    onClick={() => handleCombine(gem.id)}
                  >
                    Создать
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-[10px] h-7"
                    disabled={!canWork || gemLevel <= 0 || gemLevel >= MAX_SOCKET_GEM_LEVEL || !!upgradeBlock}
                    onClick={() => handleUpgrade(gem.id)}
                  >
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
                · {RARITY_LABELS_RU[selectedItem.rarity]}
              </div>
              <div className="flex flex-wrap gap-1">
                {getItemSockets(selectedItem).map((g) => (
                  <Badge key={g} className="text-[9px]">{SOCKET_GEMS.find((x) => x.id === g)?.icon}</Badge>
                ))}
              </div>
              {countEmptySockets(selectedItem) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {SOCKET_GEMS.filter((g) => jewelCount(g.id) > 0 && isGemStudied(p, g.id) && canSocketGem(selectedItem, g.id)).map((g) => (
                    <Button key={g.id} size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleSocket(g.id)}>
                      {g.icon} вставить
                    </Button>
                  ))}
                  {SOCKET_GEMS.filter((g) => jewelCount(g.id) > 0 && isGemStudied(p, g.id) && canSocketGem(selectedItem, g.id)).length === 0
                    && countEmptySockets(selectedItem) > 0 && (
                    <p className="text-[9px] text-amber-400 w-full">
                      Нет изученных камней редкости «{RARITY_LABELS_RU[selectedItem.rarity]}» для вставки
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
