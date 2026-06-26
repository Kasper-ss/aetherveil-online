import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'
import { formatNumber } from '@/lib/utils'
import { hapticSuccess } from '@/lib/telegram'
import { getGoldMultiplier, getExpMultiplier } from '@/lib/playerBuffs'

export function IdleRewardModal() {
  const show = useUIStore((s) => s.showIdleReward)
  const setShow = useUIStore((s) => s.setShowIdleReward)
  const idleReward = usePlayerStore((s) => s.idleReward)
  const player = usePlayerStore((s) => s.player)
  const claimIdleRewards = usePlayerStore((s) => s.claimIdleRewards)

  if (!idleReward || !player) return null

  const goldReward = Math.floor(idleReward.gold * getGoldMultiplier(player))
  const expReward = Math.floor(idleReward.exp * getExpMultiplier(player))
  const hasBoost = goldReward > idleReward.gold || expReward > idleReward.exp

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
            <div className="text-lg font-bold text-aether-gold">+{formatNumber(goldReward)}</div>
            <div className="text-xs text-slate-500">Золото</div>
          </div>
          <div className="text-center">
            <div className="text-2xl">⭐</div>
            <div className="text-lg font-bold text-aether-cyan">+{formatNumber(expReward)}</div>
            <div className="text-xs text-slate-500">Опыт</div>
          </div>
        </div>
        {hasBoost && (
          <p className="text-[10px] text-aether-cyan">С учётом активных бонусов (карты судьбы и др.)</p>
        )}
        <Button onClick={handleClaim} className="w-full">Забрать награды</Button>
      </DialogContent>
    </Dialog>
  )
}
