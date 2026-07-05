import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayerStore } from '@/store/playerStore'
import { getMaxEnergy } from '@/lib/playerStats'
import { CONSUMABLE_EFFECTS, getEnergyDrinkStacks, type ConsumableId } from '@/lib/consumables'
import { hapticError, hapticSuccess } from '@/lib/telegram'

export function EnergyDrinkQuickBar() {
  const player = usePlayerStore((s) => s.player)
  const consumeConsumable = usePlayerStore((s) => s.consumeConsumable)

  if (!player) return null

  const maxEnergy = getMaxEnergy(player)
  const stacks = getEnergyDrinkStacks(player.inventory)
  const energyFull = player.energy >= maxEnergy

  function handleDrink(itemId: ConsumableId) {
    if (consumeConsumable(itemId)) hapticSuccess()
    else hapticError()
  }

  return (
    <Card className="border-aether-purple/30 bg-aether-purple/5">
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Энергия</span>
          <span className={energyFull ? 'text-aether-cyan' : 'text-amber-400'}>
            {player.energy} / {maxEnergy}
          </span>
        </div>
        {stacks.length === 0 ? (
          <p className="text-[10px] text-slate-500">Энергетики — в магазине или алхимии</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {stacks.map((stack) => (
              <Button
                key={stack.itemId}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-[11px] flex-1 min-w-[130px] justify-center gap-1"
                disabled={energyFull}
                onClick={() => handleDrink(stack.itemId)}
              >
                <span>{stack.icon}</span>
                <span>+{CONSUMABLE_EFFECTS[stack.itemId].energy}</span>
                <span className="text-slate-400">×{stack.count}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
