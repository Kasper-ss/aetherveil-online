import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'
import { formatNumber } from '@/lib/utils'
import { hapticSuccess } from '@/lib/telegram'

export function IdleRewardModal() {
  const show = useUIStore((s) => s.showIdleReward)
  const setShow = useUIStore((s) => s.setShowIdleReward)
  const idleReward = usePlayerStore((s) => s.idleReward)
  const claimIdleRewards = usePlayerStore((s) => s.claimIdleRewards)

  if (!idleReward) return null

  function handleClaim() {
    claimIdleRewards()
    hapticSuccess()
    setShow(false)
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="text-center">
        <DialogHeader>
          <div className="text-4xl mb-2">🌙</div>
          <DialogTitle>С возвращением!</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-400">
          Вас не было {idleReward.minutes} мин.
        </p>
        <div className="flex justify-center gap-6 py-4">
          <div className="text-center">
            <div className="text-2xl">🪙</div>
            <div className="text-lg font-bold text-aether-gold">+{formatNumber(idleReward.gold)}</div>
            <div className="text-xs text-slate-500">Золото</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⭐</div>
            <div className="text-lg font-bold text-aether-cyan">+{formatNumber(idleReward.exp)}</div>
            <div className="text-xs text-slate-500">Опыт</div>
          </div>
        </div>
        <Button onClick={handleClaim} className="w-full">Забрать награды</Button>
      </DialogContent>
    </Dialog>
  )
}
