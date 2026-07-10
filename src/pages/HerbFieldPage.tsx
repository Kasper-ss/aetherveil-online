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
import { getAlchemyRecipesForPlayer, canBrewAlchemyRecipe, getVisibleHerbalismRecipes, getPendingBrews, needsBrewTimer, findAlchemyRecipe } from '@/data/alchemyPotions'
import { isHerbalismActive } from '@/lib/professionBonuses'
import { RESOURCES } from '@/data/classes'
import { playerHasTool } from '@/data/tools'
import { getProfessionRank, getProfessionExp, getProfessionRankProgress, getGrindLocationXpToUnlock } from '@/lib/professionProgress'
import { RARITY_LABELS_RU } from '@/data/items'
import { HERB_RESOURCE_IDS } from '@/data/resourceCatalog'
import { EnergyDrinkQuickBar } from '@/components/ui/EnergyDrinkQuickBar'
import type { ResourceId } from '@/types/game'

export function HerbFieldPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const performHerbGather = usePlayerStore((s) => s.performHerbGather)
  const brewPotion = usePlayerStore((s) => s.brewPotion)
  const collectReadyBrews = usePlayerStore((s) => s.collectReadyBrews)
  const [selectedLevel, setSelectedLevel] = useState(player?.fieldLevel ?? 1)
  const [lastMsg, setLastMsg] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const unlocked = getUnlockedHerbFieldLevel(player.fieldGatherXp ?? 0)
  const hasTool = playerHasTool(player, 'pickaxe') || player.ownedTools?.includes('herbal_sickle')
  const alchRank = getProfessionRank(getProfessionExp(player, 'alchemist'))
  const alchProgress = getProfessionRankProgress(getProfessionExp(player, 'alchemist'))
  const nextLevel = HERB_FIELD_LEVELS.find((h) => h.level === unlocked + 1)
  const nextUnlockXp = nextLevel ? getGrindLocationXpToUnlock(nextLevel.level) : 0
  const xpToNext = nextLevel ? Math.max(0, nextUnlockXp - (player.fieldGatherXp ?? 0)) : 0
  const recipes = getAlchemyRecipesForPlayer(player)
  const herbalRecipes = getVisibleHerbalismRecipes(player)
  const pendingBrews = getPendingBrews(player)

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
    const recipe = findAlchemyRecipe(recipeId)
    if (brewPotion(recipeId)) {
      hapticSuccess()
      setLastMsg(needsBrewTimer(recipe!) ? 'Варка началась — зелье будет готово через несколько минут.' : 'Зелье сварено!')
    } else {
      hapticError()
      setLastMsg('Не хватает ресурсов, золота или ранга алхимика.')
    }
  }

  function handleCollectBrews() {
    const n = collectReadyBrews()
    if (n > 0) {
      hapticSuccess()
      setLastMsg(`Собрано зелий: ${n}`)
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
          <EnergyDrinkQuickBar />
          <Card>
            <CardContent className="p-3 text-xs text-slate-400 space-y-1">
              <div>Опыт поля: <span className="text-white">{player.fieldGatherXp ?? 0}</span></div>
              <div>Уровней поля: <span className="text-aether-cyan">{unlocked}/5</span></div>
              <div>Ранг алхимика: <span className="text-white">{alchRank}</span> ({alchProgress.intoRank}/{alchProgress.needed} XP)</div>
              {nextLevel && xpToNext > 0 && (
                <>
                  <Progress value={nextUnlockXp > 0 ? ((player.fieldGatherXp ?? 0) / nextUnlockXp) * 100 : 0} className="mt-2" />
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
                    {locked && <div className="text-[9px] text-red-400 mt-1">Нужно {getGrindLocationXpToUnlock(field.level)} XP поля</div>}
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
            HP и энергетики варятся мгновенно. Остальные зелья — с таймером. Редкие рецепты травника видны при активном Травничестве.
          </p>
          {pendingBrews.length > 0 && (
            <Card className="border-amber-500/30">
              <CardContent className="p-3 text-xs space-y-2">
                <p className="text-amber-400">Варится: {pendingBrews.length}</p>
                {pendingBrews.map((b) => {
                  const r = findAlchemyRecipe(b.recipeId)
                  const ms = new Date(b.readyAt).getTime() - Date.now()
                  return (
                    <p key={b.recipeId + b.readyAt} className="text-slate-400">
                      {r?.nameRu} — {ms > 0 ? `${Math.ceil(ms / 60000)} мин.` : 'готово!'}
                    </p>
                  )
                })}
                <Button size="sm" className="w-full" onClick={handleCollectBrews}>Собрать готовые</Button>
              </CardContent>
            </Card>
          )}
          {isHerbalismActive(player) && herbalRecipes.length > 0 && (
            <>
              <p className="text-[10px] text-aether-cyan font-medium">Рецепты травника</p>
              {herbalRecipes.map((recipe) => (
                <Card key={recipe.id} className="border-aether-cyan/30">
                  <CardContent className="p-3">
                    <div className="text-sm font-medium text-white">{recipe.nameRu}</div>
                    <p className="text-[10px] text-slate-400 mb-2">{recipe.descriptionRu}</p>
                    <Button size="sm" className="w-full" disabled={!canBrewAlchemyRecipe(player, recipe)} onClick={() => handleBrew(recipe.id)}>
                      Сварить {recipe.brewTimeMs ? `(${Math.round(recipe.brewTimeMs / 60000)} мин.)` : ''}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
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
                    {recipe.brewTimeMs ? `Варить (${Math.round(recipe.brewTimeMs / 60000)} мин.)` : 'Сварить'}
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
