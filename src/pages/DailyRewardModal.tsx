import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'
import { ALL_ITEMS } from '@/data/items'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'

export function DailyRewardModal() {
  const show = useUIStore((s) => s.showDailyReward)
  const setShow = useUIStore((s) => s.setShowDailyReward)
  const canClaim = usePlayerStore((s) => s.canClaimDaily)
  const getPreview = usePlayerStore((s) => s.getDailyRewardPreview)
  const claimDaily = usePlayerStore((s) => s.claimDailyReward)
  const player = usePlayerStore((s) => s.player)

  if (!show || !player) return null

  const preview = getPreview()
  const alreadyClaimed = !canClaim()
  const itemPreview = preview.itemId ? ALL_ITEMS[preview.itemId] : null

  function handleClaim() {
    const res = claimDaily()
    if (res.success) {
      hapticSuccess()
      playSfx('loot')
      setShow(false)
    } else {
      hapticError()
    }
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="text-center">
        <DialogHeader>
          <div className="text-5xl mb-2">🎁</div>
          <DialogTitle>Ежедневная награда</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-slate-400">
          Серия: {player.dailyRewardStreak} дн. · День {(player.dailyRewardStreak % 7) + 1}/7
        </p>

        <div className="flex justify-center gap-6 py-4">
          <div className="text-center">
            <div className="text-2xl">🪙</div>
            <div className="text-lg font-bold text-aether-gold">+{preview.gold}</div>
            <div className="text-xs text-slate-500">Золото</div>
          </div>
          {preview.gems > 0 && (
            <div className="text-center">
              <div className="text-2xl">💎</div>
              <div className="text-lg font-bold text-aether-purple">+{preview.gems}</div>
              <div className="text-xs text-slate-500">Кристаллы</div>
            </div>
          )}
          {itemPreview && (
            <div className="text-center">
              <div className="text-2xl">{itemPreview.icon}</div>
              <div className="text-sm font-bold text-white">{itemPreview.name}</div>
              <div className="text-xs text-slate-500">Предмет</div>
            </div>
          )}
        </div>

        {alreadyClaimed ? (
          <p className="text-sm text-slate-400">Награда уже получена сегодня. Возвращайтесь завтра!</p>
        ) : (
          <Button onClick={handleClaim} className="w-full">
            Забрать награду
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
