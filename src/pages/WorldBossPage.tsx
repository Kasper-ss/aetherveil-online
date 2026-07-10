import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Crown, Clock, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { getPlayerCurrentHp } from '@/lib/playerStats'
import {
  WORLD_BOSS_UNLOCK_FLOOR,
  WORLD_BOSS_REWARDS,
  isWorldBossUnlocked,
  getWorldBossCooldown,
  formatCooldownRemaining,
} from '@/data/worldBoss'
import { getWorldBossSchedule } from '@/lib/worldBossSchedule'
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'

export function WorldBossPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const startWorldBossCombat = useCombatStore((s) => s.startWorldBossCombat)
  const [, tick] = useState(0)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!player) return null

  const unlocked = isWorldBossUnlocked(player)
  const status = getWorldBossCooldown(player)
  const schedule = getWorldBossSchedule()
  const kills = player.worldBossKills ?? 0

  function handleFight() {
    if (!unlocked) { hapticError(); return }
    if (!status.canFight) { hapticError(); return }
    if (getPlayerCurrentHp(player!) < 1) { hapticError(); return }
    hapticImpact('heavy')
    playSfx('click')
    if (startWorldBossCombat()) {
      hapticSuccess()
      navigate('/combat')
    } else {
      hapticError()
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto page-enter pb-8">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Мировой Босс</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-purple-500/30 bg-gradient-to-b from-purple-900/20 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-3xl">🌌</span>
              Архонт Эфирной Бездны
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              Появляется раз в 3 дня на 24 часа. Открывается с {WORLD_BOSS_UNLOCK_FLOOR}-го этажа.
              Сложность растёт с вашим прогрессом в башне.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-700 text-slate-300 text-[10px]">Каждые 3 дня</Badge>
              <Badge className="bg-slate-700 text-slate-300 text-[10px]">2 фазы</Badge>
              <Badge className="bg-slate-700 text-slate-300 text-[10px]">Редкие камни</Badge>
            </div>
            {!unlocked && (
              <p className="text-xs text-red-400">
                🔒 Достигните {WORLD_BOSS_UNLOCK_FLOOR}-го этажа (сейчас: {player.highestFloor})
              </p>
            )}
            {unlocked && schedule.isActive && status.canFight && (
              <p className="text-xs text-aether-cyan font-medium">
                Сегодня будет Мировой Босс — можно сразиться!
              </p>
            )}
            {unlocked && schedule.isActive && !status.canFight && (
              <p className="text-xs text-amber-400">
                Вы уже победили Архонта в этом цикле. Следующий спавн через {formatCooldownRemaining(status.remainingMs)}.
              </p>
            )}
            {unlocked && !schedule.isActive && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                До появления: {status.daysUntilNext === 1 ? '1 день' : `${status.daysUntilNext} дн.`}
                {' '}({formatCooldownRemaining(status.remainingMs)})
              </p>
            )}
            {kills > 0 && (
              <p className="text-xs text-aether-cyan">Побед: {kills}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-aether-gold" />
              Награды за победу
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-300 space-y-1">
            <p>🪙 {WORLD_BOSS_REWARDS.gold.toLocaleString()} золота</p>
            <p>💎 {WORLD_BOSS_REWARDS.gems} кристаллов</p>
            <p>⭐ Редкие ресурсы и камни для ювелирного дела</p>
            <p>🗡️ Уникальный легендарный меч «Клинок Разлома Миров» (первое убийство)</p>
            <p>🏅 Титул «Убийца Архонта»</p>
            <p>🏆 Особый трофей в коллекции</p>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={!unlocked || !status.canFight}
          onClick={handleFight}
        >
          <Swords className="h-4 w-4 mr-2" />
          {!unlocked
            ? `Нужен ${WORLD_BOSS_UNLOCK_FLOOR}-й этаж`
            : !schedule.isActive
              ? `Появится через ${status.daysUntilNext} дн.`
              : !status.canFight
                ? 'Уже побеждён в этом цикле'
                : 'Вызвать Архонта (15 ⚡)'}
        </Button>
      </div>
    </div>
  )
}
