import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ResourceCatalog } from '@/components/ui/ResourceCatalog'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import { MINE_LEVELS, getUnlockedMineLevel } from '@/data/mineLevels'
import { getGrindLocationXpToUnlock } from '@/lib/professionProgress'
import { playerHasTool } from '@/data/tools'
import { RESOURCES } from '@/data/classes'
import { ORE_RESOURCE_IDS } from '@/data/resourceCatalog'
import { EnergyDrinkQuickBar } from '@/components/ui/EnergyDrinkQuickBar'

export function MinePage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const performMineDig = usePlayerStore((s) => s.performMineDig)
  const [selectedLevel, setSelectedLevel] = useState(player?.mineLevel ?? 1)
  const [lastMsg, setLastMsg] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const unlocked = getUnlockedMineLevel(player.mineDigXp ?? 0)
  const hasPick = playerHasTool(player, 'pickaxe')
  const nextLevel = MINE_LEVELS.find((m) => m.level === unlocked + 1)
  const nextUnlockXp = nextLevel ? getGrindLocationXpToUnlock(nextLevel.level) : 0
  const xpToNext = nextLevel ? Math.max(0, nextUnlockXp - (player.mineDigXp ?? 0)) : 0

  function handleDig() {
    const result = performMineDig(selectedLevel)
    if (result.ok) {
      hapticSuccess()
      if (result.isVein) setLastMsg('Большая жила! Тройная добыча!')
      else if (result.isDouble) setLastMsg('Двойная добыча!')
      else setLastMsg('Руда добыта.')
    } else {
      hapticError()
      setLastMsg('Нужны кирка и энергия.')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Шахта</h1>
      </div>

      <Tabs defaultValue="dig" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="dig" className="flex-1 text-xs">Добыча</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 text-xs">Запасы руды</TabsTrigger>
        </TabsList>

        <TabsContent value="dig" className="space-y-3 mt-3">
          <EnergyDrinkQuickBar />
          <Card>
            <CardContent className="p-3 text-xs text-slate-400 space-y-1">
              <div>Опыт шахты: <span className="text-white">{player.mineDigXp ?? 0}</span></div>
              <div>Разблокировано уровней: <span className="text-aether-cyan">{unlocked}/6</span></div>
              {nextLevel && xpToNext > 0 && (
                <>
                  <Progress value={nextUnlockXp > 0 ? ((player.mineDigXp ?? 0) / nextUnlockXp) * 100 : 0} className="mt-2" />
                  <div>До «{nextLevel.nameRu}»: {xpToNext} XP</div>
                </>
              )}
              {!hasPick && <div className="text-red-400">Купите кирку в магазине</div>}
              {!hasPick && <div className="text-red-400">Нужна кирка</div>}
            </CardContent>
          </Card>

          {lastMsg && <p className="text-xs text-center text-aether-cyan">{lastMsg}</p>}

          <div className="space-y-2">
            {MINE_LEVELS.map((mine) => {
              const locked = mine.level > unlocked
              const selected = selectedLevel === mine.level
              return (
                <Card
                  key={mine.level}
                  className={`${selected ? 'border-aether-cyan' : ''} ${locked ? 'opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !locked && setSelectedLevel(mine.level)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white">{mine.nameRu}</span>
                      <Badge className="text-[9px]">Ур.{mine.level}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ⚡{mine.energyCost} · x2 {Math.round(mine.doubleChance * 100)}% · жила {Math.round(mine.veinChance * 100)}%
                    </div>
                    <div className="text-[10px] text-aether-cyan mt-1">
                      {RESOURCES[mine.primaryResource].icon} {RESOURCES[mine.primaryResource].nameRu}
                    </div>
                    {locked && <div className="text-[9px] text-red-400 mt-1">Нужно {getGrindLocationXpToUnlock(mine.level)} XP шахты</div>}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Button className="w-full" onClick={handleDig} disabled={!hasPick}>
            Копать (ур. {selectedLevel})
          </Button>
        </TabsContent>

        <TabsContent value="stock" className="mt-3">
          <ResourceCatalog
            resources={player.resources}
            sections={[{ id: 'ore', titleRu: 'Руда', resourceIds: ORE_RESOURCE_IDS }]}
            compact
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
