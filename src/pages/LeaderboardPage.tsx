import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'

const EMPTY_SLOTS = 9

export function LeaderboardPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const myEntry = {
    rank: 1,
    telegramId: player.telegramId,
    username: player.username,
    displayName: player.displayName,
    floor: player.highestFloor,
    level: player.level,
  }

  function renderBoard(showPlayer: boolean) {
    const slots = []
    if (showPlayer) {
      slots.push(
        <Card key="me" className="border-aether-cyan glow-cyan">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-aether-gold text-aether-bg">
              1
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {myEntry.displayName}
                <span className="text-aether-cyan ml-1">{t('leaderboard.you')}</span>
              </div>
              <div className="text-[10px] text-slate-500">@{myEntry.username}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-aether-cyan">Э{myEntry.floor}</div>
              <div className="text-[10px] text-slate-500">{t('hub.level')}{myEntry.level}</div>
            </div>
          </CardContent>
        </Card>
      )
    }

    for (let i = showPlayer ? 2 : 1; i <= EMPTY_SLOTS; i++) {
      slots.push(
        <Card key={`empty_${i}`} className="opacity-50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-aether-card text-slate-600">
              {i}
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-500 italic">{t('leaderboard.waiting')}</div>
            </div>
            <div className="text-right text-[10px] text-slate-600">—</div>
          </CardContent>
        </Card>
      )
    }

    return slots
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

        <TabsContent value="global">
          <div className="space-y-2">{renderBoard(true)}</div>
        </TabsContent>

        <TabsContent value="friends">
          <div className="space-y-2">{renderBoard(true)}</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
