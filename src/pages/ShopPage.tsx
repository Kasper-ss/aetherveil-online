import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { SHOP_ITEMS } from '@/data/gameData'
import { RESOURCES } from '@/data/classes'
import { ALL_ITEMS, formatItemStats, RARITY_LABELS_RU, type EquipSlot } from '@/data/items'
import { SET_SCROLL_PRODUCTS, getScrollSetFilters } from '@/data/setScrolls'
import { EquipmentSlotIcon } from '@/components/ui/EquipmentSlotIcon'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError, hapticImpact, showTelegramAlert } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { formatNumber } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { createItemInstance } from '@/data/items'
import { ItemSummary } from '@/components/ui/ItemSummary'
import { STAR_SHOP_PRODUCTS, formatStarsPriceLabel } from '@/data/starShop'
import { getVipTier, getNextVipLevel, getVipUpgradeStars } from '@/data/vipTiers'
import { getVipMultipliers } from '@/lib/vipBonuses'
import { StarsPaymentError } from '@/lib/starsPayment'
import { getActiveBuffs, formatBuffRemaining } from '@/lib/playerBuffs'
import type { StarProductId } from '@/data/starShop'
import type { Item, ResourceId, MarketListing } from '@/types/game'
import { fetchServerMarket } from '@/lib/multiplayerSync'
import { getNpcSellGold, NPC_SELL_RATE_LABEL } from '@/data/resourceShop'
import { playerHasTool } from '@/data/tools'

const SHOP_TYPE_RU: Record<string, string> = {
  consumable: 'Расходник',
  cosmetic: 'Косметика',
  convenience: 'Удобство',
  equipment: 'Снаряжение',
  tool: 'Инструмент',
  scroll: 'Свиток',
  resource: 'Ресурсы',
}

const BASE_NPC = SHOP_ITEMS.filter(
  (i) => i.type !== 'equipment' && i.type !== 'tool' && i.type !== 'scroll' && i.type !== 'resource'
    && i.id !== 'shop_fishing_bait_bulk' && !i.starsPrice,
)
const TOOL_NPC = SHOP_ITEMS.filter((i) => i.type === 'tool' || i.id === 'shop_fishing_bait')
const RESOURCE_NPC = SHOP_ITEMS.filter((i) => i.type === 'resource' || i.id === 'shop_fishing_bait_bulk')
const SCROLL_NPC = SHOP_ITEMS.filter((i) => i.type === 'scroll')
const EQUIP_NPC = SHOP_ITEMS.filter((i) => i.type === 'equipment')

const EQUIP_SLOT_ORDER: EquipSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet',
]

function getShopItemSetId(shopItem: typeof SHOP_ITEMS[0]): string {
  const template = shopItem.itemId ? ALL_ITEMS[shopItem.itemId] : null
  return template?.setId ?? '__no_set__'
}

function getShopItemSetName(shopItem: typeof SHOP_ITEMS[0]): string {
  const template = shopItem.itemId ? ALL_ITEMS[shopItem.itemId] : null
  return template?.setName ?? 'Обычное снаряжение'
}

function sortEquipmentShopItems(items: typeof EQUIP_NPC): typeof EQUIP_NPC {
  const slotIndex = (slot: EquipSlot) => {
    const idx = EQUIP_SLOT_ORDER.indexOf(slot)
    return idx >= 0 ? idx : 99
  }
  return [...items].sort((a, b) => {
    const ta = a.itemId ? ALL_ITEMS[a.itemId] : null
    const tb = b.itemId ? ALL_ITEMS[b.itemId] : null
    const setCmp = getShopItemSetName(a).localeCompare(getShopItemSetName(b), 'ru')
    if (setCmp !== 0) return setCmp
    const slotA = ta?.slot ? slotIndex(ta.slot as EquipSlot) : 99
    const slotB = tb?.slot ? slotIndex(tb.slot as EquipSlot) : 99
    if (slotA !== slotB) return slotA - slotB
    return (ta?.name ?? '').localeCompare(tb?.name ?? '', 'ru')
  })
}

