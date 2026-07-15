import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { fetchPlayerProfile } from '@/lib/multiplayerSync'
import { buildPublicProfile } from '@/lib/publicProfile'
import { getAvatarPreview, getFrameClass } from '@/data/cosmetics'
import { getClassData } from '@/data/classes'
import { getTitleLabel, getTitleColorClass } from '@/data/achievementTitles'
import { RARITY_LABELS_RU } from '@/data/items'
import { SET_DATA } from '@/data/items'
import { formatNumber } from '@/lib/utils'
import type { PublicPlayerProfile } from '@/types/game'

function getSetLabel(setId?: string): string | null {
  if (!setId) return null
  const set = SET_DATA.find((s) => s.id === setId)
  return set?.name ?? setId
}

export function PlayerViewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const self = usePlayerStore((s) => s.player)
  const [remoteProfile, setRemoteProfile] = useState<PublicPlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const telegramId = Number(id)
  const isOwnProfile = Boolean(self?.telegramId === telegramId && !Number.isNaN(telegramId))
  const profile = isOwnProfile && self ? buildPublicProfile(self) : remoteProfile

  useTelegramBackButton(() => navigate('/leaderboard'), true)

  useEffect(() => {
    if (!telegramId || Number.isNaN(telegramId)) {
      setLoading(false)
      return
    }

    if (isOwnProfile) {
      setLoading(false)
      return
    }

    let cancelled = false
    setRemoteProfile(null)
    setLoading(true)

    fetchPlayerProfile(telegramId).then((p) => {
      if (cancelled) return
      setRemoteProfile(p)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [telegramId, isOwnProfile])

  if (!telegramId || Number.isNaN(telegramId)) {
    return (
      <div className="p-4 text-center text-slate-400">
        <p>Неверный ID игрока</p>
        <Button className="mt-4" onClick={() => navigate('/leaderboard')}>Назад</Button>
      </div>
    )
  }

  const className = profile?.classId ? getClassData(profile.classId).nameRu : '—'

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Профиль игрока</h1>
      </div>

      {loading && <p className="text-center text-slate-500 py-8">Загрузка...</p>}

      {!loading && !profile && (
        <div className="p-4 text-center space-y-3">
          <p className="text-slate-500">Профиль не найден или игрок ещё не синхронизировался</p>
          <p className="text-[10px] text-slate-600">Игрок должен хотя бы раз зайти в игру после обновления</p>
          <Button variant="outline" onClick={() => navigate('/leaderboard')}>Назад к рейтингу</Button>
        </div>
      )}

      {profile && (
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-full bg-aether-card flex items-center justify-center text-3xl ${getFrameClass(profile.profileFrameId)}`}>
              {getAvatarPreview(profile.cosmeticAvatarId)}
            </div>
            <h2 className="text-lg font-bold text-white mt-2">{profile.displayName}</h2>
            {getTitleLabel(profile.profileTitleId) && (
              <p className={`text-xs font-medium ${getTitleColorClass(profile.profileTitleId)}`}>
                {getTitleLabel(profile.profileTitleId)}
              </p>
            )}
            <p className="text-sm text-slate-400">@{profile.username}</p>
            <p className="text-xs text-aether-cyan mt-1">
              Ур. {profile.level} · {className} · Этаж {profile.highestFloor}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {profile.telegramId}</p>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-white mb-2">Ресурсы</p>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="bg-aether-bg rounded p-2">
                  <span className="text-aether-gold font-bold">🪙 {formatNumber(profile.gold)}</span>
                  <div className="text-[10px] text-slate-500">Золото</div>
                </div>
                <div className="bg-aether-bg rounded p-2">
                  <span className="text-fuchsia-400 font-bold">💎 {formatNumber(profile.gems)}</span>
                  <div className="text-[10px] text-slate-500">Гемы</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-white mb-2">Характеристики</p>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="bg-aether-bg rounded p-2"><span className="text-orange-400 font-bold">{profile.stats.atk}</span> АТК</div>
                <div className="bg-aether-bg rounded p-2"><span className="text-blue-400 font-bold">{profile.stats.def}</span> ЗАЩ</div>
                <div className="bg-aether-bg rounded p-2"><span className="text-red-400 font-bold">{profile.stats.hp}</span> HP</div>
                <div className="bg-aether-bg rounded p-2"><span className="text-yellow-400 font-bold">{profile.stats.crit}%</span> КРИТ</div>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                PvP: {profile.pvpWins}П / {profile.pvpLosses}П
              </p>
            </CardContent>
          </Card>

          {profile.activeSets.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-white mb-2">Активные сеты</p>
                <div className="space-y-2">
                  {profile.activeSets.map((set) => (
                    <div key={set.name} className="bg-aether-bg rounded p-2">
                      <p className="text-xs font-medium text-aether-gold">{set.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{set.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-white mb-2">Снаряжение</p>
              {profile.equipped.length === 0 ? (
                <p className="text-xs text-slate-500">Нет данных о снаряжении</p>
              ) : (
                <div className="space-y-1.5">
                  {profile.equipped.map((item) => (
                    <div key={`${item.slot}-${item.name}`} className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-slate-500">{item.slot}</span>
                          <span className="text-white truncate">{item.name}</span>
                          <Badge variant={item.rarity} className="text-[8px]">
                            {RARITY_LABELS_RU[item.rarity] ?? item.rarity}
                          </Badge>
                        </div>
                        {item.setId && (
                          <p className="text-[9px] text-aether-purple mt-0.5">
                            Сет: {getSetLabel(item.setId)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
