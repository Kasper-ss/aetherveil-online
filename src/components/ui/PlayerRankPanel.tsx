import type { PlayerRankId, RankInput } from '@/lib/playerRank'
import {
  formatRankBonusLines,
  getRankProgress,
  getRankTier,
  RANK_ORDER,
} from '@/lib/playerRank'
import { RankBadge } from '@/components/ui/RankBadge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'

export function PlayerRankPanel({ input, compact = false }: { input: RankInput; compact?: boolean }) {
  const progress = getRankProgress(input)
  const tier = getRankTier(progress.currentRank)
  const bonusLines = formatRankBonusLines(progress.currentRank)

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <RankBadge rank={progress.currentRank} size="md" />
          <span className="text-xs text-slate-300">{tier.labelRu}</span>
        </div>
        {progress.nextRank && (
          <>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>До ранга {progress.nextRank}</span>
              <span>{progress.overallPct}%</span>
            </div>
            <Progress value={progress.overallPct} className="h-1.5" />
          </>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <RankBadge rank={progress.currentRank} size="lg" />
          <div>
            <p className="text-sm font-bold text-white">{tier.labelRu}</p>
            <p className="text-[10px] text-slate-500">Постоянные бонусы ранга</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {bonusLines.map((line) => (
            <p key={line} className="text-xs text-aether-cyan">{line}</p>
          ))}
        </div>

        {progress.nextRank ? (
          <div className="space-y-2 pt-2 border-t border-aether-border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-white">
                Следующий ранг: <RankBadge rank={progress.nextRank} size="sm" className="ml-1 align-middle" />
              </p>
              <span className="text-[10px] text-slate-500">{progress.overallPct}%</span>
            </div>
            <Progress value={progress.overallPct} className="h-2" />
            <div className="space-y-1.5">
              {progress.requirements.map((req) => (
                <div key={req.key} className="flex items-center justify-between text-[10px]">
                  <span className={req.met ? 'text-emerald-400' : 'text-slate-400'}>
                    {req.met ? '✓' : '○'} {req.label}
                  </span>
                  <span className={req.met ? 'text-emerald-400' : 'text-slate-500'}>
                    {formatNumber(req.current)} / {formatNumber(req.required)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-aether-gold text-center pt-2 border-t border-aether-border">
            Максимальный ранг достигнут!
          </p>
        )}

        <div className="pt-2 border-t border-aether-border">
          <p className="text-[10px] text-slate-500 mb-2">Все ранги</p>
          <div className="flex flex-wrap gap-1.5">
            {RANK_ORDER.map((id) => (
              <RankBadge
                key={id}
                rank={id}
                size="sm"
                className={id === progress.currentRank ? 'ring-2 ring-aether-cyan' : 'opacity-40'}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PlayerRankBadgeOnly({ rank }: { rank: PlayerRankId }) {
  return <RankBadge rank={rank} size="sm" />
}
