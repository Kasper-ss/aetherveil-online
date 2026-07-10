import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResourceCatalog } from '@/components/ui/ResourceCatalog'
import { EnergyDrinkQuickBar } from '@/components/ui/EnergyDrinkQuickBar'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/telegram'
import { RESOURCES } from '@/data/classes'
import { WOOD_RESOURCE_IDS } from '@/data/resourceCatalog'
import {
  ALL_CITY_BUILDING_IDS,
  CITY_GRID_SIZE,
  CITY_MAX_BUILDING_LEVEL,
  CITY_UNLOCK_HINT,
  FOREST_CHOP_ENERGY,
  formatCityBuildTime,
  getCityBuildingDef,
  getCityCellColor,
  getUpgradeGoldCost,
  getUpgradeResourceCosts,
  getUpgradeTimeMs,
  isCityUnlocked,
  type CityBuildingCategory,
  type CityBuildingId,
} from '@/data/cityBuildings'
import { canAffordCityCosts } from '@/lib/cityCosts'
import { getCityBonusDetailLines } from '@/lib/cityBonuses'
import {
  formatCityCountdown,
  getBuildingAt,
  getCityBuildRemainingMs,
  getCityState,
  getPassiveRatesPerHour,
  isCityBuildingReady,
} from '@/lib/cityState'
import type { ResourceId } from '@/types/game'

const CATEGORY_LABELS: Record<CityBuildingCategory, string> = {
  house: 'Дома',
  production: 'Производство',
  decoration: 'Декорации',
}

function groupByCategory(ids: CityBuildingId[]): Record<CityBuildingCategory, CityBuildingId[]> {
  const groups: Record<CityBuildingCategory, CityBuildingId[]> = {
    house: [],
    production: [],
    decoration: [],
  }
  for (const id of ids) {
    groups[getCityBuildingDef(id).category].push(id)
  }
  return groups
}

