import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore } from '@/store/playerStore'
import { RESOURCES } from '@/data/classes'
import { createItemInstance } from '@/data/items'
import { hapticSuccess } from '@/lib/telegram'
import type { ResourceId, SecretCaveState } from '@/types/game'

interface SecretCaveModalProps {
  cave: SecretCaveState
  onClose: () => void
}

export function SecretCaveModal({ cave, onClose }: SecretCaveModalProps) {
  const claimDig = usePlayerStore((s) => s.claimSecretCaveDig)
  const player = usePlayerStore((s) => s.player)

  const nextIndex = cave.claimedIndices.length
  const reward = cave.rewards[nextIndex]
  const digsLeft = cave.maxDigs - cave.claimedIndices.length

  function handleDig() {
    if (!reward) return
    claimDig(nextIndex)
    hapticSuccess()
    if (digsLeft <= 1) {
      setTimeout(onClose, 600)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🕳️ Тайная пещера</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400">
          Этаж {cave.floor} · осталось добыч: {digsLeft}
          {cave.chestFound && ' · сундук сокровищ найден!'}
        </p>

        {reward && (
          <Card className="border-aether-gold/40 glow-gold">
            <CardContent className="p-4 space-y-3 text-center">
              <div className="text-4xl">{reward.chestFound ? '🎁' : '⛏️'}</div>
              <p className="text-sm text-white">
                {reward.chestFound ? 'Сундук сокровищ!' : 'Залежи ресурсов'}
              </p>
              {reward.gold > 0 && <p className="text-aether-gold">+{reward.gold} 🪙</p>}
              <div className="flex flex-wrap justify-center gap-1 text-[10px]">
                {Object.entries(reward.resources).map(([id, amt]) => (
                  <span key={id} className="bg-aether-bg px-2 py-1 rounded">
                    {RESOURCES[id as ResourceId]?.icon}{amt}
                  </span>
                ))}
              </div>
              {reward.itemId && createItemInstance(reward.itemId) && (
                <p className="text-aether-cyan text-xs">+ {createItemInstance(reward.itemId)!.name}</p>
              )}
              <Button variant="gold" className="w-full" onClick={handleDig}>
                {reward.chestFound ? 'Открыть' : 'Добыть'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!reward && (
          <p className="text-center text-sm text-slate-400">Пещера исчерпана</p>
        )}

        {player && cave.claimedIndices.length > 0 && (
          <p className="text-[10px] text-center text-slate-500">
            Собрано: {cave.claimedIndices.length}/{cave.maxDigs}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
