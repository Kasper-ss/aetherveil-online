import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'
import { formatNumber } from '@/lib/utils'
import { hapticSuccess } from '@/lib/telegram'
import { RESOURCES } from '@/data/classes'
import type { ResourceId } from '@/types/game'

export function PetRewardModal() {
  const show = useUIStore((s) => s.showPetReward)
  const setShow = useUIStore((s) => s.setShowPetReward)
  const petReward = usePlayerStore((s) => s.petReward)
  const claimPetReward = usePlayerStore((s) => s.claimPetReward)

  if (!petReward) return null

  function handleClaim() {
    claimPetReward()
    hapticSuccess()
    setShow(false)
  }

  const resourceEntries = Object.entries(petReward.resources).filter(([, v]) => v && v > 0)

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="text-center max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-4xl mb-2">{petReward.petIcon}</div>
          <DialogTitle>{petReward.petName} принёс дар!</DialogTitle>
        </DialogHeader>
        {petReward.cycles > 1 && (
          <p className="text-sm text-slate-400">
            Накоплено за {petReward.cycles} циклов (каждые 3 ч)
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4 py-4">
          {petReward.gold > 0 && (
            <div className="text-center min-w-[72px]">
              <div className="text-2xl">🪙</div>
              <div className="text-lg font-bold text-aether-gold">+{formatNumber(petReward.gold)}</div>
              <div className="text-xs text-slate-500">Золото</div>
            </div>
          )}
          {resourceEntries.map(([rid, amount]) => {
            const res = RESOURCES[rid as ResourceId]
            return (
              <div key={rid} className="text-center min-w-[72px]">
                <div className="text-2xl">{res?.icon ?? '📦'}</div>
                <div className="text-lg font-bold text-aether-cyan">+{amount}</div>
                <div className="text-xs text-slate-500">{res?.nameRu ?? rid}</div>
              </div>
            )
          })}
          {petReward.items.map((item) => (
            <div key={item.itemId} className="text-center min-w-[72px]">
              <div className="text-2xl">{item.icon}</div>
              <div className="text-lg font-bold text-white">
                {item.count > 1 ? `×${item.count}` : '+1'}
              </div>
              <div className="text-xs text-slate-500">{item.name}</div>
            </div>
          ))}
        </div>
        <Button onClick={handleClaim} className="w-full">Забрать</Button>
      </DialogContent>
    </Dialog>
  )
}
