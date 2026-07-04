import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MonthlyLeaderboardCategory, MonthlyLeaderboardEntry, Player } from '@/types/game'
import {
  MONTHLY_LIVE_TOP_COUNT,
  MONTHLY_RANK_REWARDS,
  formatMonthlyCategoryValue,
  formatMonthlyRewardBonus,
  formatMonthlyRewardLine,
  getGapToBeat,
  getMonthlyRewardRank,
  getPlayerMonthlyCategoryValue,
} from '@/lib/monthlyStats'

function rankStyle(rank: number): string {
  if (rank === 1) return 'bg-aether-gold text-aether-bg'
  if (rank === 2) return 'bg-slate-300 text-aether-bg'
  if (rank === 3) return 'bg-amber-700 text-white'
  if (rank === 4) return 'bg-aether-card text-slate-300'
  return 'bg-aether-card text-slate-500'
}

function MonthlyRankRow({
  rank,
  entry,
  categoryId,
  selfId,
  claimed,
  onClaim,
  onOpenPlayer,
}: {
  rank: number
  entry?: MonthlyLeaderboardEntry
  categoryId: string
  selfId: number
  claimed: string[]
  onClaim: (categoryId: string, rank: 1 | 2 | 3) => void
  onOpenPlayer: (id: number) => void
}) {
  const rewardRank = getMonthlyRewardRank(rank)
  const bonus = formatMonthlyRewardBonus(rank)
  const claimKey = `${categoryId}_${rank}`
  const canClaim = entry?.telegramId === selfId
    && rewardRank
    && !claimed.includes(claimKey)
  const isMe = entry?.telegramId === selfId

  return (
    <div
      className={`rounded-lg border p-2 ${isMe ? 'border-aether-cyan/60 bg-aether-cyan/5' : 'border-aether-border/60 bg-aether-bg/40'} ${entry ? 'cursor-pointer active:scale-[0.99]' : ''}`}
      onClick={() => entry && onOpenPlayer(entry.telegramId)}
      onKeyDown={(e) => e.key === 'Enter' && entry && onOpenPlayer(entry.telegramId)}
      role={entry ? 'button' : undefined}
      tabIndex={entry ? 0 : undefined}
    >
      <div className="flex items-start gap-2">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${rankStyle(rank)}`}>
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {entry ? (
              <>
                <span className="text-xs font-medium text-white truncate">
                  {entry.displayName}
                  {isMe && <span className="text-aether-cyan ml-1">(Вы)</span>}
                </span>
                <span className="text-[10px] text-aether-gold font-bold shrink-0 ml-auto">
                  {formatMonthlyCategoryValue(categoryId, entry.value)}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-500">— свободно —</span>
            )}
          </div>
          <div className="mt-1 rounded-md bg-black/20 px-2 py-1">
            <div className={`text-[10px] font-medium ${rewardRank ? 'text-aether-gold' : 'text-slate-500'}`}>
              🎁 {formatMonthlyRewardLine(rank)}
            </div>
            {bonus && <div className="text-[9px] text-slate-400 mt-0.5">{bonus}</div>}
          </div>
        </div>
        {canClaim && rewardRank && (
          <Button
            size="sm"
            className="h-7 text-[9px] px-2 shrink-0 self-center"
            onClick={(e) => {
              e.stopPropagation()
              onClaim(categoryId, rewardRank)
            }}
          >
            Забрать
          </Button>
        )}
        {entry?.telegramId === selfId && claimed.includes(claimKey) && (
          <span className="text-[10px] text-green-400 shrink-0 self-center">✓</span>
        )}
      </div>
    </div>
  )
}

function CategoryMotivation({
  cat,
  player,
  selfRow,
}: {
  cat: MonthlyLeaderboardCategory
  player: Player
  selfRow?: MonthlyLeaderboardEntry
}) {
  const selfValue = getPlayerMonthlyCategoryValue(player, cat.categoryId)
  if (selfValue <= 0 && !selfRow) return null

  const hints: string[] = []
  const third = cat.entries.find((e) => e.rank === 3)
  const topCutoff = cat.entries[MONTHLY_LIVE_TOP_COUNT - 1]

  if (third && (!selfRow || selfRow.rank > 3)) {
    const gap = getGapToBeat(third.value, selfValue)
    if (gap) hints.push(`До 3-го места (награда): +${formatMonthlyCategoryValue(cat.categoryId, gap)}`)
  }
  if (topCutoff && (!selfRow || selfRow.rank > MONTHLY_LIVE_TOP_COUNT)) {
    const gap = getGapToBeat(topCutoff.value, selfValue)
    if (gap) hints.push(`До Топ-${MONTHLY_LIVE_TOP_COUNT}: +${formatMonthlyCategoryValue(cat.categoryId, gap)}`)
  }
  if (selfRow && selfRow.rank === 1) {
    hints.push('Вы лидируете в этой категории!')
  } else if (selfRow && selfRow.rank <= 3) {
    hints.push(`Вы в призовой зоне — удерживайте место #${selfRow.rank}!`)
  }

  if (hints.length === 0) return null

  return (
    <div className="mt-2 rounded-lg border border-aether-purple/30 bg-aether-purple/10 px-2 py-1.5 space-y-0.5">
      {selfRow && (
        <p className="text-[10px] text-aether-cyan">
          Ваш результат: {formatMonthlyCategoryValue(cat.categoryId, selfValue)} · место #{selfRow.rank}
        </p>
      )}
      {!selfRow && selfValue > 0 && (
        <p className="text-[10px] text-slate-400">
          Ваш результат: {formatMonthlyCategoryValue(cat.categoryId, selfValue)} · вне Топ-{MONTHLY_LIVE_TOP_COUNT}
        </p>
      )}
      {hints.map((hint) => (
        <p key={hint} className="text-[10px] text-slate-300">{hint}</p>
      ))}
    </div>
  )
}

