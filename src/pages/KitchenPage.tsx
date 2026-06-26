import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MissingResourcesModal } from '@/components/ui/MissingResourcesModal'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import { getKitchenRecipesForPlayer } from '@/data/kitchenRecipes'
import { RESOURCES } from '@/data/classes'
import { RARITY_LABELS_RU } from '@/data/items'
import { getMissingCosts, type MissingCost } from '@/lib/craftCosts'
import { getActiveEffects, formatEffectRemaining } from '@/lib/activeEffects'

export function KitchenPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const cookFood = usePlayerStore((s) => s.cookFood)
  const [missingModal, setMissingModal] = useState<{ title: string; missing: MissingCost[] } | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const recipes = getKitchenRecipesForPlayer(player.classId)
  const activeFoodBuffs = getActiveEffects(player).filter((e) => e.id.startsWith('food_'))

  function handleCook(recipeId: string, name: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    const missing = getMissingCosts(player!, recipe.goldCost, recipe.resources)
    if (missing.length > 0) {
      setMissingModal({ title: `Недостаточно для «${name}»`, missing })
      hapticError()
      return
    }
    if (cookFood(recipeId)) hapticSuccess()
    else hapticError()
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <MissingResourcesModal
        open={!!missingModal}
        title={missingModal?.title ?? ''}
        missing={missingModal?.missing ?? []}
        onClose={() => setMissingModal(null)}
      />

      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Кухня</h1>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[10px] text-slate-500">
          Готовьте еду с баффами. Рецепты дешевле для вашего класса. Еду съешьте в инвентаре.
        </p>

        {activeFoodBuffs.length > 0 && (
          <Card className="border-aether-gold/40">
            <CardContent className="p-3">
              <p className="text-xs text-aether-gold mb-1">Активные баффы еды:</p>
              {activeFoodBuffs.map((e) => (
                <div key={e.id} className="text-[10px] text-slate-400">
                  {e.label} — {formatEffectRemaining(e.until)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {recipes.map((recipe) => {
          const costParts = [`🪙${recipe.goldCost}`]
          for (const [rid, amount] of Object.entries(recipe.resources)) {
            if (amount) costParts.push(`${RESOURCES[rid as keyof typeof RESOURCES].icon}${amount}`)
          }
          return (
            <Card key={recipe.id}>
              <CardContent className="p-3">
                <div className="flex gap-2 items-start">
                  <span className="text-2xl">{recipe.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{recipe.nameRu}</span>
                      <Badge variant={recipe.rarity} className="text-[8px]">{RARITY_LABELS_RU[recipe.rarity]}</Badge>
                    </div>
                    <div className="text-[10px] text-slate-400">{recipe.descriptionRu}</div>
                    <div className="text-[10px] text-aether-cyan mt-1">{costParts.join(' · ')}</div>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-2" onClick={() => handleCook(recipe.id, recipe.nameRu)}>
                  Приготовить
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
