import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GemWorkshopPanel } from '@/components/GemWorkshopPanel'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticError, hapticSuccess } from '@/lib/telegram'
import { getProfessionExp, getProfessionRankProgress } from '@/lib/professionProgress'
import { SOCKET_GEMS } from '@/data/socketGems'
import { JEWEL_RESOURCE_IDS } from '@/lib/jewelResources'
import { RESOURCE_SHOP_ITEMS, getNpcSellGold } from '@/data/resourceShop'
import { RESOURCES } from '@/data/classes'
import {
  canStartGemStudy,
  formatGemStudyCountdown,
  GEM_STUDY_DURATION_MS,
  getGemStudyRemainingMs,
  isGemStudied,
  isGemStudying,
} from '@/lib/gemStudy'
import type { Item, ResourceId, SocketGemId } from '@/types/game'

const JEWEL_SHOP_ITEMS = RESOURCE_SHOP_ITEMS.filter(
  (i) => i.id === 'shop_jewel_pack' || i.id === 'shop_jewel_rare',
)

export function JewelerPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const startGemStudy = usePlayerStore((s) => s.startGemStudy)
  const sellResourceToNpc = usePlayerStore((s) => s.sellResourceToNpc)
  const spendGold = usePlayerStore((s) => s.spendGold)
  const spendGems = usePlayerStore((s) => s.spendGems)
  const addResources = usePlayerStore((s) => s.addResources)
  const awardJewelerExp = usePlayerStore((s) => s.awardJewelerExp)
  const tickGemStudies = usePlayerStore((s) => s.tickGemStudies)

  const [gemItem, setGemItem] = useState<Item | null>(null)
  const [sellAmount, setSellAmount] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [, uiTick] = useState(0)

  useTelegramBackButton(() => navigate('/professions/jeweler'), true)

  useEffect(() => {
    tickGemStudies()
    const id = setInterval(() => {
      tickGemStudies()
      uiTick((n) => n + 1)
    }, 15_000)
    return () => clearInterval(id)
  }, [tickGemStudies])

  if (!player) return null

  const profXp = getProfessionExp(player, 'jeweler')
  const profProgress = getProfessionRankProgress(profXp)
  const allGear = [
    ...player.inventory.filter((i) => i.slot !== 'consumable' && i.slot !== 'pet'),
    ...Object.values(player.equipped).filter((i): i is Item => !!i),
  ]

  function handleStudy(gemId: SocketGemId) {
    if (startGemStudy(gemId)) {
      hapticSuccess()
      setMsg(`Изучение «${SOCKET_GEMS.find((g) => g.id === gemId)?.nameRu}» начато (1 ч)`)
    } else {
      hapticError()
      setMsg('Нельзя начать изучение сейчас')
    }
  }

  function handleBuyJewelPack(item: typeof JEWEL_SHOP_ITEMS[0]) {
    if (item.goldPrice && !spendGold(item.goldPrice)) {
      hapticError()
      return
    }
    if (item.gemsPrice && !spendGems(item.gemsPrice)) {
      hapticError()
      return
    }
    if (item.resourceBundle) {
      addResources(item.resourceBundle)
      awardJewelerExp(countJewelsFromBundle(item.resourceBundle) * 8)
    }
    hapticSuccess()
    setMsg(`Куплено: ${item.nameRu}`)
  }

  function countJewelsFromBundle(bundle: Partial<Record<ResourceId, number>>): number {
    return Object.entries(bundle).reduce((s, [rid, amt]) => {
      if (!amt || !rid.startsWith('jewel_')) return s
      return s + amt
    }, 0)
  }

  function handleSellJewel(rid: ResourceId) {
    const amount = parseInt(sellAmount[rid] ?? '1', 10)
    if (!Number.isFinite(amount) || amount < 1) {
      hapticError()
      return
    }
    if (sellResourceToNpc(rid, amount)) {
      hapticSuccess()
      setMsg(`Продано: ${amount} ${RESOURCES[rid].nameRu}`)
    } else {
      hapticError()
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/professions/jeweler')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Ювелирная мастерская</h1>
          <p className="text-[10px] text-slate-400">
            Ранг {profProgress.rank} · {profProgress.intoRank}/{profProgress.needed} XP
          </p>
        </div>
        <Badge className="text-[9px]">💎 Ювелир</Badge>
      </div>

      <div className="px-4 pt-2">
        <Progress value={(profProgress.intoRank / profProgress.needed) * 100} className="h-1.5" />
      </div>

      {msg && <p className="text-xs text-center text-aether-cyan px-4 py-2">{msg}</p>}

      <Tabs defaultValue="workshop" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="workshop" className="flex-1 text-xs">Мастерская</TabsTrigger>
          <TabsTrigger value="study" className="flex-1 text-xs">Изучение</TabsTrigger>
          <TabsTrigger value="trade" className="flex-1 text-xs">Торговля</TabsTrigger>
        </TabsList>

        <TabsContent value="workshop" className="mt-3">
          <GemWorkshopPanel selectedItem={gemItem} onSelectItem={setGemItem} gear={allGear} />
        </TabsContent>

        <TabsContent value="study" className="space-y-2 mt-3">
          <p className="text-[10px] text-slate-400 text-center">
            Изучите камень (1 час), чтобы открыть комбинирование и улучшение. Одно изучение за раз.
          </p>
          {SOCKET_GEMS.map((gem) => {
            const studied = isGemStudied(player, gem.id)
            const studying = isGemStudying(player, gem.id)
            const remaining = getGemStudyRemainingMs(player, gem.id)
            const canStart = canStartGemStudy(player, gem.id)
            return (
              <Card key={gem.id} className={studied ? 'border-aether-cyan/40' : ''}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{gem.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{gem.nameRu}</div>
                    <div className="text-[10px] text-slate-400">
                      {studied && <span className="text-aether-cyan">Изучен</span>}
                      {studying && <span className="text-amber-400">Изучается: {formatGemStudyCountdown(remaining)}</span>}
                      {!studied && !studying && <span>Не изучен</span>}
                    </div>
                  </div>
                  {!studied && !studying && (
                    <Button size="sm" disabled={!canStart} onClick={() => handleStudy(gem.id)}>
                      Изучить
                    </Button>
                  )}
                  {studying && remaining <= 0 && (
                    <Badge className="text-[9px] text-aether-cyan">Готово!</Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
          <p className="text-[9px] text-slate-500 text-center">
            Длительность изучения: {Math.round(GEM_STUDY_DURATION_MS / 60_000)} мин · +12 XP при завершении
          </p>
        </TabsContent>

        <TabsContent value="trade" className="space-y-3 mt-3">
          <p className="text-xs font-medium text-white">Покупка у торговца</p>
          {JEWEL_SHOP_ITEMS.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.nameRu}</p>
                    <p className="text-[10px] text-slate-400">{item.descriptionRu}</p>
                    <p className="text-[10px] text-aether-gold mt-1">
                      {item.goldPrice ? `🪙${item.goldPrice}` : ''}
                      {item.gemsPrice ? ` · 💎${item.gemsPrice}` : ''}
                    </p>
                    <Button size="sm" className="w-full mt-2" onClick={() => handleBuyJewelPack(item)}>
                      Купить (+8 XP за камень)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <p className="text-xs font-medium text-white pt-2">Продажа камней</p>
          {JEWEL_RESOURCE_IDS.map((rid) => {
            const count = player.resources[rid] ?? 0
            const unitGold = getNpcSellGold(rid, 1)
            if (unitGold <= 0) return null
            return (
              <Card key={rid}>
                <CardContent className="p-3 flex items-center gap-2">
                  <span className="text-xl">{RESOURCES[rid].icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{RESOURCES[rid].nameRu}</p>
                    <p className="text-[10px] text-slate-400">×{count} · 🪙{unitGold}/шт · +3 XP/шт</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={count}
                    value={sellAmount[rid] ?? '1'}
                    onChange={(e) => setSellAmount((s) => ({ ...s, [rid]: e.target.value }))}
                    className="w-14 h-8 rounded bg-aether-bg border border-aether-border text-center text-xs"
                  />
                  <Button size="sm" disabled={count < 1} onClick={() => handleSellJewel(rid)}>
                    Продать
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