export function MonthlyLeaderboardPanel({
  monthKey,
  categories,
  player,
  claimed,
  onClaim,
  onOpenPlayer,
}: {
  monthKey: string
  categories: MonthlyLeaderboardCategory[]
  player: Player
  claimed: string[]
  onClaim: (categoryId: string, rank: 1 | 2 | 3) => void
  onOpenPlayer: (id: number) => void
}) {
  const selfId = player.telegramId

  return (
    <div className="space-y-4">
      <Card className="border-aether-gold/40">
        <CardContent className="p-3 space-y-1.5">
          <p className="text-xs font-semibold text-aether-gold text-center">Живой рейтинг месяца</p>
          <p className="text-[10px] text-slate-400 text-center">
            {monthKey} · Топ-{MONTHLY_LIVE_TOP_COUNT} обновляется каждые 30 сек
          </p>
          <p className="text-[10px] text-slate-500 text-center">
            Места 1–3 получают награды в конце месяца — награды показаны у каждой строки
          </p>
          <div className="grid grid-cols-3 gap-1 pt-1">
            {([1, 2, 3] as const).map((rank) => (
              <div key={rank} className="text-center rounded-md bg-black/20 p-1.5">
                <div className={`text-[10px] font-bold ${rank === 1 ? 'text-aether-gold' : rank === 2 ? 'text-slate-300' : 'text-amber-600'}`}>
                  #{rank}
                </div>
                <div className="text-[9px] text-white">{MONTHLY_RANK_REWARDS[rank].gold.toLocaleString('ru-RU')}🪙</div>
                <div className="text-[9px] text-aether-purple">{MONTHLY_RANK_REWARDS[rank].gems}💎</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const selfRow = cat.entries.find((e) => e.telegramId === selfId)
        const topRows = cat.entries.slice(0, MONTHLY_LIVE_TOP_COUNT)

        return (
          <Card key={cat.categoryId}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{cat.nameRu}</span>
                  <p className="text-[9px] text-slate-500">
                    {topRows.length > 0 ? `Топ-${topRows.length} игроков` : 'Пока нет участников'}
                  </p>
                </div>
                {selfRow && (
                  <Badge className="text-[9px] shrink-0">Вы: #{selfRow.rank}</Badge>
                )}
              </div>

              {topRows.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">Играйте и синхронизируйте прогресс — рейтинг обновляется автоматически</p>
              ) : (
                <div className="space-y-1.5">
                  {topRows.map((entry) => (
                    <MonthlyRankRow
                      key={`${cat.categoryId}_${entry.telegramId}`}
                      rank={entry.rank}
                      entry={entry}
                      categoryId={cat.categoryId}
                      selfId={selfId}
                      claimed={claimed}
                      onClaim={onClaim}
                      onOpenPlayer={onOpenPlayer}
                    />
                  ))}
                </div>
              )}

              <CategoryMotivation cat={cat} player={player} selfRow={selfRow} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
