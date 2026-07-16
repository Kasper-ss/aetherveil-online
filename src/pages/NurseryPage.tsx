import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import {
  NURSERY_MAX_STAGE, NURSERY_FEED_REQUIRED, NURSERY_STAGE_LABELS,
  getNurseryFeedCost, getNurseryStageStats,
} from '@/data/nursery'
import { formatNumber } from '@/lib/utils'

export function NurseryPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const feedNursery = usePlayerStore((s) => s.feedNursery)
  const [msg, setMsg] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const pet = player.equipped.pet
  const nursery = { stage: 1, feedProgress: 0, ...player.nurseryState }
  const required = NURSERY_FEED_REQUIRED[nursery.stage] ?? 0
  const feedCost = getNurseryFeedCost(nursery.stage)
  const stageStats = getNurseryStageStats(nursery.stage)
  const maxed = nursery.stage >= NURSERY_MAX_STAGE

  function handleFeed() {
    if (feedNursery()) {
      hapticSuccess()
      setMsg('Питомец накормлен!')
    } else {
      hapticError()
      setMsg('Нужен питомец в экипировке, золото и ресурсы.')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Питомник</h1>
      </div>

      <div className="p-4 space-y-3">
        {!pet ? (
          <Card>
            <CardContent className="p-4 text-sm text-slate-400 text-center">
              Наденьте питомца в инвентаре, чтобы выращивать его в питомнике.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-aether-cyan/30">
              <CardContent className="p-4 text-center">
                <div className="text-5xl mb-2">{pet.icon}</div>
                <div className="text-lg font-bold text-white">{pet.name}</div>
                <Badge className="mt-2 bg-aether-purple/30 text-aether-purple">
                  Стадия {nursery.stage}/5 · {NURSERY_STAGE_LABELS[nursery.stage]}
                </Badge>
              </CardContent>
            </Card>

            {!maxed && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Прогресс до след. стадии</span>
                    <span className="text-aether-cyan">{nursery.feedProgress}/{required}</span>
                  </div>
                  <Progress value={required ? (nursery.feedProgress / required) * 100 : 100} />
                  <p className="text-[10px] text-slate-500 mt-2">
                    Чем выше стадия — тем больше кормлений нужно и дороже корм.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> Бонусы к статам (надетый питомец)
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {stageStats.atk != null && <span className="text-orange-400">АТК +{stageStats.atk}</span>}
                  {stageStats.def != null && <span className="text-blue-400">ЗАЩ +{stageStats.def}</span>}
                  {stageStats.hp != null && <span className="text-red-400">HP +{stageStats.hp}</span>}
                  {stageStats.crit != null && <span className="text-yellow-400">КРИТ +{stageStats.crit}%</span>}
                  {stageStats.speed != null && <span className="text-green-400">СКР +{stageStats.speed}</span>}
                </div>
              </CardContent>
            </Card>

            {!maxed && (
              <Button className="w-full" onClick={handleFeed}>
                Покормить · 🪙{formatNumber(feedCost.gold)}
                {feedCost.meat > 0 && ` · 🥩${feedCost.meat}`}
                {feedCost.herb > 0 && ` · 🌿${feedCost.herb}`}
              </Button>
            )}
            {maxed && (
              <p className="text-center text-sm text-aether-gold">Максимальная стадия роста!</p>
            )}
          </>
        )}
        {msg && <p className="text-center text-xs text-slate-400">{msg}</p>}
      </div>
    </div>
  )
}
