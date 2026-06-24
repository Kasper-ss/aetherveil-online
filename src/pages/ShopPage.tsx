import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { SHOP_ITEMS } from '@/data/gameData'
import { RESOURCES } from '@/data/classes'
import { ALL_ITEMS, formatItemStats, RARITY_LABELS_RU, SET_DATA } from '@/data/items'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError, hapticImpact, showTelegramAlert } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { formatNumber } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import { createItemInstance } from '@/data/items'
import { ItemSummary } from '@/components/ui/ItemSummary'
import { STAR_SHOP_PRODUCTS, formatStarsPriceLabel } from '@/data/starShop'
import { StarsPaymentError } from '@/lib/starsPayment'
import { getActiveBuffs, formatBuffRemaining } from '@/lib/playerBuffs'
import type { StarProductId } from '@/data/starShop'
import type { Item, ItemRarity, ResourceId, MarketListing } from '@/types/game'
import { fetchServerMarket } from '@/lib/multiplayerSync'

const SHOP_TYPE_RU: Record<string, string> = {
  consumable: 'Расходник',
  cosmetic: 'Косметика',
  convenience: 'Удобство',
  equipment: 'Снаряжение',
}

const BASE_NPC = SHOP_ITEMS.filter((i) => i.type !== 'equipment' && !i.starsPrice)
const EQUIP_NPC = SHOP_ITEMS.filter((i) => i.type === 'equipment')

type RarityFilter = 'all' | ItemRarity
type PriceSort = 'default' | 'asc' | 'desc'
type SetFilter = 'all' | 'none' | string

const RARITY_FILTERS: { id: RarityFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'common', label: 'Обычный' },
  { id: 'rare', label: 'Редкий' },
  { id: 'epic', label: 'Эпический' },
  { id: 'legendary', label: 'Легендарный' },
  { id: 'mythic', label: 'Мифический' },
]

const SET_FILTERS: { id: SetFilter; label: string }[] = [
  { id: 'all', label: 'Все сеты' },
  { id: 'none', label: 'Без сета' },
  ...SET_DATA.map((s) => ({ id: s.id, label: s.name })),
]

