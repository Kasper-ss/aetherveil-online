import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { SKILLS } from '@/data/gameData'
import { getScaledSkill } from '@/data/playerSkills'
import { SLOT_LABELS_RU, formatItemStats, RARITY_LABELS_RU } from '@/data/items'
import { getActiveSetBonuses } from '@/lib/setBonuses'
import type { Item, EquipSlot } from '@/types/game'

const EQUIP_ORDER: EquipSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet',
]

export function InventoryPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const equipItem = usePlayerStore((s) => s.equipItem)
  const unequipItem = usePlayerStore((s) => s.unequipItem)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const visibleSlots = EQUIP_ORDER

  const setBonuses = getActiveSetBonuses(player)

  function handleEquip(item: Item) {
    if (item.slot !== 'consumable') equipItem(item)
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Инвентарь</h1>
      </div>

      {setBonuses.length > 0 && (
        <div className="mx-4 mt-3 p-2 rounded-lg bg-aether-gold/10 border border-aether-gold/30">
          <p className="text-[10px] text-aether-gold font-medium mb-1">Активные сет-бонусы:</p>
          {setBonuses.map((b) => (
            <p key={b.id} className="text-[10px] text-slate-400">{b.name}: {b.description}</p>
          ))}
        </div>
      )}

      <Tabs defaultValue="equipment" className="p-4">
        <TabsList>
          <TabsTrigger value="equipment">Экипировка</TabsTrigger>
          <TabsTrigger value="items">Предметы</TabsTrigger>
          <TabsTrigger value="skills">Навыки</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <div className="space-y-2">
            {visibleSlots.map((slot) => {
              const item = player.equipped[slot]
              return (
                <Card key={slot}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-aether-bg flex items-center justify-center text-2xl border border-aether-border">
                      {item?.icon ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500">{SLOT_LABELS_RU[slot]}</div>
                      <div className="text-sm font-medium text-white truncate">{item?.name ?? 'Пусто'}</div>
                      {item && (
                        <>
                          <Badge variant={item.rarity} className="mt-0.5 text-[8px]">{RARITY_LABELS_RU[item.rarity]}</Badge>
                          <div className="text-[10px] text-aether-cyan mt-0.5">{formatItemStats(item)}</div>
                        </>
                      )}
                    </div>
                    {item && (
                      <Button variant="ghost" size="sm" onClick={() => unequipItem(slot)}>Снять</Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="items">
          <div className="grid grid-cols-2 gap-2">
            {player.inventory.map((item) => (
              <Card
                key={item.instanceId}
                className="cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleEquip(item)}
              >
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-medium text-white truncate">{item.name}</div>
                    <Badge variant={item.rarity} className="mt-1 text-[8px]">{RARITY_LABELS_RU[item.rarity]}</Badge>
                    <div className="text-[9px] text-slate-500 mt-0.5">{SLOT_LABELS_RU[item.slot as EquipSlot] ?? item.slot}</div>
                    {Object.keys(item.stats).length > 0 && (
                      <div className="text-[9px] text-aether-cyan mt-1 leading-tight">{formatItemStats(item)}</div>
                    )}
                    {(item.upgradeLevel ?? 1) > 1 && (
                      <div className="text-[9px] text-aether-cyan">Ур. {item.upgradeLevel}</div>
                    )}
                    {(item.starLevel ?? 0) > 0 && (
                      <div className="text-[9px] text-aether-gold">{'★'.repeat(item.starLevel!)}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {player.inventory.length === 0 && (
              <p className="col-span-2 text-center text-sm text-slate-500 py-8">
                Предметов нет. Исследуйте Башню!
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <Button variant="secondary" className="w-full mb-3" onClick={() => navigate('/skills')}>
            ✨ Открыть древо навыков
          </Button>
          <div className="space-y-2">
            {player.skills.map((skillId) => {
              const skill = SKILLS[skillId]
              const level = player.skillLevels[skillId] ?? 1
              const scaled = getScaledSkill(skill, level)
              return (
                <Card key={skillId}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{skill.nameRu} Ур.{level}</div>
                      <div className="text-[10px] text-slate-400">{skill.descriptionRu}</div>
                      <div className="text-[10px] text-aether-cyan mt-1">
                        Перезарядка: {scaled.cooldown}с · Энергия: {scaled.energyCost}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
