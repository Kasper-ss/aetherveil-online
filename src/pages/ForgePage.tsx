import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MissingResourcesModal } from '@/components/ui/MissingResourcesModal'
import { usePlayerStore } from '@/store/playerStore'
import { RESOURCES, getUpgradeLevelCost, getStarUpgradeCost, getDismantleYield, getForgeCraftRecipes } from '@/data/classes'
import { ALL_ITEMS, formatItemStats, RARITY_LABELS_RU } from '@/data/items'
import { ItemSummary } from '@/components/ui/ItemSummary'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { Item } from '@/types/game'
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
  const removeItemByInstance = usePlayerStore((s) => s.removeItemByInstance)
  const addItem = usePlayerStore((s) => s.addItem)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    if (selectedItem) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedItem?.instanceId])

  if (!player) return null

  const equippable = player.inventory.filter((i) => i.slot !== 'consumable')
  const craftRecipes = getForgeCraftRecipes(player)
  const commonCount = equippable.filter((i) => i.rarity === 'common').length

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
    removeItemByInstance(old.instanceId!)
    addItem(neu)
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
    const count = dismantleAllCommonItems()
    if (count > 0) {
      if (selectedItem && !player!.inventory.some((i) => i.instanceId === selectedItem.instanceId)) {
        setSelectedItem(null)
      }
      hapticSuccess()
    } else {
      hapticError()
    }
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
        <TabsList className="w-full">
          <TabsTrigger value="craft">{t('forge.recipes')}</TabsTrigger>
          <TabsTrigger value="upgrade">{t('forge.upgrades')}</TabsTrigger>
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
                          : 'border-aether-gold glow-purple'
                        : ''
                  }
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{result?.icon}</span>
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
                            {recipe.setCraftRarity === 'epic' ? 'Эпический сет' : 'Легендарный сет'}
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
                    <div className="text-2xl shrink-0">{item.icon}</div>
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
                  <div className="text-4xl mb-1">{selectedItem.icon}</div>
                  <div className="text-sm font-bold text-white">{selectedItem.name}</div>
                  <Badge variant={selectedItem.rarity}>{RARITY_LABELS_RU[selectedItem.rarity]}</Badge>
                  <p className="text-[10px] text-aether-cyan mt-1">{formatItemStats(selectedItem)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{selectedItem.description}</p>
                </div>

                {(selectedItem.upgradeLevel ?? 1) < 10 && (
                  <div className="bg-aether-bg rounded-lg p-3">
                    <p className="text-xs font-medium text-white mb-1">Улучшение уровня → {(selectedItem.upgradeLevel ?? 1) + 1}</p>
                    <p className="text-[10px] text-slate-400 mb-2">+8% к статам за уровень.</p>
                    {(() => {
                      const c = getUpgradeLevelCost(selectedItem)
                      return (
                        <p className="text-[10px] text-slate-500 mb-2">
                          🪙{c.gold} {Object.entries(c.resources).map(([k, v]) => v ? `${RESOURCES[k as import('@/types/game').ResourceId].icon}${v}` : '').join(' ')}
                        </p>
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
                    <p className="text-[10px] text-slate-400 mb-2">+5% к статам за звезду.</p>
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
      </Tabs>
    </div>
  )
}