type ScrollRarityFilter = 'all' | 'epic' | 'legendary' | 'mythic'

export function ShopPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const spendGold = usePlayerStore((s) => s.spendGold)
  const spendGems = usePlayerStore((s) => s.spendGems)
  const updatePlayer = usePlayerStore((s) => s.updatePlayer)
  const listOnMarket = usePlayerStore((s) => s.listOnMarket)
  const listResourceOnMarket = usePlayerStore((s) => s.listResourceOnMarket)
  const removeMarketListing = usePlayerStore((s) => s.removeMarketListing)
  const buyMarketListing = usePlayerStore((s) => s.buyMarketListing)
  const purchaseStarProduct = usePlayerStore((s) => s.purchaseStarProduct)
  const sellResourceToNpc = usePlayerStore((s) => s.sellResourceToNpc)
  const sellItemToNpc = usePlayerStore((s) => s.sellItemToNpc)
  const [buyingStarId, setBuyingStarId] = useState<StarProductId | null>(null)
  const [buyingListingId, setBuyingListingId] = useState<string | null>(null)
  const [marketListings, setMarketListings] = useState<MarketListing[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [starShopMessage, setStarShopMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [listPrice, setListPrice] = useState('100')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedResource, setSelectedResource] = useState<ResourceId | null>(null)
  const [resourceAmount, setResourceAmount] = useState('1')
  const [scrollRarityFilter, setScrollRarityFilter] = useState<ScrollRarityFilter>('all')
  const [scrollSetFilter, setScrollSetFilter] = useState<string>('all')
  const [equipmentSetFilter, setEquipmentSetFilter] = useState<string>('all')

  useTelegramBackButton(() => navigate('/'), true)

  const loadMarket = useCallback(async () => {
    if (!player) return
    setMarketLoading(true)
    const listings = await fetchServerMarket(player.telegramId)
    setMarketListings(listings)
    setMarketLoading(false)
  }, [player])

  useEffect(() => {
    loadMarket()
    const interval = setInterval(loadMarket, 20_000)
    return () => clearInterval(interval)
  }, [loadMarket])

  if (!player) return null
  const p = player

  async function handleBuyListing(listing: MarketListing) {
    setBuyingListingId(listing.id)
    try {
      const ok = await buyMarketListing(listing)
      if (ok) {
        hapticSuccess()
        playSfx('loot')
        await loadMarket()
      } else {
        hapticError()
        showTelegramAlert('Не удалось купить лот. Возможно, его уже купили.')
        await loadMarket()
      }
    } finally {
      setBuyingListingId(null)
    }
  }

  function buyNpcItem(shopItem: typeof SHOP_ITEMS[0]) {
    if (shopItem.type === 'tool' && shopItem.toolId) {
      if (p.ownedTools?.includes(shopItem.toolId)) { hapticError(); return }
      if (shopItem.toolId === 'pickaxe' && playerHasTool(p, 'pickaxe')) { hapticError(); return }
      if (shopItem.toolId === 'fishing_rod' && playerHasTool(p, 'fishing_rod')) { hapticError(); return }
    }
    if (shopItem.type === 'scroll' && shopItem.scrollId) {
      if (p.unlockedSetScrolls?.includes(shopItem.scrollId)) { hapticError(); return }
    }
    if (shopItem.goldPrice && !spendGold(shopItem.goldPrice)) { hapticError(); return }
    if (shopItem.gemsPrice && !spendGems(shopItem.gemsPrice)) { hapticError(); return }

    if (shopItem.type === 'tool' && shopItem.toolId) {
      updatePlayer({ ownedTools: [...(p.ownedTools ?? []), shopItem.toolId] })
    } else if (shopItem.type === 'scroll' && shopItem.scrollId) {
      updatePlayer({ unlockedSetScrolls: [...(p.unlockedSetScrolls ?? []), shopItem.scrollId] })
    } else if (shopItem.resourceBundle) {
      usePlayerStore.getState().addResources(shopItem.resourceBundle, { skipGatherBonus: true })
      const jewelCount = Object.entries(shopItem.resourceBundle).reduce((s, [rid, amt]) => {
        if (!amt || !rid.startsWith('jewel_')) return s
        return s + amt
      }, 0)
      if (jewelCount > 0) {
        usePlayerStore.getState().awardJewelerExp(jewelCount * 8)
      }
    } else if (shopItem.itemId) {
      const count = shopItem.bundleCount ?? 1
      for (let i = 0; i < count; i++) {
        const inst = createItemInstance(shopItem.itemId)
        if (inst) usePlayerStore.getState().addItem(inst)
      }
    }
    hapticSuccess()
    playSfx('loot')
  }

  function handleNpcSellResource() {
    if (!selectedResource) { hapticError(); return }
    const amount = parseInt(resourceAmount, 10)
    if (isNaN(amount) || amount < 1) { hapticError(); return }
    if (sellResourceToNpc(selectedResource, amount)) {
      hapticSuccess()
      playSfx('loot')
    } else {
      hapticError()
    }
  }

  function handleNpcSellItem(item: Item) {
    if (sellItemToNpc(item)) {
      hapticSuccess()
      playSfx('loot')
      setSelectedItem(null)
    } else {
      hapticError()
    }
  }

  async function handleStarPurchase(productId: StarProductId) {
    hapticImpact('light')
    setStarShopMessage(null)
    setBuyingStarId(productId)
    try {
      const ok = await purchaseStarProduct(productId)
      if (ok) {
        hapticSuccess()
        playSfx('loot')
        setStarShopMessage({ type: 'success', text: 'Покупка успешно применена!' })
      }
    } catch (error) {
      hapticError()
      const message = error instanceof StarsPaymentError
        ? error.message
        : 'Не удалось выполнить оплату'
      console.error('[Stars]', error)
      setStarShopMessage({ type: 'error', text: message })
      showTelegramAlert(message)
    } finally {
      setBuyingStarId(null)
    }
  }

  const activeBuffs = getActiveBuffs(player)

  function handleListItem() {
    if (!selectedItem?.instanceId) { hapticError(); return }
    const price = parseInt(listPrice, 10)
    if (isNaN(price) || price < 1) { hapticError(); return }
    const ok = listOnMarket(selectedItem, price)
    if (ok) {
      setSelectedItem(null)
      hapticSuccess()
      playSfx('loot')
      void loadMarket()
    } else {
      hapticError()
    }
  }

  function handleListResource() {
    if (!selectedResource) { hapticError(); return }
    const amount = parseInt(resourceAmount, 10)
    const price = parseInt(listPrice, 10)
    if (isNaN(amount) || amount < 1 || isNaN(price) || price < 1) { hapticError(); return }
    const ok = listResourceOnMarket(selectedResource, amount, price)
    if (ok) {
      setSelectedResource(null)
      setResourceAmount('1')
      hapticSuccess()
      playSfx('loot')
      void loadMarket()
    } else {
      hapticError()
    }
  }

  const canListItem = !!selectedItem && parseInt(listPrice, 10) >= 1
  const canListResource = !!selectedResource && parseInt(resourceAmount, 10) >= 1 && parseInt(listPrice, 10) >= 1

  const sellableItems = player.inventory.filter((i) => i.slot !== 'consumable')
  const sellableResources = (Object.keys(RESOURCES) as ResourceId[]).filter(
    (id) => (player.resources[id] ?? 0) > 0
  )

  const filteredScrolls = useMemo(() => {
    let items = [...SET_SCROLL_PRODUCTS]
    if (scrollRarityFilter !== 'all') {
      items = items.filter((s) => s.rarity === scrollRarityFilter)
    }
    if (scrollSetFilter !== 'all') {
      items = items.filter((s) => s.setId === scrollSetFilter)
    }
    return items
  }, [scrollRarityFilter, scrollSetFilter])

  const scrollSetFilters = useMemo(() => getScrollSetFilters(), [])

  const filteredScrollShop = useMemo(() => {
    const order = new Map(filteredScrolls.map((s, i) => [s.scrollId, i]))
    return SCROLL_NPC
      .filter((i) => i.scrollId && order.has(i.scrollId))
      .sort((a, b) => (order.get(a.scrollId!) ?? 0) - (order.get(b.scrollId!) ?? 0))
  }, [filteredScrolls])

  const equipmentSetFilters = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of EQUIP_NPC) {
      const setId = getShopItemSetId(item)
      const setName = getShopItemSetName(item)
      if (!map.has(setId)) map.set(setId, setName)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [])

  const filteredEquipmentShop = useMemo(() => {
    let items = EQUIP_NPC
    if (equipmentSetFilter !== 'all') {
      items = items.filter((item) => getShopItemSetId(item) === equipmentSetFilter)
    }
    return sortEquipmentShopItems(items)
  }, [equipmentSetFilter])

  const groupedEquipmentShop = useMemo(() => {
    const groups = new Map<string, typeof EQUIP_NPC>()
    for (const item of filteredEquipmentShop) {
      const setName = getShopItemSetName(item)
      const list = groups.get(setName) ?? []
      list.push(item)
      groups.set(setName, list)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'ru'))
  }, [filteredEquipmentShop])

  function renderNpcCard(item: typeof SHOP_ITEMS[0]) {
    const template = item.itemId ? ALL_ITEMS[item.itemId] : null
    const ownedTool = item.toolId && (
      p.ownedTools?.includes(item.toolId)
      || (item.toolId === 'pickaxe' && playerHasTool(p, 'pickaxe'))
      || (item.toolId === 'fishing_rod' && playerHasTool(p, 'fishing_rod'))
    )
    const ownedScroll = item.scrollId && p.unlockedSetScrolls?.includes(item.scrollId)
    const scrollMeta = item.scrollId
      ? SET_SCROLL_PRODUCTS.find((s) => s.scrollId === item.scrollId)
      : null
    const disabled = !!(ownedTool || ownedScroll)
    const bundleLabel = item.resourceBundle
      ? Object.entries(item.resourceBundle)
        .filter(([, v]) => v)
        .map(([rid, v]) => `${RESOURCES[rid as ResourceId].icon}${v}`)
        .join(' ')
      : null
    return (
      <Card key={item.id}>
        <CardContent className="p-3 flex items-center gap-3">
          {template && item.type === 'equipment' ? (
            <EquipmentSlotIcon slot={template.slot as EquipSlot} rarity={template.rarity} size="sm" />
          ) : (
            <div className="text-3xl">{item.icon}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">{item.nameRu}</div>
            <div className="text-[10px] text-slate-400 truncate">{item.descriptionRu}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge className="text-[8px]">{SHOP_TYPE_RU[item.type] ?? item.type}</Badge>
              {ownedTool && <Badge className="text-[8px]">Куплено</Badge>}
              {ownedScroll && <Badge className="text-[8px]">Изучено</Badge>}
              {scrollMeta && (
                <>
                  <Badge variant={scrollMeta.rarity} className="text-[8px]">{RARITY_LABELS_RU[scrollMeta.rarity]}</Badge>
                  <Badge className="text-[8px] border border-aether-border">{scrollMeta.setName}</Badge>
                  {scrollMeta.classLabel && (
                    <Badge className="text-[8px] border border-amber-500/40 text-amber-300">
                      Класс: {scrollMeta.classLabel}
                    </Badge>
                  )}
                </>
              )}
              {template && item.type === 'equipment' && (
                <Badge variant={template.rarity} className="text-[8px]">{RARITY_LABELS_RU[template.rarity]}</Badge>
              )}
              {template?.setName && item.type === 'equipment' && (
                <Badge className="text-[8px] border border-aether-border">{template.setName}</Badge>
              )}
            </div>
            {template && Object.keys(template.stats).length > 0 && (
              <div className="text-[9px] text-aether-cyan mt-0.5">{formatItemStats(template)}</div>
            )}
            {bundleLabel && (
              <div className="text-[9px] text-aether-cyan mt-0.5">{bundleLabel}</div>
            )}
          </div>
          <Button
            variant={item.starsPrice ? 'gold' : 'default'}
            size="sm"
            disabled={disabled}
            onClick={() => buyNpcItem(item)}
          >
            {item.goldPrice && `🪙 ${item.goldPrice}`}
            {item.gemsPrice && `💎 ${item.gemsPrice}`}
            {item.starsPrice && <><Star className="h-3 w-3" /> {item.starsPrice}</>}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{t('shop.title')}</h1>
        <div className="ml-auto text-xs space-y-0.5 text-right">
          <div className="text-aether-gold">🪙 {formatNumber(player.gold)}</div>
          <div className="text-aether-purple">💎 {player.gems}</div>
        </div>
      </div>

      <Tabs defaultValue="buy" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="buy" className="flex-1 text-xs">Купить</TabsTrigger>
          <TabsTrigger value="stars" className="flex-1 text-xs">За Звёзды</TabsTrigger>
          <TabsTrigger value="market" className="flex-1 text-xs">{t('shop.market')}</TabsTrigger>
        </TabsList>

        <TabsContent value="buy">
          <Tabs defaultValue="general">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="general" className="flex-1 text-[10px]">Товары</TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 text-[10px]">Инструменты</TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 text-[10px]">Ресурсы</TabsTrigger>
              <TabsTrigger value="scrolls" className="flex-1 text-[10px]">Свитки</TabsTrigger>
              <TabsTrigger value="equipment" className="flex-1 text-[10px]">Снаряжение</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <div className="space-y-3">{BASE_NPC.map(renderNpcCard)}</div>
            </TabsContent>
            <TabsContent value="tools">
              <p className="text-[10px] text-slate-500 mb-2">Инструменты для профессий, шахты и рыбалки. Улучшенные версии дают бонусы.</p>
              <div className="space-y-3">{TOOL_NPC.map(renderNpcCard)}</div>
            </TabsContent>
            <TabsContent value="resources">
              <p className="text-[10px] text-slate-500 mb-2">Готовые наборы ресурсов для крафта и кухни.</p>
              <div className="space-y-3">{RESOURCE_NPC.map(renderNpcCard)}</div>
            </TabsContent>
            <TabsContent value="scrolls">
              <p className="text-[10px] text-slate-500 mb-2">Свитки на отдельные части сетов — рецепт появится в Кузнице.</p>
              <div className="space-y-2 mb-3">
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {([
                    ['all', 'Все'] as const,
                    ['epic', 'Эпик'] as const,
                    ['legendary', 'Легенда'] as const,
                    ['mythic', 'Мифик'] as const,
                  ]).map(([id, label]) => (
                    <Button
                      key={id}
                      variant={scrollRarityFilter === id ? 'default' : 'secondary'}
                      size="sm"
                      className="h-7 text-[10px] shrink-0"
                      onClick={() => setScrollRarityFilter(id)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  <Button
                    variant={scrollSetFilter === 'all' ? 'default' : 'secondary'}
                    size="sm"
                    className="h-7 text-[10px] shrink-0"
                    onClick={() => setScrollSetFilter('all')}
                  >
                    Все сеты
                  </Button>
                  {scrollSetFilters.map((s) => (
                    <Button
                      key={s.id}
                      variant={scrollSetFilter === s.id ? 'default' : 'secondary'}
                      size="sm"
                      className="h-7 text-[10px] shrink-0"
                      onClick={() => setScrollSetFilter(s.id)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 max-h-[55vh] overflow-y-auto">
                {filteredScrollShop.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Нет свитков по фильтру</p>
                ) : (
                  filteredScrollShop.map(renderNpcCard)
                )}
              </div>
            </TabsContent>
            <TabsContent value="equipment">
              <p className="text-[10px] text-slate-500 mb-2">Обычные и редкие предметы — цена выше, чем с фарма.</p>
              <div className="flex gap-1 overflow-x-auto pb-1 mb-3">
                <Button
                  variant={equipmentSetFilter === 'all' ? 'default' : 'secondary'}
                  size="sm"
                  className="h-7 text-[10px] shrink-0"
                  onClick={() => setEquipmentSetFilter('all')}
                >
                  Все сеты
                </Button>
                {equipmentSetFilters.map((s) => (
                  <Button
                    key={s.id}
                    variant={equipmentSetFilter === s.id ? 'default' : 'secondary'}
                    size="sm"
                    className="h-7 text-[10px] shrink-0"
                    onClick={() => setEquipmentSetFilter(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
              <div className="max-h-[55vh] overflow-y-auto">
                {filteredEquipmentShop.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Нет снаряжения по фильтру</p>
                ) : equipmentSetFilter === 'all' ? (
                  <div className="space-y-4">
                    {groupedEquipmentShop.map(([setName, items]) => (
                      <div key={setName}>
                        <h3 className="text-xs font-medium text-aether-cyan mb-2 sticky top-0 bg-aether-bg/95 py-1 z-[1]">
                          {setName}
                        </h3>
                        <div className="space-y-3">{items.map(renderNpcCard)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">{filteredEquipmentShop.map(renderNpcCard)}</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="stars">
          <p className="text-[10px] text-slate-500 mb-3">
            Донат-магазин Telegram Stars. 1 ⭐ ≈ 1.15 ₽
          </p>

          {activeBuffs.length > 0 && (
            <Card className="mb-3 border-aether-gold/30">
              <CardContent className="p-3">
                <p className="text-[10px] text-aether-gold font-medium mb-1">Активные бонусы:</p>
                {activeBuffs.map((b) => (
                  <p key={b.id} className="text-[10px] text-slate-400">
                    {b.label} · {formatBuffRemaining(b.until)}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {starShopMessage && (
            <div
              className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                starShopMessage.type === 'error'
                  ? 'border-red-500/50 bg-red-500/10 text-red-300'
                  : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {starShopMessage.text}
            </div>
          )}

          {player.vipLevel && player.vipLevel > 0 && (
            <Card className="mb-3 border-aether-purple/40">
              <CardContent className="p-3 text-xs">
                <p className="text-aether-purple font-medium">
                  {getVipTier(player.vipLevel)?.labelRu ?? `VIP ${player.vipLevel}`}
                </p>
                <p className="text-slate-400 mt-1">
                  EXP +{Math.round(getVipMultipliers(player).exp * 100 - 100)}% ·
                  Дроп +{Math.round(getVipMultipliers(player).loot * 100 - 100)}% ·
                  Gold +{Math.round(getVipMultipliers(player).gold * 100 - 100)}%
                </p>
              </CardContent>
            </Card>
          )}

          <h3 className="text-sm font-medium text-white mb-2">Купить</h3>
          <div className="space-y-3 max-h-[62vh] overflow-y-auto">
            {STAR_SHOP_PRODUCTS.filter((product) => {
              if (product.id !== 'vip_upgrade') return true
              return getNextVipLevel(player.vipLevel ?? 0) !== null
            }).map((product) => {
              const vipStars = product.id === 'vip_upgrade'
                ? getVipUpgradeStars(player.vipLevel ?? 0, getNextVipLevel(player.vipLevel ?? 0)!)
                : product.stars
              const nextVip = product.id === 'vip_upgrade' ? getNextVipLevel(player.vipLevel ?? 0) : null
              const nextTier = nextVip ? getVipTier(nextVip) : null
              return (
              <Card key={product.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-3xl">{product.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {product.id === 'vip_upgrade' && nextTier
                        ? `${product.nameRu} → ${nextTier.labelRu}`
                        : product.nameRu}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {product.id === 'vip_upgrade' && nextTier
                        ? `+${Math.round(nextTier.expPct * 100)}% EXP · +${Math.round(nextTier.lootPct * 100)}% дроп · +${Math.round(nextTier.goldPct * 100)}% gold`
                        : product.descriptionRu}
                    </div>
                    <div className="text-[10px] text-aether-gold mt-1">
                      {formatStarsPriceLabel(vipStars)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    disabled={buyingStarId === product.id}
                    onClick={() => handleStarPurchase(product.id)}
                  >
                    <Star className="h-3 w-3" />
                    {buyingStarId === product.id ? '...' : vipStars}
                  </Button>
                </CardContent>
              </Card>
            )})}
          </div>
        </TabsContent>

        <TabsContent value="market">
          {player.marketListings.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">{t('shop.yourListings')}</h3>
              {player.marketListings.map((listing) => {
                const res = listing.resourceId ? RESOURCES[listing.resourceId] : null
                return (
                  <Card key={listing.id} className="mb-2">
                    <CardContent className="p-3 flex items-start gap-3">
                      <span className="text-2xl shrink-0">{listing.item?.icon ?? res?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">
                          {listing.item?.name ?? res?.nameRu}
                          {listing.resourceAmount ? ` ×${listing.resourceAmount}` : ''}
                        </div>
                        {listing.item && <ItemSummary item={listing.item} />}
                        <div className="text-xs text-aether-gold mt-1">🪙 {listing.goldPrice}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => removeMarketListing(listing.id)}>
                        ✕
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <Tabs defaultValue="items">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="items" className="flex-1">Снаряжение</TabsTrigger>
              <TabsTrigger value="resources" className="flex-1">Ресурсы</TabsTrigger>
            </TabsList>

            <TabsContent value="items">
              <Card className="mb-4 border-aether-gold/20">
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-white mb-1">Продать торговцу</h3>
                  <p className="text-[10px] text-slate-500 mb-2">Мгновенно за золото по фиксированной цене.</p>
                  {sellableItems.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">Нет предметов</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[28vh] overflow-y-auto">
                      {sellableItems.filter((i) => (i.sellPrice ?? 0) > 0).map((item) => (
                        <button
                          key={item.instanceId}
                          type="button"
                          onClick={() => handleNpcSellItem(item)}
                          className="p-2 rounded-lg text-left border border-aether-border hover:border-aether-gold/50"
                        >
                          <div className="text-[11px] text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-aether-gold">🪙 {item.sellPrice}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="mb-4">
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-white mb-2">{t('shop.listItem')}</h3>
                  {sellableItems.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Нет предметов для продажи</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {sellableItems.map((item) => (
                          <button
                            key={item.instanceId}
                            type="button"
                            onClick={() => { setSelectedItem(item); setSelectedResource(null) }}
                            className={`p-2 rounded-lg text-left border transition-colors ${
                              selectedItem?.instanceId === item.instanceId
                                ? 'border-aether-cyan bg-aether-cyan/10'
                                : 'border-aether-border hover:border-aether-cyan/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl shrink-0">{item.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] text-white truncate">{item.name}</div>
                                <ItemSummary item={item} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedItem && (
                        <div className="mb-2 p-2 rounded-lg bg-aether-bg border border-aether-border">
                          <p className="text-xs text-white text-center mb-1">{selectedItem.name}</p>
                          <div className="flex justify-center">
                            <ItemSummary item={selectedItem} />
                          </div>
                        </div>
                      )}
                      <input
                        type="number"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-3"
                        placeholder="Цена в золоте"
                        min={1}
                      />
                      <Button className="w-full h-11" disabled={!canListItem} onClick={handleListItem}>
                        Выставить на продажу
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources">
              <Card className="mb-4 border-aether-gold/20">
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-white mb-1">Продать торговцу</h3>
                  <p className="text-[10px] text-slate-500 mb-2">{NPC_SELL_RATE_LABEL}</p>
                  {sellableResources.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Нет ресурсов</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-1 mb-3">
                        {sellableResources.map((id) => {
                          const res = RESOURCES[id]
                          const have = player.resources[id] ?? 0
                          const unitPrice = getNpcSellGold(id, 1)
                          if (unitPrice <= 0) return null
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => { setSelectedResource(id); setSelectedItem(null) }}
                              className={`p-2 rounded-lg text-center border transition-colors ${
                                selectedResource === id
                                  ? 'border-aether-gold bg-aether-gold/10'
                                  : 'border-aether-border hover:border-aether-gold/50'
                              }`}
                            >
                              <div className="text-lg">{res.icon}</div>
                              <div className="text-[8px] text-slate-400">{have}</div>
                              <div className="text-[7px] text-aether-gold">🪙{unitPrice}</div>
                            </button>
                          )
                        })}
                      </div>
                      {selectedResource && getNpcSellGold(selectedResource, 1) > 0 && (
                        <>
                          <p className="text-xs text-slate-400 mb-2 text-center">
                            {RESOURCES[selectedResource].nameRu} · 🪙{getNpcSellGold(selectedResource, parseInt(resourceAmount, 10) || 0)} за {resourceAmount || 0} шт.
                          </p>
                          <input
                            type="number"
                            value={resourceAmount}
                            onChange={(e) => setResourceAmount(e.target.value)}
                            className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-2"
                            placeholder="Количество"
                            min={1}
                          />
                          <Button className="w-full h-11 mb-3" variant="gold" onClick={handleNpcSellResource}>
                            Продать торговцу
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              <Card className="mb-4">
                <CardContent className="p-3">
                  <h3 className="text-sm font-medium text-white mb-2">Продать ресурсы</h3>
                  {sellableResources.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Нет ресурсов для продажи</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-1 mb-3">
                        {sellableResources.map((id) => {
                          const res = RESOURCES[id]
                          const have = player.resources[id] ?? 0
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => { setSelectedResource(id); setSelectedItem(null) }}
                              className={`p-2 rounded-lg text-center border transition-colors ${
                                selectedResource === id
                                  ? 'border-aether-cyan bg-aether-cyan/10'
                                  : 'border-aether-border hover:border-aether-cyan/50'
                              }`}
                            >
                              <div className="text-lg">{res.icon}</div>
                              <div className="text-[8px] text-slate-400">{have}</div>
                            </button>
                          )
                        })}
                      </div>
                      {selectedResource && (
                        <p className="text-xs text-slate-400 mb-2 text-center">
                          {RESOURCES[selectedResource].nameRu} (есть: {player.resources[selectedResource] ?? 0})
                        </p>
                      )}
                      <input
                        type="number"
                        value={resourceAmount}
                        onChange={(e) => setResourceAmount(e.target.value)}
                        className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-2"
                        placeholder="Количество"
                        min={1}
                      />
                      <input
                        type="number"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-3"
                        placeholder="Цена в золоте"
                        min={1}
                      />
                      <Button className="w-full h-11" disabled={!canListResource} onClick={handleListResource}>
                        Выставить ресурсы
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">{t('shop.playerListings')}</h3>
            {marketLoading && marketListings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Загрузка лотов...</p>
            ) : marketListings.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">{t('shop.noListings')}</p>
            ) : (
              marketListings.map((listing) => {
                const res = listing.resourceId ? RESOURCES[listing.resourceId] : null
                return (
                  <Card key={listing.id}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <span className="text-2xl shrink-0">{listing.item?.icon ?? res?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white">
                          {listing.item?.name ?? res?.nameRu}
                          {listing.resourceAmount ? ` ×${listing.resourceAmount}` : ''}
                        </div>
                        {listing.item && <ItemSummary item={listing.item} />}
                        <div className="text-[10px] text-slate-500 mt-0.5">{listing.sellerName}</div>
                        <div className="text-xs text-aether-gold mt-0.5">🪙 {formatNumber(listing.goldPrice)}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="gold"
                        className="shrink-0"
                        disabled={buyingListingId === listing.id || player.gold < listing.goldPrice}
                        onClick={() => handleBuyListing(listing)}
                      >
                        {buyingListingId === listing.id ? '...' : 'Купить'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
