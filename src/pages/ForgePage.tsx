import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MissingResourcesModal } from '@/components/ui/MissingResourcesModal'
import { DismantleRewardModal } from '@/components/ui/DismantleRewardModal'
import { usePlayerStore, type DismantleSummary } from '@/store/playerStore'
import { RESOURCES, getUpgradeLevelCost, getStarUpgradeCost, getStarLevelUpgradeCostMult, getDismantleYield, getForgeCraftRecipes } from '@/data/classes'
import { getRepairCost, needsRepair, ensureItemDurability } from '@/lib/equipmentDurability'
import {
  canUpgradeRarity, canUpgradeRarityForPlayer, countDuplicateItems, getNextRarity, getRarityUpgradeCost,
  getRarityUpgradeBlockReason,
  RARITY_ITEMS_TOTAL_REQUIRED,
} from '@/lib/rarityUpgrade'
import {
  ALL_ITEMS, formatItemStats, RARITY_LABELS_RU, sortGearItems,
  getItemStatDeltaPreview, formatStatDelta,
  getUpgradeLevelStepPercent, getStarStepPercent, getItemStatMultiplier,
  type GearSortMode,
} from '@/data/items'
import { ItemSummary } from '@/components/ui/ItemSummary'
import { EquipmentSlotIcon } from '@/components/ui/EquipmentSlotIcon'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { Item } from '@/types/game'
import type { EquipSlot } from '@/data/items'
import { GemWorkshopPanel } from '@/components/GemWorkshopPanel'
import { EquipGemSocketDialog } from '@/components/ui/EquipGemSocketDialog'
import { getEquippedItemsWithEmptyGemSockets } from '@/lib/gemSockets'
import { hasSupremeEnchantments } from '@/lib/professionBonuses'
import { getEnchantmentsForItem } from '@/data/supremeEnchantments'
import type { MissingCost } from '@/lib/craftCosts'

