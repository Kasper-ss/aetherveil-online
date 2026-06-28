import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore } from '@/store/playerStore'
import {
  getAllTrophies, hasBossTrophy, type BossTrophy,
} from '@/data/bossTrophies'
import { WORLD_BOSS_UNLOCK_FLOOR } from '@/data/worldBoss'

export function TrophiesPanel() {
  const player = usePlayerStore((s) => s.player)
  const [selected, setSelected] = useState<BossTrophy | null>(null)

  const trophies = useMemo(() => getAllTrophies(), [])
  const earned = useMemo(() => {
    if (!player) return 0
    return trophies.filter((t) => hasBossTrophy(player, t.id)).length
  }, [player, trophies])

  if (!player) return null

  const highest = player.highestFloor

  return (
    <div className="p-4 space-y-3 pb-8">
      <Card>
        <CardContent className="p-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">Коллекция трофеев</span>
            <span className="text-sm text-aether-cyan">{earned}/{trophies.length}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Нажмите на трофей, чтобы узнать историю босса. Полученные подсвечены золотом.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {trophies.map((trophy) => {
          const obtained = hasBossTrophy(player, trophy.id)
          const locked = trophy.id === 'trophy_world_boss'
            ? highest < WORLD_BOSS_UNLOCK_FLOOR && !obtained
            : trophy.floor > highest && !obtained

          return (
            <button
              key={trophy.id}
              type="button"
              onClick={() => setSelected(trophy)}
              className={`
                aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 p-1 transition-colors
                ${obtained
                  ? 'border-aether-gold/60 bg-aether-gold/10'
                  : locked
                    ? 'border-slate-700 bg-slate-800/40 opacity-50'
                    : 'border-slate-600 bg-slate-800/60'}
              `}
            >
              <span className={`text-2xl ${obtained ? '' : 'grayscale'}`}>{trophy.icon}</span>
              <span className="text-[8px] text-slate-400 leading-tight text-center">
                {trophy.floor > 0 ? `${trophy.floor}` : 'MB'}
              </span>
            </button>
          )
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selected.icon}</span>
                  <span>{selected.bossName}</span>
                  {hasBossTrophy(player, selected.id) ? (
                    <Badge className="bg-aether-gold/20 text-aether-gold text-[10px]">Получен</Badge>
                  ) : (
                    <Badge className="text-[10px]">Не получен</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-slate-300">
                {selected.floor > 0 && (
                  <p className="text-xs text-aether-cyan">Этаж {selected.floor}</p>
                )}
                <div>
                  <p className="text-xs font-medium text-white mb-1">История</p>
                  <p className="text-xs leading-relaxed">{selected.loreRu}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-white mb-1">Способности</p>
                  <p className="text-xs leading-relaxed">{selected.abilitiesRu}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-white mb-1">Интересный факт</p>
                  <p className="text-xs leading-relaxed text-slate-400 italic">{selected.funFactRu}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
