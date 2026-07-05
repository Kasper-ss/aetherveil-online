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
import { HERB_FIELD_LEVELS, getUnlockedHerbFieldLevel } from '@/data/herbField'
import { getAlchemyRecipesForPlayer, canBrewAlchemyRecipe } from '@/data/alchemyPotions'
import { RESOURCES } from '@/data/classes'
import { playerHasTool } from '@/data/tools'
import { getProfessionRank, getProfessionExp, getProfessionRankProgress } from '@/lib/professionProgress'
import { RARITY_LABELS_RU } from '@/data/items'
import { HERB_RESOURCE_IDS } from '@/data/resourceCatalog'
import type { ResourceId } from '@/types/game'

export function HerbFieldPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const performHerbGather = usePlayerStore((s) => s.performHerbGather)
  const brewPotion = usePlayerStore((s) => s.brewPotion)
  const [selectedLevel, setSelectedLevel] = useState(player?.fieldLevel ?? 1)
  const [lastMsg, setLastMsg] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const unlocked = getUnlockedHerbFieldLevel(player.fieldGatherXp ?? 0)
  const hasTool = playerHasTool(player, 'pickaxe') || player.ownedTools?.includes('herbal_sickle')
  const alchRank = getProfessionRank(getProfessionExp(player, 'alchemist'))
  const alchProgress = getProfessionRankProgress(getProfessionExp(player, 'alchemist'))
  const nextLevel = HERB_FIELD_LEVELS.find((h) => h.level === unlocked + 1)
  const xpToNext = nextLevel ? nextLevel.xpToUnlock - (player.fieldGatherXp ?? 0) : 0
  const recipes = getAlchemyRecipesForPlayer(player)

  function handleGather() {
    const result = performHerbGather(selectedLevel)
    if (result.ok) {
      hapticSuccess()
      setLastMsg(result.isBonus ? 'Двойной урожай трав!' : 'Травы собраны.')
    } else {
      hapticError()
      setLastMsg('Нужны серп/кирка, активный Алхимик и энергия.')
    }
  }

  function handleBrew(recipeId: string) {
    if (brewPotion(recipeId)) {
      hapticSuccess()
      setLastMsg('Зелье сварено!')
    } else {
      hapticError()
      setLastMsg('Не хватает ресурсов, золота или ранга алхимика.')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Поле трав</h1>
      </div>

      <Tabs defaultValue="gather" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="gather" className="flex-1 text-xs">Сбор</TabsTrigger>
          <TabsTrigger value="alchemy" className="flex-1 text-xs">Алхимия</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 text-xs">Запасы</TabsTrigger>
        </TabsList>

        <TabsContent value="gather" className="space-y-3 mt-3">
          <Card>
            <CardContent className="p-3 text-xs text-slate-400 space-y-1">
              <div>Опыт поля: <span className="text-white">{player.fieldGatherXp ?? 0}</span></div>
              <div>Уровней поля: <span className="text-aether-cyan">{unlocked}/5</span></div>
              <div>Ранг алхимика: <span className="text-white">{alchRank}</span> ({alchProgress.intoRank}/{alchProgress.needed} XP)</div>
              {nextLevel && xpToNext > 0 && (
                <>
                  <Progress value={((player.fieldGatherXp ?? 0) / nextLevel.xpToUnlock) * 100} className="mt-2" />
                  <div>До «{nextLevel.nameRu}»: {xpToNext} XP</div>
                </>
              )}
              {!hasTool && <div className="text-red-400">Купите серп травника или кирку</div>}
              {!hasTool && <div className="text-red-400">Нужен серп или кирка</div>}
            </CardContent>
          </Card>

          {lastMsg && <p className="text-xs text-center text-aether-cyan">{lastMsg}</p>}

          <div className="space-y-2">
            {HERB_FIELD_LEVELS.map((field) => {
              const locked = field.level > unlocked
              const selected = selectedLevel === field.level
              const herb = RESOURCES[field.primaryHerb]
              return (
                <Card
                  key={field.level}
                  className={`${selected ? 'border-aether-cyan' : ''} ${locked ? 'opacity-50' : 'cursor-pointer'}`}
                  onClick={() => !locked && setSelectedLevel(field.level)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white">{field.nameRu}</span>
                      <Badge className="text-[9px]">Ур.{field.level}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ⚡{field.energyCost} · бонус {Math.round(field.bonusChance * 100)}%
                    </div>
                    <div className="text-[10px] text-aether-cyan mt-1">
                      {herb.icon} {herb.nameRu}
                    </div>
                    {locked && <div className="text-[9px] text-red-400 mt-1">Нужно {field.xpToUnlock} XP поля</div>}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Button className="w-full" onClick={handleGather} disabled={!hasTool}>
            Собрать (ур. {selectedLevel})
          </Button>
        </TabsContent>

        <TabsContent value="alchemy" className="space-y-3 mt-3">
          <p className="text-[10px] text-slate-500">
            Обычные и редкие зелья доступны всем. Эпические и легендарные — только с активным Алхимиком и высоким рангом.
          </p>
          {recipes.map((recipe) => {
            const locked = !canBrewAlchemyRecipe(player, recipe)
            return (
              <Card key={recipe.id} className={locked ? 'opacity-60' : ''}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <div className="text-sm font-medium text-white">{recipe.nameRu}</div>
                      <p className="text-[10px] text-slate-400">{recipe.descriptionRu}</p>
                    </div>
                    <Badge variant={recipe.rarity} className="text-[8px] shrink-0">{RARITY_LABELS_RU[recipe.rarity]}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] mb-2">
                    {Object.entries(recipe.resources).map(([rid, amt]) => (
                      <span key={rid} className="bg-aether-bg px-1.5 py-0.5 rounded">
                        {RESOURCES[rid as ResourceId].icon}{amt}
                      </span>
                    ))}
                    <span className="bg-aether-bg px-1.5 py-0.5 rounded">🪙{recipe.goldCost}</span>
                  </div>
                  {recipe.minAlchemistRank && locked && (
                    <p className="text-[9px] text-amber-400 mb-2">Нужен алхимик ранг {recipe.minAlchemistRank}+</p>
                  )}
                  <Button size="sm" className="w-full" disabled={locked} onClick={() => handleBrew(recipe.id)}>
                    Сварить
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="stock" className="mt-3">
          <ResourceCatalog
            resources={player.resources}
            sections={[{ id: 'herbs', titleRu: 'Травы', resourceIds: HERB_RESOURCE_IDS }]}
            compact
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
