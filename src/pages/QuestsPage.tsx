import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import { DAILY_QUESTS, WEEKLY_QUESTS, GUILD_QUESTS } from '@/data/quests'
import { getGuildQuestProgress } from '@/lib/multiplayer'
import { getQuestProgress, isQuestClaimed, normalizeQuestState } from '@/lib/quests'
import type { QuestDef } from '@/types/game'

function QuestCard({
  quest,
  progress,
  claimed,
  onClaim,
}: {
  quest: QuestDef
  progress: number
  claimed: boolean
  onClaim: () => void
}) {
  const done = progress >= quest.target
  const pct = Math.min(100, (progress / quest.target) * 100)
  const rewardParts: string[] = []
  if (quest.rewards.gold) rewardParts.push(`🪙${quest.rewards.gold}`)
  if (quest.rewards.gems) rewardParts.push(`💎${quest.rewards.gems}`)

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="text-sm font-medium text-white">{quest.nameRu}</div>
            <div className="text-[10px] text-slate-400">{quest.descriptionRu}</div>
          </div>
          <span className="text-xs text-aether-cyan">{progress}/{quest.target}</span>
        </div>
        <Progress value={pct} className="mb-2" />
        <div className="text-[10px] text-aether-gold mb-2">{rewardParts.join(' · ')}</div>
        <Button
          size="sm"
          className="w-full"
          variant={claimed ? 'secondary' : 'default'}
          disabled={claimed || !done}
          onClick={onClaim}
        >
          {claimed ? 'Получено' : done ? 'Забрать награду' : 'В процессе'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function QuestsPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const claimQuestReward = usePlayerStore((s) => s.claimQuestReward)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const state = normalizeQuestState(player)
  const guildProgress = getGuildQuestProgress()

  function handleClaim(questId: string, scope: 'daily' | 'weekly' | 'guild') {
    if (claimQuestReward(questId, scope)) hapticSuccess()
    else hapticError()
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Квесты</h1>
      </div>

      <Tabs defaultValue="daily" className="p-4">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="daily" className="flex-1 text-xs">Ежедневные</TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1 text-xs">Еженедельные</TabsTrigger>
          <TabsTrigger value="guild" className="flex-1 text-xs">Гильдия</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-2">
          {DAILY_QUESTS.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              progress={getQuestProgress(state, q.id, 'daily')}
              claimed={isQuestClaimed(state, q.id, 'daily')}
              onClaim={() => handleClaim(q.id, 'daily')}
            />
          ))}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-2">
          {WEEKLY_QUESTS.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              progress={getQuestProgress(state, q.id, 'weekly')}
              claimed={isQuestClaimed(state, q.id, 'weekly')}
              onClaim={() => handleClaim(q.id, 'weekly')}
            />
          ))}
        </TabsContent>

        <TabsContent value="guild" className="space-y-2">
          <p className="text-[10px] text-slate-500 mb-2">Общий прогресс гильдии. Награду может забрать любой участник.</p>
          {GUILD_QUESTS.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              progress={guildProgress[q.id] ?? 0}
              claimed={isQuestClaimed(state, q.id, 'guild')}
              onClaim={() => handleClaim(q.id, 'guild')}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
