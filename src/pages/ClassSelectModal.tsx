import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayerStore } from '@/store/playerStore'
import { getClassesForRace, canPickClass } from '@/data/classes'
import { getRaceData } from '@/data/races'
import { hapticImpact, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import type { PlayerClass } from '@/types/game'

export function ClassSelectModal() {
  const player = usePlayerStore((s) => s.player)
  const selectClass = usePlayerStore((s) => s.selectClass)
  const [selected, setSelected] = useState<PlayerClass | null>(null)

  const show = !!player && player.raceSelected && !player.classSelected
  const race = player?.raceId ? getRaceData(player.raceId) : null
  const classes = player?.raceId ? getClassesForRace(player.raceId) : []

  if (!show) return null

  function handleConfirm() {
    if (!selected || !player?.raceId || !canPickClass(player.raceId, selected)) return
    selectClass(selected)
    hapticSuccess()
    playSfx('skill')
  }

  return (
    <Dialog open={show}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Выбор класса</DialogTitle>
          <p className="text-xs text-slate-400">
            {race ? `${race.icon} ${race.nameRu} — выберите класс` : 'Выберите класс'}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className={`cursor-pointer transition-all active:scale-95 ${
                selected === cls.id ? 'border-aether-cyan glow-cyan' : ''
              }`}
              onClick={() => { setSelected(cls.id); hapticImpact('light') }}
            >
              <CardContent className="p-3 text-center">
                <div className="text-3xl mb-1">{cls.icon}</div>
                <div className="text-sm font-bold text-white">{cls.nameRu}</div>
                <div className="text-[9px] text-slate-400 mt-1 line-clamp-2">{cls.descriptionRu}</div>
                <div className="text-[9px] text-aether-cyan mt-1">
                  АТК {cls.stats.atk} · ЗАЩ {cls.stats.def} · HP {cls.stats.hp}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" disabled={!selected} onClick={handleConfirm}>
          Подтвердить класс
        </Button>
      </DialogContent>
    </Dialog>
  )
}
