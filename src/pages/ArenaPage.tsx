import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticImpact, hapticError } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { findArenaOpponent, getOnlinePlayers, setArenaStatus } from '@/lib/multiplayer'

export function ArenaPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const spendEnergy = usePlayerStore((s) => s.spendEnergy)
  const startPvpCombat = useCombatStore((s) => s.startPvpCombat)
  const [online, setOnline] = useState(player ? getOnlinePlayers(player.telegramId) : [])
  const [searching, setSearching] = useState(false)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    if (!player) return
    setArenaStatus(player.telegramId, true)
    const refresh = () => setOnline(getOnlinePlayers(player.telegramId))
    refresh()
    const t = setInterval(refresh, 3000)
    return () => {
      clearInterval(t)
      setArenaStatus(player.telegramId, false)
    }
  }, [player])

  if (!player) return null

  function startMatch() {
    if (!spendEnergy(15)) { hapticError(); return }
    setSearching(true)
    hapticImpact('heavy')
    playSfx('attack')

    const opponent = findArenaOpponent(player!.telegramId)
    setSearching(false)

    if (!opponent) {
      hapticError()
      alert('Сейчас нет других игроков онлайн. Попросите друзей зайти в игру!')
      usePlayerStore.getState().updatePlayer({ energy: player!.energy + 15 })
      return
    }

    startPvpCombat(opponent)
    navigate('/combat')
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Арена PvP</h1>
      </div>

      <div className="p-4">
        <div className="text-center mb-4">
          <div className="text-6xl mb-2">⚔️</div>
          <h2 className="text-xl font-bold text-white">Колизей Aetherveil</h2>
          <p className="text-sm text-slate-400 mt-1">
            Текстовые бои против реальных игроков, которые сейчас в сети.
          </p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-around text-center">
              <div>
                <div className="text-2xl font-bold text-aether-success">{player.pvpWins}</div>
                <div className="text-xs text-slate-500">Победы</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-aether-danger">{player.pvpLosses}</div>
                <div className="text-xs text-slate-500">Поражения</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-aether-cyan">
                  {player.pvpWins + player.pvpLosses > 0
                    ? Math.round((player.pvpWins / (player.pvpWins + player.pvpLosses)) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-slate-500">Винрейт</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-aether-cyan" />
              <span className="text-sm text-white">Игроки онлайн: {online.length}</span>
            </div>
            {online.length === 0 ? (
              <p className="text-xs text-slate-500">Никого нет в сети. Откройте игру в другой вкладке/устройстве.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {online.map((p) => (
                  <div key={p.telegramId} className="flex justify-between text-xs py-1 border-b border-aether-border/50">
                    <span className="text-white">{p.displayName}</span>
                    <span className="text-slate-500">Ур.{p.level} · АТК {p.stats.atk}</span>
                    {p.inArena && <Badge className="text-[8px]">Арена</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="w-full h-14" onClick={startMatch} disabled={searching}>
          <Swords className="h-5 w-5" />
          {searching ? 'Поиск соперника...' : 'Найти соперника (−15 энергии)'}
        </Button>

        <p className="text-[10px] text-slate-600 mt-4 text-center">
          Бой использует реальные статы соперника. Победа даёт золото и опыт.
        </p>
      </div>
    </div>
  )
}
