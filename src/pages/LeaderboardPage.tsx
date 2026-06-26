import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { getLeaderboardEntries } from '@/lib/leaderboard'
import { buildGlobalLeaderboardView } from '@/lib/leaderboardDisplay'
import { fetchMonthlyLeaderboard } from '@/lib/multiplayerSync'
import { MONTHLY_RANK_REWARDS } from '@/lib/monthlyStats'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import type { LeaderboardEntry, MonthlyLeaderboardResponse } from '@/types/game'

function rankStyle(rank: number): string {
  if (rank === 1) return 'bg-aether-gold text-aether-bg'
  if (rank === 2) return 'bg-slate-300 text-aether-bg'
  if (rank === 3) return 'bg-amber-700 text-white'
  return 'bg-aether-card text-slate-400'
}

function LeaderboardRow({ entry, selfId, onOpen, valueLabel }: {
  entry: LeaderboardEntry
  selfId: number
  onOpen: (id: number) => void
  valueLabel?: string
}) {
  const isMe = entry.telegramId === selfId
  return (
    <Card
      className={`cursor-pointer active:scale-[0.99] transition-transform ${isMe ? 'border-aether-cyan glow-cyan' : ''}`}
      onClick={() => onOpen(entry.telegramId)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${rankStyle(entry.rank)}`}>
          {entry.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {entry.displayName}
            {isMe && <span className="text-aether-cyan ml-1">(Вы)</span>}
          </div>
          <div className="text-[10px] text-slate-500 truncate">@{entry.username}</div>
        </div>
        <div className="text-right shrink-0">
          {valueLabel ? (
            <div className="text-sm font-bold text-aether-gold">{valueLabel}</div>
          ) : (
            <>
              <div className="text-sm font-bold text-aether-cyan">Э{entry.floor}</div>
              <div className="text-[10px] text-slate-500">Ур.{entry.level}</div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LeaderboardPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const claimMonthlyReward = usePlayerStore((s) => s.claimMonthlyReward)
  const [allGlobal, setAllGlobal] = useState<LeaderboardEntry[]>([])
  const [friendsBoard, setFriendsBoard] = useState<LeaderboardEntry[]>([])
  const [monthlyBoard, setMonthlyBoard] = useState<MonthlyLeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useTelegramBackButton(() => navigate('/'), true)

  const loadBoards = useCallback(async () => {
    if (!player) return
    setLoading(true)
    const [global, friends, monthly] = await Promise.all([
      getLeaderboardEntries(player, false),
      getLeaderboardEntries(player, true),
      fetchMonthlyLeaderboard(),
    ])
    setAllGlobal(global)
    setFriendsBoard(friends)
    setMonthlyBoard(monthly)
    setLoading(false)
  }, [player])

  useEffect(() => {
    loadBoards()
    const interval = setInterval(loadBoards, 30_000)
    return () => clearInterval(interval)
  }, [loadBoards])

  if (!player) return null

  const selfId = player.telegramId
  const globalView = buildGlobalLeaderboardView(allGlobal, selfId)

  function handleClaimMonthly(categoryId: string, rank: number) {
    if (rank < 1 || rank > 3) return
    if (claimMonthlyReward(categoryId, rank as 1 | 2 | 3)) hapticSuccess()
    else hapticError()
  }

  function renderGlobalBoard() {
    if (loading) {
      return <p className="text-sm text-slate-500 text-center py-8">Загрузка рейтинга...</p>
    }
    if (globalView.top.length === 0) {
      return <p className="text-sm text-slate-500 text-center py-8">{t('leaderboard.empty')}</p>
    }
    return (
      <div className="space-y-2">
        <p className="text-[10px] text-slate-500 text-center">Топ-20 по максимальному этажу</p>
        {globalView.top.map((entry) => (
          <LeaderboardRow
            key={entry.telegramId}
            entry={entry}
            selfId={selfId}
            onOpen={(id) => navigate(`/player/${id}`)}
          />
        ))}
        {!globalView.selfInTop && globalView.selfEntry && globalView.selfRank && (
          <Card className="border-aether-cyan/50 mt-4">
            <CardContent className="p-3">
              <p className="text-[10px] text-aether-cyan text-center mb-2">
                Ваше место в рейтинге: #{globalView.selfRank}
              </p>
              <LeaderboardRow
                entry={globalView.selfEntry}
                selfId={selfId}
                onOpen={(id) => navigate(`/player/${id}`)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  function renderMonthlyBoard() {
    if (loading) {
      return <p className="text-sm text-slate-500 text-center py-8">Загрузка...</p>
    }
    if (!monthlyBoard?.categories.length) {
      return <p className="text-sm text-slate-500 text-center py-8">Нет данных за этот месяц</p>
    }
    const claimed = player!.monthlyRewardsClaimed ?? []
    return (
      <div className="space-y-4">
        <p className="text-[10px] text-slate-500 text-center">
          Месячный рейтинг · {monthlyBoard.monthKey} · Топ-3 получают награды
        </p>
        {monthlyBoard.categories.map((cat) => {
          const selfRow = cat.entries.find((e) => e.telegramId === selfId)
          return (
            <Card key={cat.categoryId}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium text-white">{cat.nameRu}</span>
                  {selfRow && (
                    <Badge className="ml-auto text-[9px]">Вы: #{selfRow.rank}</Badge>
                  )}
                </div>
                {cat.entries.length === 0 ? (
                  <p className="text-xs text-slate-500">Пока нет участников</p>
                ) : (
                  <div className="space-y-1.5">
                    {cat.entries.slice(0, 3).map((entry) => {
                      const claimKey = `${cat.categoryId}_${entry.rank}`
                      const canClaim = entry.telegramId === selfId
                        && entry.rank <= 3
                        && !claimed.includes(claimKey)
                      const reward = MONTHLY_RANK_REWARDS[entry.rank as 1 | 2 | 3]
                      return (
                        <div key={entry.telegramId} className="flex items-center gap-2 text-xs">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${rankStyle(entry.rank)}`}>
                            {entry.rank}
                          </span>
                          <span className="flex-1 text-white truncate">{entry.displayName}</span>
                          <span className="text-aether-gold">{entry.value}</span>
                          {canClaim && reward && (
                            <Button
                              size="sm"
                              className="h-6 text-[9px] px-2"
                              onClick={() => handleClaimMonthly(cat.categoryId, entry.rank)}
                            >
                              🪙{reward.gold}
                            </Button>
                          )}
                          {entry.telegramId === selfId && claimed.includes(claimKey) && (
                            <span className="text-[9px] text-slate-500">✓</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{t('leaderboard.title')}</h1>
      </div>

      <Tabs defaultValue="global" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="global" className="flex-1 text-xs">{t('leaderboard.global')}</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 text-xs">Месяц</TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 text-xs">{t('leaderboard.friends')}</TabsTrigger>
        </TabsList>

        <TabsContent value="global">{renderGlobalBoard()}</TabsContent>
        <TabsContent value="monthly">{renderMonthlyBoard()}</TabsContent>
        <TabsContent value="friends">
          {!loading && friendsBoard.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{t('friends.emptyHint')}</p>
          ) : (
            <div className="space-y-2">
              {friendsBoard.map((entry) => (
                <LeaderboardRow
                  key={entry.telegramId}
                  entry={entry}
                  selfId={selfId}
                  onOpen={(id) => navigate(`/player/${id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
