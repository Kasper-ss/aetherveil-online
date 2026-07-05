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
import type { GrindLevel } from '@/lib/professionGrind'
import { getUnlockedGrindLevel } from '@/lib/professionGrind'
import { RESOURCES } from '@/data/classes'
import { playerHasTool } from '@/data/tools'
import type { ProfessionId } from '@/types/game'
import type { ResourceSection } from '@/data/resourceCatalog'

interface GrindResult {
  ok: boolean
  isDouble?: boolean
  isSpecial?: boolean
}

interface ProfessionGrindPageProps {
  title: string
  xpLabel: string
  actionVerb: string
  levels: GrindLevel[]
  xp: number
  selectedLevel: number
  onSelectLevel: (level: number) => void
  professionId: ProfessionId
  requiredTool?: string
  missingToolLabel?: string
  perform: (level: number) => GrindResult
  stockSections?: ResourceSection[]
}

export function ProfessionGrindPage({
  title,
  xpLabel,
  actionVerb,
  levels,
  xp,
  selectedLevel,
  onSelectLevel,
  professionId: _professionId,
  requiredTool,
  missingToolLabel,
  perform,
  stockSections,
}: ProfessionGrindPageProps) {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const [lastMsg, setLastMsg] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const unlocked = getUnlockedGrindLevel(levels, xp)
  const hasTool = !requiredTool || playerHasTool(player, requiredTool)
  const nextLevel = levels.find((l) => l.level === unlocked + 1)
  const xpToNext = nextLevel ? nextLevel.xpToUnlock - xp : 0
  const selected = levels.find((l) => l.level === selectedLevel) ?? levels[0]

  function handleAction() {
    const result = perform(selectedLevel)
    if (result.ok) {
      hapticSuccess()
      if (result.isSpecial) setLastMsg(`${selected.specialLabelRu}! Тройная добыча!`)
      else if (result.isDouble) setLastMsg('Двойная добыча!')
      else setLastMsg('Успешно.')
    } else {
      hapticError()
      setLastMsg('Нужны инструмент и энергия.')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      <Tabs defaultValue="grind" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="grind" className="flex-1 text-xs">{actionVerb}</TabsTrigger>
          {stockSections && stockSections.length > 0 && (
            <TabsTrigger value="stock" className="flex-1 text-xs">Запасы</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="grind" className="space-y-3 mt-3">
          <Card>
            <CardContent className="p-3 text-xs text-slate-400 space-y-1">
              <div>{xpLabel}: <span className="text-white">{xp}</span></div>
              <div>Разблокировано уровней: <span className="text-aether-cyan">{unlocked}/{levels.length}</span></div>
              {nextLevel && xpToNext > 0 && (
                <>
                  <Progress value={(xp / nextLevel.xpToUnlock) * 100} className="mt-2" />
                  <div>До «{nextLevel.nameRu}»: {xpToNext} XP</div>
                </>
              )}
              {!hasTool && missingToolLabel && <div className="text-red-400">{missingToolLabel}</div>}
            </CardContent>
          </Card>

          {lastMsg && <p className="text-xs text-center text-aether-cyan">{lastMsg}</p>}

          <div className="space-y-2">
            {levels.map((lvl) => {
              const locked = lvl.level > unlocked
              const isSelected = selectedLevel === lvl.level
              const topDrop = lvl.drops[0]?.resource
              return (
                <Card
                  key={lvl.level}
                  className={`${isSelected ? 'border-aether-cyan' : ''} ${locked ? 'opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !locked && onSelectLevel(lvl.level)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white">{lvl.nameRu}</span>
                      <Badge className="text-[9px]">Ур.{lvl.level}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ⚡{lvl.energyCost} · x2 {Math.round(lvl.doubleChance * 100)}% · {lvl.specialLabelRu.toLowerCase()} {Math.round(lvl.specialChance * 100)}%
                    </div>
                    {topDrop && (
                      <div className="text-[10px] text-aether-cyan mt-1">
                        {RESOURCES[topDrop].icon} {RESOURCES[topDrop].nameRu}
                        {lvl.drops.length > 1 && ` +${lvl.drops.length - 1}`}
                      </div>
                    )}
                    {locked && <div className="text-[9px] text-red-400 mt-1">Нужно {lvl.xpToUnlock} XP</div>}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Button className="w-full" onClick={handleAction} disabled={!hasTool}>
            {actionVerb} (ур. {selectedLevel})
          </Button>
        </TabsContent>

        {stockSections && stockSections.length > 0 && (
          <TabsContent value="stock" className="mt-3">
            <ResourceCatalog resources={player.resources} sections={stockSections} compact />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
