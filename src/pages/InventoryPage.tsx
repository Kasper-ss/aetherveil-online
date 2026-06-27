import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EquipmentSlotIcon } from '@/components/ui/EquipmentSlotIcon'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { SKILLS } from '@/data/gameData'
import { getScaledSkill } from '@/data/playerSkills'
import { SLOT_LABELS_RU, formatItemStats, RARITY_LABELS_RU } from '@/data/items'
import { getActiveSetBonuses } from '@/lib/setBonuses'
import { groupConsumableStacks, type ConsumableId } from '@/lib/consumables'
import { FOOD_BUFF_MAP } from '@/data/kitchenRecipes'
import { formatFoodBuffDescription } from '@/lib/foodBuffs'
import { ResourceCatalog } from '@/components/ui/ResourceCatalog'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { Item, EquipSlot } from '@/types/game'

const EQUIP_ORDER: EquipSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet',
]

export function InventoryPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const equipItem = usePlayerStore((s) => s.equipItem)
  const unequipItem = usePlayerStore((s) => s.unequipItem)
  const consumeConsumable = usePlayerStore((s) => s.consumeConsumable)
  const eatFood = usePlayerStore((s) => s.eatFood)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const setBonuses = getActiveSetBonuses(player)
  const consumableStacks = groupConsumableStacks(player.inventory)
  const foodStacks = Object.entries(
    player.inventory
      .filter((i) => FOOD_BUFF_MAP[i.id])
      .reduce<Record<string, { name: string; icon: string; count: number; buffDesc: string }>>((acc, item) => {
        const cur = acc[item.id]
        if (cur) cur.count++
        else acc[item.id] = {
          name: item.name,
          icon: item.icon,
          count: 1,
          buffDesc: formatFoodBuffDescription(item.id),
        }
        return acc
      }, {}),
  )
  const gearItems = player.inventory.filter((i) => i.slot !== 'consumable')

  function handleEquip(item: Item) {
    if (item.slot !== 'consumable') equipItem(item)
  }

  function handleUseConsumable(itemId: ConsumableId) {
    if (consumeConsumable(itemId)) hapticSuccess()
  }

  function handleEatFood(itemId: string) {
    if (eatFood(itemId)) hapticSuccess()
    else hapticError()
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
          <TabsTrigger value="resources">Ресурсы</TabsTrigger>
          <TabsTrigger value="skills">Навыки</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <div className="grid grid-cols-1 gap-1.5">
            {EQUIP_ORDER.map((slot) => {
              const item = player.equipped[slot]
              return (
                <Card key={slot}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <EquipmentSlotIcon slot={slot} rarity={item?.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-500">{SLOT_LABELS_RU[slot]}</div>
                      <div className="text-xs font-medium text-white truncate">{item?.name ?? 'Пусто'}</div>
                      {item && (
                        <div className="text-[9px] text-aether-cyan truncate">{formatItemStats(item)}</div>
                      )}
                    </div>
                    {item && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => unequipItem(slot)}>
                        Снять
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="items">
          {foodStacks.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs text-slate-400 font-medium">Еда (баффы)</p>
              {foodStacks.map(([itemId, stack]) => (
                <Card key={itemId}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <span className="text-lg">{stack.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{stack.name}</div>
                      <div className="text-[10px] text-aether-cyan leading-tight">{stack.buffDesc}</div>
                      <div className="text-[10px] text-slate-500">×{stack.count}</div>
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleEatFood(itemId)}>
                      Съесть
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {consumableStacks.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs text-slate-400 font-medium">Расходники</p>
              {consumableStacks.map((stack) => (
                <Card key={stack.itemId}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <span className="text-lg">{stack.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{stack.name}</div>
                      <div className="text-[10px] text-slate-500">×{stack.count}</div>
                    </div>
                    <Button size="sm" className="h-7 text-xs" onClick={() => handleUseConsumable(stack.itemId)}>
                      Использовать
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {gearItems.map((item) => (
              <Card
                key={item.instanceId}
                className="cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleEquip(item)}
              >
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    {item.slot !== 'consumable' && (
                      <EquipmentSlotIcon slot={item.slot as EquipSlot} rarity={item.rarity} size="sm" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{item.name}</div>
                      <Badge variant={item.rarity} className="mt-0.5 text-[8px]">{RARITY_LABELS_RU[item.rarity]}</Badge>
                      {Object.keys(item.stats).length > 0 && (
                        <div className="text-[9px] text-aether-cyan mt-0.5 leading-tight">{formatItemStats(item)}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {gearItems.length === 0 && consumableStacks.length === 0 && (
              <p className="col-span-2 text-center text-sm text-slate-500 py-8">
                Предметов нет. Исследуйте Башню!
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-3">
          <ResourceCatalog resources={player.resources} />
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
