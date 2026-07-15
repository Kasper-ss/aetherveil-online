import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayerStore } from '@/store/playerStore'
import { getClassesForRace, canPickClass, getClassData } from '@/data/classes'
import { hapticImpact, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import type { PlayerClass } from '@/types/game'

const DUAL_CLASS_UNLOCK_FLOOR = 10

export function SecondaryClassSelectModal() {
  const player = usePlayerStore((s) => s.player)
  const selectSecondaryClass = usePlayerStore((s) => s.selectSecondaryClass)
  const [selected, setSelected] = useState<PlayerClass | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const canUnlock = Boolean(
    player?.classSelected
    && player.classId
    && !player.secondaryClassId
    && player.highestFloor >= DUAL_CLASS_UNLOCK_FLOOR,
  )
  const show = canUnlock && !dismissed

  if (!show || !player?.raceId || !player.classId) return null

  const classes = getClassesForRace(player.raceId).filter((c) => c.id !== player.classId)
  const primaryName = getClassData(player.classId).nameRu

  function handleConfirm() {
    if (!selected || !canPickClass(player!.raceId!, selected)) return
    selectSecondaryClass(selected)
    hapticSuccess()
    playSfx('skill')
    setDismissed(true)
  }

  return (
    <Dialog open={show} onOpenChange={(o) => !o && setDismissed(true)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Двойной класс</DialogTitle>
          <p className="text-xs text-slate-400">
            Достигнув {DUAL_CLASS_UNLOCK_FLOOR} этажа, вы можете освоить второй класс.
            Основной: <span className="text-aether-cyan">{primaryName}</span> — выберите дополнительный для новых навыков.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className={`cursor-pointer transition-all active:scale-95 ${
                selected === cls.id ? 'border-aether-purple glow-purple' : ''
              }`}
              onClick={() => { setSelected(cls.id); hapticImpact('light') }}
            >
              <CardContent className="p-3 text-center">
                <div className="text-3xl mb-1">{cls.icon}</div>
                <div className="text-sm font-bold text-white">{cls.nameRu}</div>
                <div className="text-[9px] text-slate-400 mt-1 line-clamp-2">{cls.descriptionRu}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" disabled={!selected} onClick={handleConfirm}>
          Подтвердить второй класс
        </Button>
        <Button variant="ghost" className="w-full text-xs" onClick={() => setDismissed(true)}>
          Позже
        </Button>
      </DialogContent>
    </Dialog>
  )
}
