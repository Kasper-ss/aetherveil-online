import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'
import { ALLOC_STAT_LABELS, ALLOC_STAT_PER_POINT } from '@/lib/playerStats'
import { hapticSuccess, hapticError, hapticImpact } from '@/lib/telegram'
import type { AllocStatKey } from '@/types/game'

const STAT_HINTS: Record<AllocStatKey, string> = {
  atk: `+${ALLOC_STAT_PER_POINT.atk} АТК за очко`,
  hp: `+${ALLOC_STAT_PER_POINT.hp} HP за очко`,
  def: `+${ALLOC_STAT_PER_POINT.def} ЗАЩ за очко`,
  stealth: '+1 СКР и +0.5% КРИТ за очко',
  endurance: '+3 макс. энергии, быстрее восстановление',
}

export function StatDistributionModal() {
  const show = useUIStore((s) => s.showStatDistribution)
  const setShow = useUIStore((s) => s.setShowStatDistribution)
  const player = usePlayerStore((s) => s.player)
  const allocateStat = usePlayerStore((s) => s.allocateStat)
  const [pending, setPending] = useState<Record<AllocStatKey, number>>({
    atk: 0, hp: 0, def: 0, stealth: 0, endurance: 0,
  })

  if (!show || !player) return null

  const pendingTotal = Object.values(pending).reduce((s, v) => s + v, 0)
  const canApply = pendingTotal > 0 && pendingTotal <= player.statPoints

  function adjust(key: AllocStatKey, delta: number) {
    setPending((prev) => {
      const next = { ...prev, [key]: Math.max(0, prev[key] + delta) }
      const total = Object.values(next).reduce((s, v) => s + v, 0)
      if (total > player!.statPoints) return prev
      return next
    })
    hapticImpact('light')
  }

  function handleApply() {
    if (!canApply) { hapticError(); return }
    for (const [key, pts] of Object.entries(pending) as [AllocStatKey, number][]) {
      for (let i = 0; i < pts; i++) allocateStat(key, 1)
    }
    setPending({ atk: 0, hp: 0, def: 0, stealth: 0, endurance: 0 })
    hapticSuccess()
  }

  function handleClose(open: boolean) {
    if (!open) {
      setPending({ atk: 0, hp: 0, def: 0, stealth: 0, endurance: 0 })
      setShow(false)
    }
  }

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Распределение характеристик</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400 text-center">
          Свободных очков: <span className="text-aether-cyan font-bold">{player.statPoints - pendingTotal}</span>
          {pendingTotal > 0 && <span className="text-aether-gold"> · к распределению: {pendingTotal}</span>}
        </p>
        <p className="text-[10px] text-slate-500 text-center mb-2">
          За каждый уровень +5 очков. Прокачка без лимита.
        </p>

        <div className="space-y-2">
          {(Object.keys(ALLOC_STAT_LABELS) as AllocStatKey[]).map((key) => (
            <div key={key} className="bg-aether-bg rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white">{ALLOC_STAT_LABELS[key]}</span>
                <span className="text-xs text-aether-cyan">
                  Ур. {player.allocatedStats[key] ?? 0}
                  {pending[key] > 0 && <span className="text-aether-gold"> +{pending[key]}</span>}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2">{STAT_HINTS[key]}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => adjust(key, -1)} disabled={pending[key] <= 0}>−</Button>
                <Button size="sm" className="flex-1" onClick={() => adjust(key, 1)} disabled={player.statPoints - pendingTotal <= 0}>+</Button>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full mt-2" onClick={handleApply} disabled={!canApply}>
          Применить ({pendingTotal})
        </Button>
      </DialogContent>
    </Dialog>
  )
}
