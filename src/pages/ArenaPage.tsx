import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Clock, Trophy, Users, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { getPlayerCurrentHp } from '@/lib/playerStats'
import {
  ARENA_DAILY_LIMIT,
  ARENA_GOLD_STEAL_PCT,
  getArenaDailyStatus,
  formatArenaCountdown,
  calcArenaGoldSteal,
} from '@/data/arena'
import {
  getOnlinePlayers,
  setArenaStatus,
  profileToArenaSnapshot,
  type OnlinePlayerSnapshot,
} from '@/lib/multiplayer'
import { fetchServerLeaderboard, fetchPlayerProfile } from '@/lib/multiplayerSync'
import type { LeaderboardEntry, PublicPlayerProfile } from '@/types/game'
import { formatNumber } from '@/lib/utils'
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { RankBadge } from '@/components/ui/RankBadge'

interface ArenaOpponent {
  entry: LeaderboardEntry
  profile: PublicPlayerProfile | null
  online: boolean
  loading: boolean
}

export function ArenaPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const startPvpCombat = useCombatStore((s) => s.startPvpCombat)
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [, tick] = useState(0)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!player) return
    setArenaStatus(player.telegramId, true)
    return () => setArenaStatus(player.telegramId, false)
  }, [player?.telegramId])

  const loadOpponents = useCallback(async () => {
    if (!player) return
    setLoadingList(true)
    try {
      const entries = await fetchServerLeaderboard(player)
      const filtered = entries.filter((e) => e.telegramId !== player.telegramId).slice(0, 15)
      const onlineIds = new Set(getOnlinePlayers(player.telegramId).map((p) => p.telegramId))

      setOpponents(filtered.map((entry) => ({
        entry,
        profile: null,
        online: onlineIds.has(entry.telegramId),
        loading: true,
      })))

      const profiles = await Promise.all(
        filtered.map((entry) => fetchPlayerProfile(entry.telegramId)),
      )

      setOpponents(filtered.map((entry, i) => ({
        entry,
        profile: profiles[i],
        online: onlineIds.has(entry.telegramId),
        loading: false,
      })))
    } finally {
      setLoadingList(false)
    }
  }, [player])

  useEffect(() => {
    void loadOpponents()
  }, [loadOpponents])

  if (!player) return null

  const status = getArenaDailyStatus(player)
  const potentialGold = (profile: PublicPlayerProfile | null) =>
    calcArenaGoldSteal(profile?.gold ?? 0)

  function toSnapshot(opp: ArenaOpponent): OnlinePlayerSnapshot | null {
    if (!opp.profile) return null
    return profileToArenaSnapshot(opp.profile, { guildId: opp.entry.guildId })
  }

  function handleFight(snapshot: OnlinePlayerSnapshot | null) {
    if (!snapshot) {
      hapticError()
      return
    }
    if (!status.canFight) {
      hapticError()
      return
    }
    if (getPlayerCurrentHp(player!) < 1) {
      hapticError()
      return
    }
    hapticImpact('heavy')
    playSfx('click')
    if (startPvpCombat(snapshot)) {
      hapticSuccess()
      navigate('/combat')
    } else {
      hapticError()
    }
  }

  async function handleRandomFight() {
    const online = getOnlinePlayers(player!.telegramId)
    if (online.length > 0) {
      const pick = online[Math.floor(Math.random() * online.length)]
      const profile = await fetchPlayerProfile(pick.telegramId)
      handleFight(profile ? profileToArenaSnapshot(profile) : pick)
      return
    }

    const ready = opponents.filter((o) => o.profile)
    if (ready.length === 0) {
      hapticError()
      return
    }
    const pick = ready[Math.floor(Math.random() * ready.length)]
    handleFight(toSnapshot(pick))
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto page-enter pb-8">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Арена PvP</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-red-500/30 bg-gradient-to-b from-red-900/20 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="h-5 w-5 text-red-400" />
              Сражайся с другими игроками
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              Победа приносит опыт и {Math.round(ARENA_GOLD_STEAL_PCT * 100)}% золота противника.
              Можно атаковать онлайн и офлайн игроков.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-700 text-slate-300 text-[10px]">{ARENA_DAILY_LIMIT} боёв/день</Badge>
              <Badge className="bg-slate-700 text-slate-300 text-[10px]">1 на 1</Badge>
              <Badge className="bg-slate-700 text-slate-300 text-[10px]">PvP</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-white">Статистика арены</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[10px] text-slate-500">Победы</div>
                <div className="text-lg font-bold text-green-400">{player.pvpWins}</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[10px] text-slate-500">Поражения</div>
                <div className="text-lg font-bold text-red-400">{player.pvpLosses}</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[10px] text-slate-500">Заработано</div>
                <div className="text-lg font-bold text-aether-gold">🪙 {formatNumber(player.pvpGoldEarned ?? 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Бои сегодня</span>
              <span className="text-sm font-bold text-white">
                {status.fightsToday} / {ARENA_DAILY_LIMIT}
              </span>
            </div>
            {!status.canFight && status.cooldownMs > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {status.dailyLimitReached
                    ? `Новые бои через ${formatArenaCountdown(status.cooldownMs)}`
                    : `Следующий бой через ${formatArenaCountdown(status.cooldownMs)}`}
                </span>
              </div>
            )}
            <Button
              className="w-full"
              disabled={!status.canFight || getPlayerCurrentHp(player) < 1}
              onClick={() => void handleRandomFight()}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Случайный противник
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="h-4 w-4" />
          <span>Противники</span>
          {loadingList && <span className="text-[10px]">загрузка...</span>}
        </div>

        <div className="space-y-2">
          {opponents.length === 0 && !loadingList && (
            <p className="text-center text-sm text-slate-500 py-4">Нет доступных противников</p>
          )}
          {opponents.map((opp) => {
            const steal = potentialGold(opp.profile)
            return (
              <Card key={opp.entry.telegramId} className="border-slate-800">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white truncate">{opp.entry.displayName}</span>
                      {opp.entry.playerRank && <RankBadge rank={opp.entry.playerRank} size="sm" />}
                      {opp.online
                        ? <Badge className="bg-green-600/30 text-green-400 text-[9px]">онлайн</Badge>
                        : <Badge className="bg-slate-700 text-slate-400 text-[9px]">офлайн</Badge>}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Ур.{opp.entry.level} · {opp.entry.floor} эт.
                      {opp.profile && (
                        <> · PvP {opp.profile.pvpWins}П/{opp.profile.pvpLosses}П</>
                      )}
                    </div>
                    {opp.profile && steal > 0 && (
                      <div className="text-[10px] text-aether-gold mt-0.5">
                        Награда: 🪙 {formatNumber(steal)}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!status.canFight || opp.loading || !opp.profile || getPlayerCurrentHp(player) < 1}
                    onClick={() => handleFight(toSnapshot(opp))}
                  >
                    <Swords className="h-3 w-3 mr-1" />
                    Бой
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/leaderboard')}>
          <Trophy className="h-4 w-4 mr-2" />
          Рейтинг игроков
        </Button>
      </div>
    </div>
  )
}
