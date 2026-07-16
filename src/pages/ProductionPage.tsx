import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Factory } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import {
  ENERGY_GENERATORS, PRODUCTION_MACHINES, PRODUCTION_UNLOCK_FLOOR,
  calcTotalEnergyPerSec, calcJobEnergyCost, calcProductionEnergyCap,
} from '@/data/production'
import { getProductionState } from '@/lib/productionState'
import { RESOURCES } from '@/data/classes'
import { formatNumber } from '@/lib/utils'
import type { ProductionMachineId } from '@/data/production'

function formatDurationMs(ms: number): string {
  const sec = Math.ceil(ms / 1000)
  if (sec < 60) return `${sec}с`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}м ${s}с` : `${m}м`
}

export function ProductionPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const buyEnergyGenerator = usePlayerStore((s) => s.buyEnergyGenerator)
  const buyProductionMachine = usePlayerStore((s) => s.buyProductionMachine)
  const startProductionJob = usePlayerStore((s) => s.startProductionJob)
  const tickProduction = usePlayerStore((s) => s.tickProduction)
  const [, tick] = useState(0)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    tickProduction()
    const id = setInterval(() => {
      tickProduction()
      tick((n) => n + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [tickProduction])

  if (!player) return null

  const unlocked = player.highestFloor >= PRODUCTION_UNLOCK_FLOOR
  const state = getProductionState(player)
  const energyPerSec = calcTotalEnergyPerSec(state.generators)
  const energyCap = calcProductionEnergyCap(state.generators)

  if (!unlocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Factory className="h-12 w-12 text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">
          Производство открывается с {PRODUCTION_UNLOCK_FLOOR} этажа.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/')}>Назад</Button>
      </div>
    )
  }

  function handleBuyGen(id: typeof ENERGY_GENERATORS[0]['id']) {
    if (buyEnergyGenerator(id)) hapticSuccess()
    else hapticError()
  }

  function handleBuyMachine(id: typeof PRODUCTION_MACHINES[0]['id']) {
    if (buyProductionMachine(id)) hapticSuccess()
    else hapticError()
  }

  function handleStart(machineId: ProductionMachineId) {
    if (startProductionJob(machineId)) hapticSuccess()
    else hapticError()
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Производство</h1>
      </div>

      <div className="p-4 space-y-3">
        <Card className="border-yellow-500/30">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-white">{Math.floor(state.energyStored)}/{energyCap}</span>
            </div>
            <Badge className="bg-aether-gold/20 text-aether-gold">{energyPerSec} ⚡/сек</Badge>
          </CardContent>
        </Card>

        <Tabs defaultValue="energy">
          <TabsList className="w-full">
            <TabsTrigger value="energy" className="flex-1 text-xs">Энергия</TabsTrigger>
            <TabsTrigger value="machines" className="flex-1 text-xs">Механизмы</TabsTrigger>
          </TabsList>

          <TabsContent value="energy" className="space-y-2 mt-3">
            {ENERGY_GENERATORS.map((gen) => {
              const owned = state.generators[gen.id] ?? 0
              return (
                <Card key={gen.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-medium text-white">{gen.icon} {gen.nameRu}</div>
                        <div className="text-[10px] text-slate-400">{gen.descriptionRu}</div>
                      </div>
                      <span className="text-xs text-aether-cyan">×{owned}</span>
                    </div>
                    <Button size="sm" className="w-full" onClick={() => handleBuyGen(gen.id)}>
                      Купить · 🪙{formatNumber(gen.goldCost)}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="machines" className="space-y-2 mt-3">
            {PRODUCTION_MACHINES.map((machine) => {
              const owned = state.machines[machine.id] ?? 0
              const energyCost = calcJobEnergyCost(machine)
              const activeJobs = state.jobs.filter((j) => j.machineId === machine.id)
              const inputs = Object.entries(machine.inputs)
                .map(([id, amt]) => `${RESOURCES[id as keyof typeof RESOURCES]?.icon ?? '?'}${amt}`)
                .join(' + ')
              return (
                <Card key={machine.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-sm font-medium text-white">{machine.icon} {machine.nameRu}</div>
                        <div className="text-[10px] text-slate-400">{machine.descriptionRu}</div>
                      </div>
                      <span className="text-xs text-aether-cyan">×{owned}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">
                      {inputs} → {RESOURCES[machine.output]?.icon} · ⚡{energyCost} · {formatDurationMs(machine.durationMs)}
                    </div>
                    {owned < 1 ? (
                      <Button size="sm" className="w-full" variant="secondary" onClick={() => handleBuyMachine(machine.id)}>
                        Купить · 🪙{formatNumber(machine.goldCost)}
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => handleStart(machine.id)}>
                        Запустить ({activeJobs.length}/{owned} занято)
                      </Button>
                    )}
                    {activeJobs.map((job) => {
                      const total = new Date(job.readyAt).getTime() - new Date(job.startedAt).getTime()
                      const left = Math.max(0, new Date(job.readyAt).getTime() - Date.now())
                      const pct = total > 0 ? ((total - left) / total) * 100 : 100
                      return (
                        <div key={job.id} className="mt-2">
                          <Progress value={pct} className="h-1" />
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            {left > 0 ? `Осталось ${formatDurationMs(left)}` : 'Готово!'}
                          </p>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
