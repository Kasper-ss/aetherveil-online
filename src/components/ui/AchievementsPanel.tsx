import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePlayerStore } from '@/store/playerStore'
import {
  ACHIEVEMENTS,
  TIER_COLORS,
  TIER_LABELS,
  canClaimAchievement,
  countClaimedAchievements,
  isAchievementClaimed,
  isAchievementMet,
} from '@/data/achievements'
import { ACHIEVEMENT_TITLES } from '@/data/achievementTitles'
import { hapticSuccess, hapticError } from '@/lib/telegram'

export function AchievementsPanel() {
  const player = usePlayerStore((s) => s.player)
  const claimAchievement = usePlayerStore((s) => s.claimAchievement)
  const setProfileTitle = usePlayerStore((s) => s.setProfileTitle)
  const [filter, setFilter] = useState<'all' | 'ready' | 'done'>('all')

  const stats = useMemo(() => {
    if (!player) return { claimed: 0, ready: 0, total: ACHIEVEMENTS.length }
    let ready = 0
    for (const a of ACHIEVEMENTS) {
      if (canClaimAchievement(player, a.id)) ready++
    }
    return {
      claimed: countClaimedAchievements(player),
      ready,
      total: ACHIEVEMENTS.length,
    }
  }, [player])

  if (!player) return null

  const titles = player.unlockedTitles ?? []

  function handleClaim(id: string) {
    if (claimAchievement(id)) hapticSuccess()
    else hapticError()
  }

  const filtered = ACHIEVEMENTS.filter((a) => {
    const claimed = isAchievementClaimed(player, a.id)
    const ready = canClaimAchievement(player, a.id)
    if (filter === 'done') return claimed
    if (filter === 'ready') return ready
    return true
  })

  return (
    <div className="p-4 space-y-3 pb-8">
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">Прогресс</span>
            <span className="text-sm text-aether-cyan">{stats.claimed}/{stats.total}</span>
          </div>
          <Progress value={(stats.claimed / stats.total) * 100} />
          {stats.ready > 0 && (
            <p className="text-[10px] text-aether-gold text-center">
              {stats.ready} достижени{stats.ready === 1 ? 'е' : stats.ready < 5 ? 'я' : 'й'} можно забрать!
            </p>
          )}
        </CardContent>
      </Card>

      {titles.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-medium text-white">Титул в профиле</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={!player.profileTitleId ? 'default' : 'secondary'}
                className="h-7 text-[10px]"
                onClick={() => setProfileTitle(null)}
              >
                Без титула
              </Button>
              {titles.map((id) => {
                const t = ACHIEVEMENT_TITLES[id]
                if (!t) return null
                return (
                  <Button
                    key={id}
                    size="sm"
                    variant={player.profileTitleId === id ? 'default' : 'secondary'}
                    className="h-7 text-[10px]"
                    onClick={() => setProfileTitle(id)}
                  >
                    {t.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1">
        {([
          ['all', 'Все'],
          ['ready', 'Готово'],
          ['done', 'Получено'],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? 'default' : 'secondary'}
            className="flex-1 h-7 text-[10px]"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((a) => {
          const claimed = isAchievementClaimed(player, a.id)
          const met = isAchievementMet(player, a)
          const ready = canClaimAchievement(player, a.id)
          const progress = !claimed && !a.secret ? a.progress?.(player) : null
          const showSecretDesc = a.secret && claimed

          return (
            <Card
              key={a.id}
              className={`${ready ? 'border-aether-gold glow-purple' : ''} ${claimed ? 'opacity-80' : ''}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{a.nameRu}</span>
                      <Badge className={`text-[8px] ${TIER_COLORS[a.tier]}`}>{TIER_LABELS[a.tier]}</Badge>
                      {claimed && <span className="text-[10px] text-green-400">✓</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {a.secret && !showSecretDesc ? '???' : a.descriptionRu}
                    </p>
                    <p className="text-[10px] text-aether-cyan mt-1">Награда: {a.rewardPreviewRu}</p>
                    {progress && (
                      <div className="mt-2">
                        <Progress value={Math.min(100, (progress.current / progress.target) * 100)} className="h-1.5" />
                        <p className="text-[9px] text-slate-500 mt-0.5">{progress.current}/{progress.target}</p>
                      </div>
                    )}
                    {ready && (
                      <Button size="sm" className="w-full mt-2 h-7 text-[10px]" onClick={() => handleClaim(a.id)}>
                        Забрать награду
                      </Button>
                    )}
                    {!claimed && !ready && met && !a.secret && (
                      <p className="text-[9px] text-amber-400 mt-1">Условие выполнено</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
