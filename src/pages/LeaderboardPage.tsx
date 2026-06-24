import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { getLeaderboardEntries } from '@/lib/leaderboard'
import type { LeaderboardEntry } from '@/types/game'

function rankStyle(rank: number): string {
  if (rank === 1) return 'bg-aether-gold text-aether-bg'
  if (rank === 2) return 'bg-slate-300 text-aether-bg'
  if (rank === 3) return 'bg-amber-700 text-white'
  return 'bg-aether-card text-slate-400'
}

function LeaderboardRow({ entry, selfId }: { entry: LeaderboardEntry; selfId: number }) {
  const isMe = entry.telegramId === selfId

  return (
    <Card className={isMe ? 'border-aether-cyan glow-cyan' : ''}>
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
          <div className="text-sm font-bold text-aether-cyan">Э{entry.floor}</div>
          <div className="text-[10px] text-slate-500">Ур.{entry.level}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LeaderboardPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const [globalBoard, setGlobalBoard] = useState<LeaderboardEntry[]>([])
  const [friendsBoard, setFriendsBoard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useTelegramBackButton(() => navigate('/'), true)

  const loadBoards = useCallback(async () => {
    if (!player) return
    setLoading(true)
    const [global, friends] = await Promise.all([
      getLeaderboardEntries(player, false),
      getLeaderboardEntries(player, true),
    ])
    setGlobalBoard(global)
    setFriendsBoard(friends)
    setLoading(false)
  }, [player])

  useEffect(() => {
    loadBoards()
    const interval = setInterval(loadBoards, 30_000)
    return () => clearInterval(interval)
  }, [loadBoards])

  if (!player) return null

  const selfId = player.telegramId

  function renderBoard(entries: LeaderboardEntry[]) {
    if (loading) {
      return <p className="text-sm text-slate-500 text-center py-8">Загрузка рейтинга...</p>
    }
    if (entries.length === 0) {
      return <p className="text-sm text-slate-500 text-center py-8">{t('leaderboard.empty')}</p>
    }
    return (
      <div className="space-y-2">
        {entries.map((entry) => (
          <LeaderboardRow key={entry.telegramId} entry={entry} selfId={selfId} />
        ))}
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
        <TabsList>
          <TabsTrigger value="global">{t('leaderboard.global')}</TabsTrigger>
          <TabsTrigger value="friends">{t('leaderboard.friends')}</TabsTrigger>
        </TabsList>

        <TabsContent value="global">{renderBoard(globalBoard)}</TabsContent>
        <TabsContent value="friends">{renderBoard(friendsBoard)}</TabsContent>
      </Tabs>
    </div>
  )
}
