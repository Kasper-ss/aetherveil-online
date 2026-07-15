import { usePlayerStore } from '@/store/playerStore'
import { getClassData } from '@/data/classes'
import { getRaceData } from '@/data/races'
import { Button } from '@/components/ui/button'
import { hapticSuccess } from '@/lib/telegram'

export function WelcomeModal() {
  const player = usePlayerStore((s) => s.player)
  const completeWelcome = usePlayerStore((s) => s.completeWelcome)

  const show = Boolean(player?.classSelected && player.raceSelected && !player.welcomeShown)
  if (!show || !player?.classId || !player.raceId) return null

  const className = getClassData(player.classId).nameRu
  const race = getRaceData(player.raceId)
  if (!race) return null

  function handleStart() {
    completeWelcome()
    hapticSuccess()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-aether-bg flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="text-7xl animate-pulse-glow">🏰</div>
        <h1 className="text-2xl font-bold text-aether-gold text-glow">
          Добро пожаловать в Aetherveil Online!
        </h1>
        <p className="text-sm text-slate-300 max-w-md leading-relaxed">
          Вы — искатель приключений, запертый в Башне Эфира. Поднимайтесь по этажам,
          побеждайте боссов, собирайте сеты и станьте легендой.
        </p>

        <div className="bg-aether-card border border-aether-border rounded-xl p-4 w-full max-w-sm space-y-2">
          <p className="text-xs text-slate-400">Ваш герой</p>
          <p className="text-lg text-white font-bold">
            {race.icon} {race.nameRu} · {getClassData(player.classId).icon} {className}
          </p>
          <p className="text-[10px] text-slate-500">
            Этаж {player.highestFloor} · Ур. {player.level}
          </p>
        </div>

        <div className="text-left w-full max-w-sm space-y-2 text-xs text-slate-400">
          <p>⚔️ <span className="text-white">Бой</span> — текстовые сражения с комбо и навыками</p>
          <p>🗼 <span className="text-white">Башня</span> — 100 мобов на этаж, затем босс</p>
          <p>🛡️ <span className="text-white">Снаряжение</span> — привязано к классу, улучшайте в кузнице</p>
          <p>👥 <span className="text-white">Гильдия</span> — до 10 игроков, чат и обмен предметами</p>
          <p>🌀 <span className="text-white">Порталы</span> — случайные дополнительные уровни после боёв</p>
        </div>
      </div>

      <div className="p-6 pb-10 shrink-0">
        <Button className="w-full h-14 text-base glow-cyan" variant="gold" onClick={handleStart}>
          Начать приключение
        </Button>
      </div>
    </div>
  )
}