export function ForgePage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const craftItem = usePlayerStore((s) => s.craftItem)
  const upgradeItemLevel = usePlayerStore((s) => s.upgradeItemLevel)
  const upgradeItemStars = usePlayerStore((s) => s.upgradeItemStars)
  const craftMythicItem = usePlayerStore((s) => s.craftMythicItem)
  const getCraftMissing = usePlayerStore((s) => s.getCraftMissing)
  const getUpgradeLevelMissing = usePlayerStore((s) => s.getUpgradeLevelMissing)
  const getStarUpgradeMissing = usePlayerStore((s) => s.getStarUpgradeMissing)
  const getMythicUpgradeMissing = usePlayerStore((s) => s.getMythicUpgradeMissing)
  const dismantleItem = usePlayerStore((s) => s.dismantleItem)
  const dismantleAllCommonItems = usePlayerStore((s) => s.dismantleAllCommonItems)
  const replaceItemInstance = usePlayerStore((s) => s.replaceItemInstance)
  const repairItem = usePlayerStore((s) => s.repairItem)
  const repairAllItems = usePlayerStore((s) => s.repairAllItems)
  const getRepairAllCost = usePlayerStore((s) => s.getRepairAllCost)
  const upgradeItemRarity = usePlayerStore((s) => s.upgradeItemRarity)
  const applySupremeEnchant = usePlayerStore((s) => s.applySupremeEnchant)
  const [gemItem, setGemItem] = useState<Item | null>(null)
  const getRarityUpgradeMissing = usePlayerStore((s) => s.getRarityUpgradeMissing)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedRepairItem, setSelectedRepairItem] = useState<Item | null>(null)
  const [selectedRarityItem, setSelectedRarityItem] = useState<Item | null>(null)
  const [raritySource, setRaritySource] = useState<'inventory' | 'equipped'>('inventory')
  const [raritySort, setRaritySort] = useState<GearSortMode>('type')
  const [upgradeSource, setUpgradeSource] = useState<'inventory' | 'equipped'>('inventory')
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)
  const [dismantleSummary, setDismantleSummary] = useState<DismantleSummary | null>(null)
  const [gemSocketOpen, setGemSocketOpen] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    if (selectedItem) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedItem?.instanceId])

  if (!player) return null

  const equippableInventory = player.inventory.filter((i) => i.slot !== 'consumable')
  const equippableEquipped = (Object.values(player.equipped).filter(Boolean) as Item[])
  const equippable = upgradeSource === 'inventory' ? equippableInventory : equippableEquipped
  const craftRecipes = getForgeCraftRecipes(player)
  const commonCount = equippable.filter((i) => i.rarity === 'common').length
  const allGear = [
    ...player.inventory.filter((i) => i.slot !== 'consumable'),
    ...equippableEquipped,
  ]
  const damagedGear = allGear.filter((i) => needsRepair(ensureItemDurability(i)))
  const repairAllCost = getRepairAllCost()
  const rarityCandidates = sortGearItems(
    (raritySource === 'inventory'
      ? player.inventory
      : equippableEquipped
    ).filter((i) => canUpgradeRarity(i)),
    raritySort,
  )
  const equippedGemSlotCount = getEquippedItemsWithEmptyGemSockets(player).length

  function showMissing(title: string, missing: MissingCost[]) {
    if (missing.length === 0) return false
    setMissingModal({ title, missing })
    hapticError()
    return true
  }

  function handleCraft(recipeId: string) {
    const missing = getCraftMissing(recipeId)
    if (missing.length > 0) { showMissing('Недостаточно для крафта', missing); return }
    if (craftItem(recipeId)) hapticSuccess()
    else hapticError()
  }

  function replaceItem(old: Item, neu: Item) {
    if (!old.instanceId) return
    replaceItemInstance(old.instanceId, neu)
    setSelectedItem(neu)
  }

  function handleLevelUpgrade() {
    if (!selectedItem) return
    const missing = getUpgradeLevelMissing(selectedItem)
    if (missing.length > 0) { showMissing('Недостаточно для улучшения', missing); return }
    const upgraded = upgradeItemLevel(selectedItem)
    if (upgraded) { replaceItem(selectedItem, upgraded); hapticSuccess() }
    else hapticError()
  }

  function handleStarUpgrade() {
    if (!selectedItem) return
    const missing = getStarUpgradeMissing(selectedItem)
    if (missing.length > 0) { showMissing('Недостаточно для звёздности', missing); return }
    const upgraded = upgradeItemStars(selectedItem)
    if (upgraded) { replaceItem(selectedItem, upgraded); hapticSuccess() }
    else hapticError()
  }

  function handleMythicUpgrade() {
    if (!selectedItem) return
    const allMissing = getMythicUpgradeMissing(selectedItem)
    if (allMissing.length > 0) { showMissing('Недостаточно для мифического крафта', allMissing); return }
    const upgraded = craftMythicItem(selectedItem)
    if (upgraded) { replaceItem(selectedItem, upgraded); hapticSuccess() }
    else hapticError()
  }

  function handleDismantle() {
    if (!selectedItem) return
    const ok = dismantleItem(selectedItem)
    if (ok) {
      setSelectedItem(null)
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  function handleDismantleAllCommon() {
    const summary = dismantleAllCommonItems()
    if (summary.count > 0) {
      if (selectedItem && !player!.inventory.some((i) => i.instanceId === selectedItem.instanceId)) {
        setSelectedItem(null)
      }
      setDismantleSummary(summary)
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  function handleRepair() {
    if (!selectedRepairItem) return
    if (repairItem(selectedRepairItem)) {
      hapticSuccess()
      setSelectedRepairItem(null)
    } else hapticError()
  }

  function handleRepairAll() {
    if (repairAllItems()) hapticSuccess()
    else hapticError()
  }

  function handleRarityUpgrade() {
    if (!selectedRarityItem) return
    const missing = getRarityUpgradeMissing(selectedRarityItem)
    if (missing.length > 0) { showMissing('Недостаточно для повышения редкости', missing); return }
    const upgraded = upgradeItemRarity(selectedRarityItem)
    if (upgraded) {
      setSelectedRarityItem(upgraded)
      hapticSuccess()
    } else hapticError()
  }

  function formatYield(resources: Partial<Record<import('@/types/game').ResourceId, number>>, gold: number) {
    const parts = gold > 0 ? [`🪙${gold}`] : []
    for (const [k, v] of Object.entries(resources)) {
      if (v) parts.push(`${RESOURCES[k as import('@/types/game').ResourceId].icon}${v}`)
    }
    return parts.join(' ')
  }

  return (
    <div className="h-full overflow-y-auto page-enter pb-6">
      <MissingResourcesModal
        open={!!missingModal}
        onClose={() => setMissingModal(null)}
        title={missingModal?.title ?? ''}
        missing={missingModal?.missing ?? []}
      />
      <DismantleRewardModal
        open={!!dismantleSummary}
        onClose={() => setDismantleSummary(null)}
        summary={dismantleSummary}
      />

      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">🔨 {t('forge.title')}</h1>
      </div>

      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {(Object.entries(player.resources) as [import('@/types/game').ResourceId, number][]).map(([id, amt]) => {
          if (!amt) return null
          const res = RESOURCES[id]
          return (
            <div key={id} className="shrink-0 text-center bg-aether-card rounded-lg px-2 py-1">
              <span className="text-lg">{res.icon}</span>
              <span className="text-[10px] text-white ml-1">{res.nameRu}: {amt}</span>
            </div>
          )
        })}
      </div>

      <Tabs defaultValue="craft" className="p-4">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="craft" className="text-[10px]">{t('forge.recipes')}</TabsTrigger>
          <TabsTrigger value="upgrade" className="text-[10px]">{t('forge.upgrades')}</TabsTrigger>
          <TabsTrigger value="gems" className="text-[10px]">Камни</TabsTrigger>
          <TabsTrigger value="repair" className="text-[10px]">Починка</TabsTrigger>
          <TabsTrigger value="rarity" className="text-[10px]">Редкость</TabsTrigger>
        </TabsList>

        <TabsContent value="craft" className="mt-2">
          <div className="space-y-2">
            {craftRecipes.map((recipe) => {
              const result = ALL_ITEMS[recipe.resultItemId]
              return (
                <Card
                  key={recipe.id}
                  className={
                    recipe.isMythicCraft
                      ? 'border-fuchsia-500/50 glow-purple'
                      : recipe.isSetCraft
                        ? recipe.setCraftRarity === 'epic'
                          ? 'border-aether-purple/50'
                          : recipe.setCraftRarity === 'lucky'
                            ? 'border-aether-gold glow-cyan'
                            : 'border-aether-gold glow-purple'
                        : ''
                  }
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {result ? (
                        <EquipmentSlotIcon slot={result.slot as EquipSlot} rarity={result.rarity} size="sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-md border border-aether-border bg-aether-bg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{recipe.name}</div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{recipe.description}</p>
                        {result && (
                          <>
                            <Badge variant={result.rarity} className="mt-1">{RARITY_LABELS_RU[result.rarity]}</Badge>
                            {Object.keys(result.stats ?? {}).length > 0 && (
                              <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(result)}</p>
                            )}
                          </>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
                          {Object.entries(recipe.resources).map(([rid, amt]) => (
                            <span key={rid} className="bg-aether-bg px-1.5 py-0.5 rounded">
                              {RESOURCES[rid as import('@/types/game').ResourceId].icon}{amt}
                            </span>
                          ))}
                          <span className="bg-aether-bg px-1.5 py-0.5 rounded">🪙{recipe.goldCost}</span>
                        </div>
                        {recipe.isMythicCraft && <Badge variant="mythic" className="mt-1">Мифический крафт</Badge>}
                        {recipe.isSetCraft && !recipe.isMythicCraft && (
                          <Badge variant={recipe.setCraftRarity === 'epic' ? 'epic' : 'legendary'} className="mt-1">
                            {recipe.setCraftRarity === 'epic' ? 'Эпический сет' : recipe.setCraftRarity === 'lucky' ? 'Lucky · легендарный' : 'Легендарный сет'}
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" onClick={() => handleCraft(recipe.id)}>{t('forge.craftBtn')}</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="upgrade" className="mt-2">
          <Tabs value={upgradeSource} onValueChange={(v) => { setUpgradeSource(v as 'inventory' | 'equipped'); setSelectedItem(null) }}>
            <TabsList className="mb-2 w-full">
              <TabsTrigger value="inventory" className="flex-1">В инвентаре</TabsTrigger>
              <TabsTrigger value="equipped" className="flex-1">Надетое</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-slate-400 mb-2">Выберите предмет (улучшение до 10 ур. / 10 ★ / мифик / разборка)</p>
          {commonCount > 0 && (
            <Button variant="secondary" size="sm" className="w-full mb-3" onClick={handleDismantleAllCommon}>
              Разобрать все обычные ({commonCount})
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {equippable.map((item) => (
              <Card
                key={item.instanceId}
                className={`cursor-pointer ${selectedItem?.instanceId === item.instanceId ? 'border-aether-cyan glow-cyan' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    <EquipmentSlotIcon slot={item.slot as EquipSlot} rarity={item.rarity} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white truncate">{item.name}</div>
                      <ItemSummary item={item} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedItem && (
            <Card ref={detailRef}>
              <CardContent className="p-4 space-y-3">
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <EquipmentSlotIcon slot={selectedItem.slot as EquipSlot} rarity={selectedItem.rarity} />
                  </div>
                  <div className="text-sm font-bold text-white">{selectedItem.name}</div>
                  <Badge variant={selectedItem.rarity}>{RARITY_LABELS_RU[selectedItem.rarity]}</Badge>
                  <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(selectedItem)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ур.{selectedItem.upgradeLevel ?? 1} · ★{selectedItem.starLevel ?? 0} · ×{getItemStatMultiplier(selectedItem).toFixed(2)} к бонусам
                  </p>
                </div>

                {(selectedItem.upgradeLevel ?? 1) < 10 && (
                  <div className="bg-aether-bg rounded-lg p-3">
                    <p className="text-xs font-medium text-white mb-1">Улучшение уровня → {(selectedItem.upgradeLevel ?? 1) + 1}</p>
                    <p className="text-[10px] text-aether-gold mb-1">
                      +{getUpgradeLevelStepPercent((selectedItem.upgradeLevel ?? 1) + 1)}% к статам · {formatStatDelta(getItemStatDeltaPreview(selectedItem, 'level'))}
                    </p>
                    <p className="text-[10px] text-slate-400 mb-2">После улучшения: {formatItemStats({ ...selectedItem, upgradeLevel: (selectedItem.upgradeLevel ?? 1) + 1 })}</p>
                    {(() => {
                      const c = getUpgradeLevelCost(selectedItem)
                      const starMult = getStarLevelUpgradeCostMult(selectedItem.starLevel ?? 0)
                      return (
                        <>
                          {starMult > 1 && (
                            <p className="text-[10px] text-amber-400 mb-1">
                              Стоимость ×{starMult.toFixed(1)} из-за ★{selectedItem.starLevel}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 mb-2">
                            🪙{c.gold} {Object.entries(c.resources).map(([k, v]) => v ? `${RESOURCES[k as import('@/types/game').ResourceId].icon}${v}` : '').join(' ')}
                          </p>
                        </>
                      )
                    })()}
                    <Button className="w-full" size="sm" onClick={handleLevelUpgrade}>
                      {t('forge.upgradeBtn')} (уровень)
                    </Button>
                  </div>
                )}

                {(selectedItem.starLevel ?? 0) < 10 && (
                  <div className="bg-aether-bg rounded-lg p-3">
                    <p className="text-xs font-medium text-white mb-1">Звёздность → {(selectedItem.starLevel ?? 0) + 1}★</p>
                    <p className="text-[10px] text-aether-gold mb-1">
                      +{getStarStepPercent((selectedItem.starLevel ?? 0) + 1)}% к статам · {formatStatDelta(getItemStatDeltaPreview(selectedItem, 'star'))}
                    </p>
                    <p className="text-[10px] text-amber-400 mb-1">
                      ⚠️ Уровень предмета сбросится до 1
                    </p>
                    <p className="text-[10px] text-slate-400 mb-2">
                      После улучшения: {formatItemStats({
                        ...selectedItem,
                        starLevel: (selectedItem.starLevel ?? 0) + 1,
                        upgradeLevel: 1,
                      })}
                    </p>
                    {(() => {
                      const c = getStarUpgradeCost(selectedItem)
                      return (
                        <p className="text-[10px] text-slate-500 mb-2">
                          🪙{c.gold} {Object.entries(c.resources).map(([k, v]) => v ? `${RESOURCES[k as import('@/types/game').ResourceId].icon}${v}` : '').join(' ')}
                        </p>
                      )
                    })()}
                    <Button className="w-full" size="sm" variant="gold" onClick={handleStarUpgrade}>
                      Повысить звёздность
                    </Button>
                  </div>
                )}

                {selectedItem.rarity !== 'mythic' && (selectedItem.upgradeLevel ?? 1) >= 10 && (selectedItem.starLevel ?? 0) >= 10 && (
                  <div className="bg-gradient-to-r from-fuchsia-900/30 to-cyan-900/30 rounded-lg p-3 border border-fuchsia-500/30">
                    <p className="text-xs font-medium text-white mb-1">✦ Мифический крафт</p>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Требуется 10/10 ур. и 10★. Превращает предмет в мифический (+50% статов).
                    </p>
                    <Button className="w-full" size="sm" variant="gold" onClick={handleMythicUpgrade}>
                      Создать мифический предмет
                    </Button>
                  </div>
                )}

                <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                  <p className="text-xs font-medium text-white mb-1">Разобрать предмет</p>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Уничтожить снаряжение и получить ресурсы. Нельзя разобрать надетый предмет.
                  </p>
                  {(() => {
                    const y = getDismantleYield(selectedItem)
                    return (
                      <p className="text-[10px] text-slate-500 mb-2">
                        Получите: {formatYield(y.resources, y.gold)}
                      </p>
                    )
                  })()}
                  <Button className="w-full" size="sm" variant="destructive" onClick={handleDismantle}>
                    Разобрать
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gems" className="mt-2">
          <Button
            className="w-full mb-3"
            variant="gold"
            onClick={() => setGemSocketOpen(true)}
          >
            💎 Вставить камень в экипировку
            {equippedGemSlotCount > 0 && (
              <span className="ml-2 text-[10px] opacity-80">({equippedGemSlotCount} предм.)</span>
            )}
          </Button>
          <EquipGemSocketDialog open={gemSocketOpen} onOpenChange={setGemSocketOpen} />
          <GemWorkshopPanel
            selectedItem={gemItem}
            onSelectItem={setGemItem}
            gear={allGear}
          />
          {hasSupremeEnchantments(player) && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-aether-purple">Верховные зачарования</p>
              {allGear.filter((i) => !i.supremeEnchantId).slice(0, 6).map((item) => (
                <Card key={item.instanceId}>
                  <CardContent className="p-3">
                    <div className="text-sm text-white mb-2">{item.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {getEnchantmentsForItem(item).map((enc) => (
                        <Button
                          key={enc.id}
                          size="sm"
                          variant="outline"
                          className="text-[10px] h-7"
                          onClick={() => {
                            if (item.instanceId && applySupremeEnchant(item.instanceId, enc.id)) hapticSuccess()
                            else hapticError()
                          }}
                        >
                          {enc.nameRu} 🪙{enc.goldCost}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="repair" className="mt-2">
          <p className="text-xs text-slate-400 mb-2">Восстановите прочность снаряжения за золото. Изношенные предметы теряют эффективность статов.</p>
          {repairAllCost > 0 && (
            <Button variant="gold" size="sm" className="w-full mb-3" onClick={handleRepairAll}>
              Починить всё (🪙{repairAllCost})
            </Button>
          )}
          {damagedGear.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Всё снаряжение в идеальном состоянии</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {damagedGear.map((item) => (
                <Card
                  key={item.instanceId}
                  className={`cursor-pointer ${selectedRepairItem?.instanceId === item.instanceId ? 'border-aether-cyan glow-cyan' : ''}`}
                  onClick={() => setSelectedRepairItem(item)}
                >
                  <CardContent className="p-2">
                    <div className="flex items-start gap-2">
                      <EquipmentSlotIcon slot={item.slot as EquipSlot} rarity={item.rarity} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-white truncate">{item.name}</div>
                        <ItemSummary item={item} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {selectedRepairItem && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium text-white">{selectedRepairItem.name}</p>
                <ItemSummary item={selectedRepairItem} />
                <p className="text-xs text-slate-400">Стоимость починки: 🪙{getRepairCost(ensureItemDurability(selectedRepairItem))}</p>
                <Button className="w-full" onClick={handleRepair}>Починить</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rarity" className="mt-2">
          <p className="text-xs text-slate-400 mb-2">
            Объедините {RARITY_ITEMS_TOTAL_REQUIRED} одинаковых предмета одной редкости → 1 предмет следующей редкости + ресурсы.
            Легендарная и мифическая редкость — с 60 уровня и ранга кузнеца.
          </p>
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              size="sm"
              variant={raritySource === 'inventory' ? 'default' : 'outline'}
              className="flex-1 text-xs"
              onClick={() => { setRaritySource('inventory'); setSelectedRarityItem(null) }}
            >
              Инвентарь
            </Button>
            <Button
              type="button"
              size="sm"
              variant={raritySource === 'equipped' ? 'default' : 'outline'}
              className="flex-1 text-xs"
              onClick={() => { setRaritySource('equipped'); setSelectedRarityItem(null) }}
            >
              Надетое
            </Button>
          </div>
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              size="sm"
              variant={raritySort === 'type' ? 'secondary' : 'outline'}
              className="flex-1 text-[10px]"
              onClick={() => setRaritySort('type')}
            >
              По типу
            </Button>
            <Button
              type="button"
              size="sm"
              variant={raritySort === 'rarity' ? 'secondary' : 'outline'}
              className="flex-1 text-[10px]"
              onClick={() => setRaritySort('rarity')}
            >
              По редкости
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {rarityCandidates.map((item) => (
              <Card
                key={item.instanceId}
                className={`cursor-pointer ${selectedRarityItem?.instanceId === item.instanceId ? 'border-aether-cyan glow-cyan' : ''}`}
                onClick={() => setSelectedRarityItem(item)}
              >
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    <EquipmentSlotIcon slot={item.slot as EquipSlot} rarity={item.rarity} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white truncate">{item.name}</div>
                      <ItemSummary item={item} />
                      <p className="text-[9px] text-slate-500">
                        Пар: {1 + countDuplicateItems(allGear, item.id, item.rarity, item.instanceId)}/{RARITY_ITEMS_TOTAL_REQUIRED}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rarityCandidates.length === 0 && (
              <p className="col-span-2 text-sm text-slate-500 text-center py-6">Нет предметов для повышения редкости</p>
            )}
          </div>
          {selectedRarityItem && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-bold text-white">{selectedRarityItem.name}</p>
                <Badge variant={selectedRarityItem.rarity}>{RARITY_LABELS_RU[selectedRarityItem.rarity]}</Badge>
                <span className="text-aether-cyan mx-1">→</span>
                <Badge variant={getNextRarity(selectedRarityItem.rarity)!}>
                  {RARITY_LABELS_RU[getNextRarity(selectedRarityItem.rarity)!]}
                </Badge>
                {(() => {
                  const block = getRarityUpgradeBlockReason(selectedRarityItem, player)
                  const c = getRarityUpgradeCost(selectedRarityItem)
                  return (
                    <>
                      {block && (
                        <p className="text-[10px] text-amber-400">🔒 {block}</p>
                      )}
                      <p className="text-[10px] text-slate-500">
                        🪙{c.gold} {Object.entries(c.resources).map(([k, v]) => v ? `${RESOURCES[k as import('@/types/game').ResourceId].icon}${v}` : '').join(' ')}
                        · Пар: {1 + countDuplicateItems(allGear, selectedRarityItem.id, selectedRarityItem.rarity, selectedRarityItem.instanceId)}/{RARITY_ITEMS_TOTAL_REQUIRED}
                      </p>
                    </>
                  )
                })()}
                <Button
                  className="w-full"
                  disabled={!canUpgradeRarityForPlayer(selectedRarityItem, player)}
                  onClick={handleRarityUpgrade}
                >
                  Повысить редкость
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
