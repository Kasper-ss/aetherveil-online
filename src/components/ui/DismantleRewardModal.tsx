import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RESOURCES } from '@/data/classes'
import { formatNumber } from '@/lib/utils'
import type { DismantleSummary } from '@/store/playerStore'
import type { ResourceId } from '@/types/game'

interface DismantleRewardModalProps {
  open: boolean
  onClose: () => void
  summary: DismantleSummary | null
}

export function DismantleRewardModal({ open, onClose, summary }: DismantleRewardModalProps) {
  if (!open || !summary) return null

  const resourceEntries = (Object.entries(summary.resources) as [ResourceId, number][])
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="text-4xl mb-2 text-center">🔨</div>
          <DialogTitle className="text-center">Разбор завершён</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400 text-center">
          Разобрано предметов: {summary.count}
        </p>
        <div className="space-y-2 my-3">
          {summary.gold > 0 && (
            <div className="flex items-center justify-between text-sm bg-aether-bg rounded-lg px-3 py-2">
              <span className="text-slate-300">🪙 Золото</span>
              <span className="text-aether-gold font-mono font-semibold">+{formatNumber(summary.gold)}</span>
            </div>
          )}
          {resourceEntries.map(([id, amount]) => (
            <div
              key={id}
              className="flex items-center justify-between text-sm bg-aether-bg rounded-lg px-3 py-2"
            >
              <span className="text-slate-300">
                {RESOURCES[id].icon} {RESOURCES[id].nameRu}
              </span>
              <span className="text-aether-cyan font-mono font-semibold">+{formatNumber(amount)}</span>
            </div>
          ))}
          {summary.gold <= 0 && resourceEntries.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-2">Материалы не получены</p>
          )}
        </div>
        <Button className="w-full" onClick={onClose}>Понятно</Button>
      </DialogContent>
    </Dialog>
  )
}
