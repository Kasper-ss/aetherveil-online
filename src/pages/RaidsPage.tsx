import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { getPlayerCurrentHp } from '@/lib/playerStats'
import { getRaidsForFloor, RAID_MOBS_REQUIRED, RAID_MOB_ENERGY, RAID_BOSS_ENERGY } from '@/data/raids'
import {
  canStartRaid,
  formatRaidCooldown,
  getRaidCooldownRemaining,
  getRaidFightType,
  getRaidProgress,
  isRaidComplete,
} from '@/lib/raidProgress'
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'

export function RaidsPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const abandonRaid = usePlayerStore((s) => s.abandonRaid)
  const startRaidCombat = useCombatStore((s) => s.startRaidCombat)
  const [selectedFloor, setSelectedFloor] = useState(player?.highestFloor ?? 1)
  const [, tick] = useState(0)

  useEffect(() => {
    if (player?.highestFloor != null) setSelectedFloor(player.highestFloor)
  }, [player?.highestFloor])

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!player) return null

  const raids = getRaidsForFloor(selectedFloor)

  function handleFight(def: ReturnType<typeof getRaidsForFloor>[0]) {
    const check = canStartRaid(player!, def.id, def.floor)
    if (!check.ok) { hapticError(); return }
    if (getPlayerCurrentHp(player!) < 1) { hapticError(); return }

    hapticImpact('heavy')
    playSfx('skill')
    if (startRaidCombat(def)) {
      hapticSuccess()
      navigate('/combat')
    } else {
      hapticError()
    }
  }

  function handleAbandon(raidId: string) {
    abandonRaid(raidId)
    hapticImpact('light')
  }

  return (
    <div className="h-full overflow-y-auto page-enter pb-8">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Рейды</h1>
      </div>

      <div className="p-4 space-y-3">
        <Card className="border-red-500/30">
          <CardContent className="p-3 text-xs text-slate-400 space-y-1">
            <p className="text-sm font-medium text-red-300">Элитные рейды</p>
            <p>Сложнее обычного фарма. Нужна подготовка: зелья, еда, экипировка.</p>
            <p>Цель: <span className="text-white">50 мобов + 1 босс</span>. Лут копится до конца рейда.</p>
            <p className="text-red-400">Смерть в рейде — блокировка на 1 час, прогресс сбрасывается.</p>
          </CardContent>
        </Card>

        <div>
          <p className="text-xs text-slate-400 mb-2">Этаж рейда:</p>
          <select
            className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(Number(e.target.value))}
          >
            {Array.from({ length: player.highestFloor }, (_, i) => i + 1).map((f) => (
              <option key={f} value={f}>Этаж {f}</option>
            ))}
          </select>
        </div>

        {selectedFloor > player.highestFloor && (
          <p className="text-xs text-red-400 text-center">Этаж ещё не открыт</p>
        )}

        {raids.map((def) => {
          const progress = getRaidProgress(player, def.id)
          const cooldown = getRaidCooldownRemaining(player, def.id)
          const check = canStartRaid(player, def.id, def.floor)
          const fightType = progress ? getRaidFightType(progress) : 'mob'
          const completed = player.completedRaids?.includes(def.id)
          const mobPct = progress ? (progress.mobsKilled / RAID_MOBS_REQUIRED) * 100 : 0

          return (
            <Card key={def.id} className={player.activeRaidId === def.id ? 'border-aether-cyan' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-white">{def.nameRu}</div>
                    <p className="text-[10px] text-slate-400 mt-1">{def.descriptionRu}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {completed && <Badge className="text-[9px] bg-aether-gold/20 text-aether-gold">Пройден</Badge>}
                    {player.activeRaidId === def.id && (
                      <Badge className="text-[9px]">В процессе</Badge>
                    )}
                  </div>
                </div>

                {progress && !isRaidComplete(progress) && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Мобов: {progress.mobsKilled}/{RAID_MOBS_REQUIRED}</span>
                      <span>{progress.bossDefeated ? 'Босс ✓' : fightType === 'boss' ? 'Босс доступен' : 'К боссу'}</span>
                    </div>
                    <Progress value={mobPct} />
                    <p className="text-[10px] text-slate-500">
                      Накоплено: 🪙{progress.accumulatedGold} · EXP {progress.accumulatedExp}
                    </p>
                  </div>
                )}

                {cooldown > 0 && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    После смерти: {formatRaidCooldown(cooldown)}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    disabled={!check.ok || cooldown > 0}
                    onClick={() => handleFight(def)}
                  >
                    <Swords className="h-4 w-4 mr-1" />
                    {!check.ok
                      ? check.reason
                      : fightType === 'boss'
                        ? `Босс (${RAID_BOSS_ENERGY}⚡)`
                        : `Бой (${RAID_MOB_ENERGY}⚡)`}
                  </Button>
                  {progress && !isRaidComplete(progress) && player.activeRaidId === def.id && (
                    <Button size="sm" variant="outline" onClick={() => handleAbandon(def.id)}>
                      Сброс
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