export function CityPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const startCityBuild = usePlayerStore((s) => s.startCityBuild)
  const upgradeCityBuilding = usePlayerStore((s) => s.upgradeCityBuilding)
  const demolishCityBuilding = usePlayerStore((s) => s.demolishCityBuilding)
  const collectCityPassive = usePlayerStore((s) => s.collectCityPassive)
  const tickCityPassive = usePlayerStore((s) => s.tickCityPassive)
  const performForestChop = usePlayerStore((s) => s.performForestChop)
  const rushCityBuild = usePlayerStore((s) => s.rushCityBuild)

  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null)
  const [buildOpen, setBuildOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [, tick] = useState(0)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    tickCityPassive()
    const id = setInterval(() => {
      tickCityPassive()
      tick((n) => n + 1)
    }, 30_000)
    return () => clearInterval(id)
  }, [tickCityPassive])

  const grouped = useMemo(() => groupByCategory(ALL_CITY_BUILDING_IDS), [])

  if (!player) return null

  if (!isCityUnlocked(player)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="text-5xl">🏙️</div>
        <h1 className="text-lg font-bold">Город закрыт</h1>
        <p className="text-sm text-slate-400">{CITY_UNLOCK_HINT}</p>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </div>
    )
  }

  const cityState = getCityState(player)
  const selectedBuilding = selected ? getBuildingAt(player, selected.x, selected.y) : null
  const bonusLines = getCityBonusDetailLines(player)
  const passiveRates = getPassiveRatesPerHour(player)
  const pendingTotal = Object.values(cityState.pendingPassive).reduce((s, v) => s + (v ?? 0), 0)

  function handleCellClick(x: number, y: number) {
    hapticImpact('light')
    setSelected({ x, y })
    setBuildOpen(true)
  }

  function handleBuild(id: CityBuildingId) {
    if (!selected) return
    const ok = startCityBuild(id, selected.x, selected.y)
    if (ok) {
      hapticSuccess()
      setMsg(`${getCityBuildingDef(id).nameRu} — строительство начато`)
      setBuildOpen(false)
    } else {
      hapticError()
      setMsg('Не хватает ресурсов или золота')
    }
  }

  function handleUpgrade() {
    if (!selected) return
    const ok = upgradeCityBuilding(selected.x, selected.y)
    if (ok) {
      hapticSuccess()
      setMsg('Улучшение начато')
    } else {
      hapticError()
      setMsg('Не удалось улучшить')
    }
  }

  function handleDemolish() {
    if (!selected) return
    if (demolishCityBuilding(selected.x, selected.y)) {
      hapticSuccess()
      setMsg('Постройка снесена')
      setBuildOpen(false)
      setSelected(null)
    }
  }

  async function handleRush() {
    if (!selected) return
    const ok = await rushCityBuild(selected.x, selected.y)
    if (ok) {
      hapticSuccess()
      setMsg('Строительство завершено!')
    } else {
      hapticError()
    }
  }

  function handleCollect() {
    if (collectCityPassive()) {
      hapticSuccess()
      setMsg('Ресурсы собраны')
    } else {
      hapticError()
      setMsg('Нечего собирать')
    }
  }

  function handleChop() {
    const result = performForestChop()
    if (result.ok) {
      hapticSuccess()
      setMsg(`Срублено: +${result.amount} досок`)
    } else {
      hapticError()
      setMsg('Нужна энергия')
    }
  }

  function renderCost(gold: number, resources: Partial<Record<ResourceId, number>>) {
    return (
      <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
        {gold > 0 && <span className="bg-aether-bg px-1.5 py-0.5 rounded">🪙{gold.toLocaleString('ru-RU')}</span>}
        {Object.entries(resources).map(([rid, amt]) => (
          <span key={rid} className="bg-aether-bg px-1.5 py-0.5 rounded">
            {RESOURCES[rid as ResourceId].icon}{amt}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Город</h1>
      </div>

      {msg && <p className="text-xs text-center text-aether-cyan px-4 py-2">{msg}</p>}

      <Tabs defaultValue="city" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="city" className="flex-1 text-xs">Город</TabsTrigger>
          <TabsTrigger value="forest" className="flex-1 text-xs">Лес</TabsTrigger>
          <TabsTrigger value="stats" className="flex-1 text-xs">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="city" className="space-y-3 mt-3">
          <p className="text-[10px] text-slate-500 text-center">
            Сетка {CITY_GRID_SIZE}×{CITY_GRID_SIZE}. Выберите клетку для строительства.
          </p>
          <div
            className="mx-auto border border-aether-border rounded-lg overflow-hidden bg-slate-950/50"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${CITY_GRID_SIZE}, minmax(0, 1fr))`,
              maxWidth: '100%',
              aspectRatio: '1',
            }}
          >
            {Array.from({ length: CITY_GRID_SIZE * CITY_GRID_SIZE }, (_, i) => {
              const x = i % CITY_GRID_SIZE
              const y = Math.floor(i / CITY_GRID_SIZE)
              const placed = getBuildingAt(player, x, y)
              const isSelected = selected?.x === x && selected?.y === y
              const def = placed ? getCityBuildingDef(placed.buildingId as CityBuildingId) : null
              const ready = placed ? isCityBuildingReady(placed) : true
              const color = def ? getCityCellColor(def.category) : 'bg-slate-900/40 border-slate-800/50'
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => handleCellClick(x, y)}
                  className={`aspect-square border-[0.5px] flex items-center justify-center text-[8px] sm:text-[10px] transition-colors ${color} ${isSelected ? 'ring-2 ring-aether-cyan z-10' : ''} ${!ready ? 'opacity-60 animate-pulse' : ''}`}
                  title={def ? `${def.nameRu} ур.${placed?.level}` : `Клетка ${x + 1},${y + 1}`}
                >
                  {def ? def.icon : ''}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] justify-center text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-900/70 border border-amber-700/60" /> Дома</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-900/80 border border-zinc-700/70" /> Производство</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-900/60 border border-emerald-700/50" /> Декор</span>
          </div>
        </TabsContent>

        <TabsContent value="forest" className="space-y-3 mt-3">
          <EnergyDrinkQuickBar />
          <Card>
            <CardContent className="p-4 text-center space-y-3">
              <div className="text-4xl">🌲</div>
              <p className="text-sm text-white font-medium">Лес города</p>
              <p className="text-xs text-slate-400">
                Рубите деревья вручную для досок. Лесопилка автоматизирует производство.
              </p>
              <p className="text-[10px] text-slate-500">⚡{FOREST_CHOP_ENERGY} за рубку · 2–4 доски</p>
              <Button className="w-full" onClick={handleChop}>Рубить деревья</Button>
            </CardContent>
          </Card>
          <ResourceCatalog
            resources={player.resources}
            sections={[{ id: 'wood', titleRu: 'Древесина', resourceIds: WOOD_RESOURCE_IDS }]}
            compact
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-3 mt-3">
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium text-white">Бонусы построек</p>
              {bonusLines.length === 0 ? (
                <p className="text-xs text-slate-500">Постройте здания для бонусов</p>
              ) : (
                bonusLines.map((line) => (
                  <p key={line} className="text-xs text-aether-cyan">{line}</p>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium text-white">Пассивная добыча / час</p>
              {Object.keys(passiveRates).length === 0 ? (
                <p className="text-xs text-slate-500">Постройте Шахту или Лесопилку</p>
              ) : (
                Object.entries(passiveRates).map(([rid, perHour]) => (
                  <p key={rid} className="text-xs text-slate-300">
                    {RESOURCES[rid as ResourceId].icon} {RESOURCES[rid as ResourceId].nameRu}: {perHour.toFixed(1)}/ч
                  </p>
                ))
              )}
              <p className="text-xs text-slate-400">В сундуке: {pendingTotal} ед.</p>
              <Button size="sm" className="w-full" onClick={handleCollect} disabled={pendingTotal <= 0}>
                Собрать ресурсы
              </Button>
            </CardContent>
          </Card>

          <p className="text-[10px] text-slate-500 text-center">
            Построек: {cityState.buildings.length} · Макс. ур. здания: {CITY_MAX_BUILDING_LEVEL}
          </p>
        </TabsContent>
      </Tabs>

      <Dialog open={buildOpen} onOpenChange={setBuildOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBuilding
                ? getCityBuildingDef(selectedBuilding.buildingId as CityBuildingId).nameRu
                : selected
                  ? `Клетка ${selected.x + 1}, ${selected.y + 1}`
                  : 'Строительство'}
            </DialogTitle>
          </DialogHeader>

          {selectedBuilding ? (
            <div className="space-y-3">
              {(() => {
                const def = getCityBuildingDef(selectedBuilding.buildingId as CityBuildingId)
                const ready = isCityBuildingReady(selectedBuilding)
                const remaining = getCityBuildRemainingMs(selectedBuilding)
                return (
                  <>
                    <div className="text-center text-4xl">{def.icon}</div>
                    <p className="text-xs text-slate-400 text-center">{def.descriptionRu}</p>
                    <div className="flex justify-center">
                      <Badge>Ур. {selectedBuilding.level}/{CITY_MAX_BUILDING_LEVEL}</Badge>
                    </div>
                    {!ready && (
                      <p className="text-sm text-amber-400 text-center">
                        Строится: {formatCityCountdown(remaining)}
                      </p>
                    )}
                    {!ready && (
                      <Button variant="gold" className="w-full" onClick={handleRush}>
                        Ускорить за 75 ⭐
                      </Button>
                    )}
                    {ready && selectedBuilding.level < CITY_MAX_BUILDING_LEVEL && (
                      <>
                        <p className="text-xs text-slate-400">Улучшение до ур. {selectedBuilding.level + 1}</p>
                        {renderCost(
                          getUpgradeGoldCost(def, selectedBuilding.level),
                          getUpgradeResourceCosts(def, selectedBuilding.level),
                        )}
                        <p className="text-[10px] text-slate-500">
                          Время: {formatCityBuildTime(getUpgradeTimeMs(def, selectedBuilding.level))}
                        </p>
                        <Button className="w-full" onClick={handleUpgrade}>Улучшить</Button>
                      </>
                    )}
                    <Button variant="outline" className="w-full text-red-400" onClick={handleDemolish}>
                      Снести
                    </Button>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.keys(grouped) as CityBuildingCategory[]).map((cat) => (
                grouped[cat].length > 0 && (
                  <div key={cat}>
                    <p className="text-xs font-medium text-slate-300 mb-2">{CATEGORY_LABELS[cat]}</p>
                    <div className="space-y-2">
                      {grouped[cat].map((id) => {
                        const def = getCityBuildingDef(id)
                        const canAfford = canAffordCityCosts(player, def.goldCost, def.resourceCosts)
                        return (
                          <Card key={id} className={canAfford ? '' : 'opacity-60'}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-2xl">{def.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white">{def.nameRu}</p>
                                  <p className="text-[10px] text-slate-400">{def.descriptionRu}</p>
                                  {renderCost(def.goldCost, def.resourceCosts)}
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    ⏱ {formatCityBuildTime(def.buildTimeMs)}
                                  </p>
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    disabled={!canAfford}
                                    onClick={() => handleBuild(id)}
                                  >
                                    Построить
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
