import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ResourceCatalog } from '@/components/ui/ResourceCatalog'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import { FISH_TABLE, FISHING_ENERGY_COST, RARITY_FISH_COLORS } from '@/data/fishing'
import { playerHasTool } from '@/data/tools'
import { RARITY_LABELS_RU } from '@/data/items'
import { FISH_RESOURCE_IDS } from '@/data/resourceCatalog'
import { RESOURCES } from '@/data/classes'

export function FishingPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const performFishing = usePlayerStore((s) => s.performFishing)
  const [lastCatch, setLastCatch] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const hasRod = playerHasTool(player, 'fishing_rod')
  const baitCount = player.inventory.filter((i) => i.id === 'fishing_bait').length

  function handleFish() {
    const result = performFishing()
    if (result.ok) {
      hapticSuccess()
      if (result.junk) setLastCatch('Пойман мусор...')
      else setLastCatch(`Поймана: ${result.fishName}!`)
    } else {
      hapticError()
      setLastCatch('Нужны удочка, наживка и энергия.')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Рыбалка</h1>
      </div>

      <Tabs defaultValue="fish" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="fish" className="flex-1 text-xs">Заброс</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 text-xs">Улов</TabsTrigger>
        </TabsList>

        <TabsContent value="fish" className="space-y-3 mt-3">
          <Card>
            <CardContent className="p-3 text-xs space-y-1">
              <div className="text-slate-400">Поймано рыбы: <span className="text-white">{player.fishCaughtTotal ?? 0}</span></div>
              <div className="text-slate-400">Наживка: <span className="text-white">×{baitCount}</span></div>
              <div className="text-slate-400">Стоимость заброса: ⚡{FISHING_ENERGY_COST} + 1 наживка</div>
              {!hasRod && <div className="text-red-400">Купите удочку в магазине</div>}
            </CardContent>
          </Card>

          {lastCatch && <p className="text-sm text-center text-aether-cyan">{lastCatch}</p>}

          <Button className="w-full" size="lg" onClick={handleFish} disabled={!hasRod || baitCount < 1}>
            Забросить удочку
          </Button>

          <h2 className="text-sm font-semibold text-white pt-2">Справочник рыбы (15 видов)</h2>
          <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
            {FISH_TABLE.map((fish) => {
              const count = player.resources[fish.id] ?? 0
              return (
                <Card key={fish.id} className={count <= 0 ? 'opacity-60' : ''}>
                  <CardContent className="p-2 flex items-center justify-between gap-2">
                    <span className={`text-xs ${RARITY_FISH_COLORS[fish.rarity]}`}>{fish.nameRu}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold ${count > 0 ? 'text-aether-cyan' : 'text-slate-600'}`}>×{count}</span>
                      <Badge variant={fish.rarity} className="text-[8px]">{RARITY_LABELS_RU[fish.rarity]}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            <Card className={(player.resources.fishing_junk ?? 0) <= 0 ? 'opacity-60' : ''}>
              <CardContent className="p-2 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">{RESOURCES.fishing_junk.nameRu}</span>
                <span className={`text-xs font-bold ${(player.resources.fishing_junk ?? 0) > 0 ? 'text-aether-cyan' : 'text-slate-600'}`}>
                  ×{player.resources.fishing_junk ?? 0}
                </span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="mt-3">
          <ResourceCatalog
            resources={player.resources}
            sections={[{ id: 'fish', titleRu: 'Рыба', resourceIds: FISH_RESOURCE_IDS }]}
            compact
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
