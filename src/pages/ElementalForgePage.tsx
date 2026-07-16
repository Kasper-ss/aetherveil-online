import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import {
  ELEMENTAL_BUFFS, ELEMENTAL_BUFF_SLOTS, getElementalBuffApplyCost, hasElementalForge,
} from '@/data/elementalForge'
import { RARITY_LABELS_RU } from '@/data/items'
import { RESOURCES } from '@/data/classes'
import { formatNumber } from '@/lib/utils'
import type { ElementalBuffId, Item } from '@/types/game'

export function ElementalForgePage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const applyElementalBuff = usePlayerStore((s) => s.applyElementalBuff)
  const upgradeElementalBuff = usePlayerStore((s) => s.upgradeElementalBuff)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/forge'), true)

  if (!player) return null

  if (!hasElementalForge(player)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Flame className="h-12 w-12 text-orange-400 mb-3" />
        <p className="text-sm text-slate-400 mb-2">
          Прокачайте навык «Стихийная кузня» у кузнеца (единоразово).
        </p>
        <Button variant="secondary" onClick={() => navigate('/professions/blacksmithing')}>
          К профессиям
        </Button>
      </div>
    )
  }

  const weapons: Item[] = [
    ...player.inventory.filter((i) => i.slot === 'weapon'),
    ...(player.equipped.weapon ? [player.equipped.weapon] : []),
  ].filter((w, i, arr) => arr.findIndex((x) => x.instanceId === w.instanceId) === i)

  const selected = weapons.find((w) => w.instanceId === selectedId) ?? weapons[0] ?? null

  function formatCost(buffId: ElementalBuffId, level: number) {
    if (!selected) return ''
    const cost = getElementalBuffApplyCost(selected.rarity, level, buffId)
    const parts = [`🪙${formatNumber(cost.gold)}`]
    for (const [rid, amt] of Object.entries(cost.resources)) {
      if (amt && amt > 0) parts.push(`${RESOURCES[rid as keyof typeof RESOURCES]?.icon ?? '?'}${amt}`)
    }
    return parts.join(' · ')
  }

  function handleApply(buffId: ElementalBuffId) {
    if (!selected?.instanceId) return
    if (applyElementalBuff(selected.instanceId, buffId)) hapticSuccess()
    else hapticError()
  }

  function handleUpgrade(buffId: ElementalBuffId) {
    if (!selected?.instanceId) return
    if (upgradeElementalBuff(selected.instanceId, buffId)) hapticSuccess()
    else hapticError()
  }

  const maxSlots = selected ? (ELEMENTAL_BUFF_SLOTS[selected.rarity] ?? 0) : 0
  const applied = selected?.elementalBuffs ?? []

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/forge')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Стихийная кузня</h1>
      </div>

      <div className="p-4 space-y-3">
        {weapons.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-slate-400 text-center">
              Нужно оружие в инвентаре или экипировке.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 mb-2">Выберите оружие</p>
                <div className="flex flex-wrap gap-2">
                  {weapons.map((w) => (
                    <Button
                      key={w.instanceId}
                      size="sm"
                      variant={selected?.instanceId === w.instanceId ? 'default' : 'secondary'}
                      onClick={() => setSelectedId(w.instanceId!)}
                    >
                      {w.icon} {w.name}
                    </Button>
                  ))}
                </div>
                {selected && (
                  <p className="text-[10px] text-aether-cyan mt-2">
                    {RARITY_LABELS_RU[selected.rarity]} · слотов бафов: {applied.length}/{maxSlots}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              {ELEMENTAL_BUFFS.map((buff) => {
                const existing = applied.find((b) => b.id === buff.id)
                const canAdd = !existing && applied.length < maxSlots
                return (
                  <Card key={buff.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-medium text-white">{buff.icon} {buff.nameRu}</div>
                          <div className="text-[10px] text-slate-400">{buff.descriptionRu}</div>
                        </div>
                        {existing && (
                          <Badge className="bg-aether-purple/30 text-aether-purple">Ур. {existing.level}/10</Badge>
                        )}
                      </div>
                      {canAdd && (
                        <Button size="sm" className="w-full" onClick={() => handleApply(buff.id)}>
                          Наложить · {formatCost(buff.id, 1)}
                        </Button>
                      )}
                      {existing && existing.level < 10 && (
                        <Button size="sm" className="w-full mt-1" variant="gold" onClick={() => handleUpgrade(buff.id)}>
                          Улучшить · {formatCost(buff.id, existing.level + 1)}
                        </Button>
                      )}
                      {!existing && applied.length >= maxSlots && (
                        <p className="text-[10px] text-red-400">Нет свободных слотов для этой редкости</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
