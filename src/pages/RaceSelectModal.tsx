import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayerStore } from '@/store/playerStore'
import { RACES } from '@/data/races'
import { hapticImpact, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import type { PlayerRace } from '@/types/game'

export function RaceSelectModal() {
  const player = usePlayerStore((s) => s.player)
  const selectRace = usePlayerStore((s) => s.selectRace)
  const [selected, setSelected] = useState<PlayerRace | null>(null)

  const show = !!player && !player.raceSelected

  if (!show) return null

  function handleConfirm() {
    if (!selected) return
    selectRace(selected)
    hapticSuccess()
    playSfx('skill')
  }

  return (
    <Dialog open={show}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Выбор расы</DialogTitle>
          <p className="text-xs text-slate-400">Сначала выберите расу — затем класс. Прогресс всех игроков обнулён.</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {RACES.map((race) => (
            <Card
              key={race.id}
              className={`cursor-pointer transition-all active:scale-95 ${
                selected === race.id ? 'border-aether-cyan glow-cyan' : ''
              }`}
              onClick={() => { setSelected(race.id); hapticImpact('light') }}
            >
              <CardContent className="p-3 text-center">
                <div className="text-3xl mb-1">{race.icon}</div>
                <div className="text-sm font-bold text-white">{race.nameRu}</div>
                <div className="text-[9px] text-slate-400 mt-1 line-clamp-3">{race.descriptionRu}</div>
                <div className="text-[9px] text-aether-purple mt-1 line-clamp-2">{race.abilityNameRu}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" disabled={!selected} onClick={handleConfirm}>
          Подтвердить расу
        </Button>
      </DialogContent>
    </Dialog>
  )
}