export function ShopPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const spendGold = usePlayerStore((s) => s.spendGold)
  const spendGems = usePlayerStore((s) => s.spendGems)
  const listOnMarket = usePlayerStore((s) => s.listOnMarket)
  const listResourceOnMarket = usePlayerStore((s) => s.listResourceOnMarket)
  const removeMarketListing = usePlayerStore((s) => s.removeMarketListing)
  const buyMarketListing = usePlayerStore((s) => s.buyMarketListing)
  const purchaseStarProduct = usePlayerStore((s) => s.purchaseStarProduct)
  const [buyingStarId, setBuyingStarId] = useState<StarProductId | null>(null)
  const [buyingListingId, setBuyingListingId] = useState<string | null>(null)
  const [marketListings, setMarketListings] = useState<MarketListing[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [starShopMessage, setStarShopMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [listPrice, setListPrice] = useState('100')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedResource, setSelectedResource] = useState<ResourceId | null>(null)
  const [resourceAmount, setResourceAmount] = useState('1')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [priceSort, setPriceSort] = useState<PriceSort>('default')
  const [setFilter, setSetFilter] = useState<SetFilter>('all')

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
    if (shopItem.goldPrice && !spendGold(shopItem.goldPrice)) { hapticError(); return }
    if (shopItem.gemsPrice && !spendGems(shopItem.gemsPrice)) { hapticError(); return }
    if (shopItem.itemId) {
      const inst = createItemInstance(shopItem.itemId)
      if (inst) usePlayerStore.getState().addItem(inst)
    }
    hapticSuccess()
    playSfx('loot')
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

  const filteredEquipment = useMemo(() => {
    let items = [...EQUIP_NPC]

    if (rarityFilter !== 'all') {
      items = items.filter((shopItem) => {
        const template = shopItem.itemId ? ALL_ITEMS[shopItem.itemId] : null
        return template?.rarity === rarityFilter
      })
    }

    if (setFilter !== 'all') {
      items = items.filter((shopItem) => {
        const template = shopItem.itemId ? ALL_ITEMS[shopItem.itemId] : null
        if (setFilter === 'none') return !template?.setId
        return template?.setId === setFilter
      })
    }

    if (priceSort === 'asc') {
      items.sort((a, b) => (a.goldPrice ?? 0) - (b.goldPrice ?? 0))
    } else if (priceSort === 'desc') {
      items.sort((a, b) => (b.goldPrice ?? 0) - (a.goldPrice ?? 0))
    }

    return items
  }, [rarityFilter, priceSort, setFilter])

  function cyclePriceSort() {
    setPriceSort((prev) => {
      if (prev === 'default') return 'asc'
      if (prev === 'asc') return 'desc'
      return 'default'
    })
  }

  function renderNpcCard(item: typeof SHOP_ITEMS[0]) {
    const template = item.itemId ? ALL_ITEMS[item.itemId] : null
    return (
      <Card key={item.id}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className="text-3xl">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">{item.nameRu}</div>
            <div className="text-[10px] text-slate-400 truncate">{item.descriptionRu}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge className="text-[8px]">{SHOP_TYPE_RU[item.type] ?? item.type}</Badge>
              {template && (
                <Badge variant={template.rarity} className="text-[8px]">{RARITY_LABELS_RU[template.rarity]}</Badge>
              )}
              {template?.setName && (
                <Badge className="text-[8px] border border-aether-border">{template.setName}</Badge>
              )}
            </div>
            {template && Object.keys(template.stats).length > 0 && (
              <div className="text-[9px] text-aether-cyan mt-0.5">{formatItemStats(template)}</div>
            )}
          </div>
          <Button variant={item.starsPrice ? 'gold' : 'default'} size="sm" onClick={() => buyNpcItem(item)}>
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
              <TabsTrigger value="general" className="flex-1">Товары</TabsTrigger>
              <TabsTrigger value="equipment" className="flex-1">Снаряжение</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <div className="space-y-3">{BASE_NPC.map(renderNpcCard)}</div>
            </TabsContent>
            <TabsContent value="equipment">
              <p className="text-[10px] text-slate-500 mb-2">Обычные и редкие предметы — цена выше, чем с фарма.</p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 shrink-0">Редкость:</span>
                  <Button
                    variant={priceSort === 'default' ? 'secondary' : 'default'}
                    size="sm"
                    className="h-7 text-[10px] shrink-0"
                    onClick={cyclePriceSort}
                  >
                    {priceSort === 'default' && <><ArrowUpDown className="h-3 w-3 mr-1" />Цена</>}
                    {priceSort === 'asc' && <><ArrowUp className="h-3 w-3 mr-1" />Дешевле</>}
                    {priceSort === 'desc' && <><ArrowDown className="h-3 w-3 mr-1" />Дороже</>}
                  </Button>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {RARITY_FILTERS.map((f) => (
                    <Button
                      key={f.id}
                      variant={rarityFilter === f.id ? 'default' : 'secondary'}
                      size="sm"
                      className="h-7 text-[10px] shrink-0"
                      onClick={() => setRarityFilter(f.id)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {SET_FILTERS.map((f) => (
                    <Button
                      key={f.id}
                      variant={setFilter === f.id ? 'default' : 'secondary'}
                      size="sm"
                      className="h-7 text-[10px] shrink-0"
                      onClick={() => setSetFilter(f.id)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto">
                {filteredEquipment.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Нет предметов по выбранным фильтрам</p>
                ) : (
                  filteredEquipment.map(renderNpcCard)
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

          <h3 className="text-sm font-medium text-white mb-2">Купить</h3>
          <div className="space-y-3 max-h-[62vh] overflow-y-auto">
            {STAR_SHOP_PRODUCTS.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-3xl">{product.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{product.nameRu}</div>
                    <div className="text-[10px] text-slate-400">{product.descriptionRu}</div>
                    <div className="text-[10px] text-aether-gold mt-1">
                      {formatStarsPriceLabel(product.stars)}
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
                    {buyingStarId === product.id ? '...' : product.stars}
                  </Button>
                </CardContent>
              </Card>
            ))}
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
