import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { getLeaderboardEntries } from '@/lib/leaderboard'
import { buildGlobalLeaderboardView } from '@/lib/leaderboardDisplay'
import { fetchMonthlyLeaderboard, applyLiveSelfToMonthlyBoard } from '@/lib/multiplayerSync'
import { flushPlayerSave } from '@/lib/playerSave'
import { MonthlyLeaderboardPanel } from '@/components/ui/MonthlyLeaderboardPanel'
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

const tabContentClass = 'mt-3 data-[state=inactive]:hidden'

export function LeaderboardPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const claimMonthlyReward = usePlayerStore((s) => s.claimMonthlyReward)
  const [allGlobal, setAllGlobal] = useState<LeaderboardEntry[]>([])
  const [friendsBoard, setFriendsBoard] = useState<LeaderboardEntry[]>([])
  const [monthlyBoard, setMonthlyBoard] = useState<MonthlyLeaderboardResponse | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const hasLoadedRef = useRef(false)

  useTelegramBackButton(() => navigate('/'), true)

  const loadBoards = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedRef.current) {
      setInitialLoading(true)
    } else if (hasLoadedRef.current) {
      setRefreshing(true)
    }

    try {
      await flushPlayerSave()
      await usePlayerStore.getState().syncPlayerState()
      const currentPlayer = usePlayerStore.getState().player
      if (!currentPlayer) return

      const [global, friends, monthly] = await Promise.all([
        getLeaderboardEntries(currentPlayer, false),
        getLeaderboardEntries(currentPlayer, true),
        fetchMonthlyLeaderboard(currentPlayer),
      ])
      setAllGlobal(global)
      setFriendsBoard(friends)
      setMonthlyBoard(monthly ? applyLiveSelfToMonthlyBoard(monthly, currentPlayer) : null)
      setLastUpdated(new Date())
      hasLoadedRef.current = true
      if (silent) hapticSuccess()
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadBoards()
    const interval = setInterval(() => void loadBoards(true), 30_000)
    return () => clearInterval(interval)
  }, [loadBoards])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadBoards(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadBoards])

  if (!player) return null

  const selfId = player.telegramId
  const globalView = buildGlobalLeaderboardView(allGlobal, selfId)

  function handleClaimMonthly(categoryId: string, rank: number) {
    if (rank < 1 || rank > 3) return
    if (claimMonthlyReward(categoryId, rank as 1 | 2 | 3)) hapticSuccess()
    else hapticError()
  }

  const showInitialPlaceholder = initialLoading && !hasLoadedRef.current

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">{t('leaderboard.title')}</h1>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0"
          disabled={refreshing}
          onClick={() => void loadBoards(true)}
          title="Обновить рейтинг"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
        {refreshing && (
          <span className="text-[10px] text-slate-500">обновление…</span>
        )}
      </div>

      {lastUpdated && !showInitialPlaceholder && (
        <p className="text-[10px] text-slate-600 text-center pb-1">
          Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
        </p>
      )}

      {showInitialPlaceholder ? (
        <p className="text-sm text-slate-500 text-center py-12">Загрузка рейтинга…</p>
      ) : (
        <Tabs defaultValue="global" className="p-4">
          <TabsList className="w-full">
            <TabsTrigger value="global" className="flex-1 text-xs">{t('leaderboard.global')}</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 text-xs">Месяц</TabsTrigger>
            <TabsTrigger value="friends" className="flex-1 text-xs">{t('leaderboard.friends')}</TabsTrigger>
          </TabsList>

          <TabsContent value="global" forceMount className={tabContentClass}>
            {globalView.top.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{t('leaderboard.empty')}</p>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="monthly" forceMount className={tabContentClass}>
            {!monthlyBoard?.categories.length ? (
              <p className="text-sm text-slate-500 text-center py-8">Нет данных за этот месяц</p>
            ) : (
              <MonthlyLeaderboardPanel
                monthKey={monthlyBoard.monthKey}
                categories={monthlyBoard.categories}
                player={player}
                claimed={player.monthlyRewardsClaimed ?? []}
                onClaim={handleClaimMonthly}
                onOpenPlayer={(id) => navigate(`/player/${id}`)}
              />
            )}
          </TabsContent>

          <TabsContent value="friends" forceMount className={tabContentClass}>
            {friendsBoard.length === 0 ? (
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
      )}
    </div>
  )
}
