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
import { RARITY_LABELS_RU } from '@/data/items'
import type { PublicPlayerProfile } from '@/types/game'

export function PlayerViewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const self = usePlayerStore((s) => s.player)
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const telegramId = Number(id)

  useTelegramBackButton(() => navigate('/leaderboard'), true)

  useEffect(() => {
    if (!telegramId || Number.isNaN(telegramId)) {
      setLoading(false)
      return
    }

    if (self?.telegramId === telegramId) {
      setProfile(buildPublicProfile(self))
      setLoading(false)
      return
    }

    setLoading(true)
    fetchPlayerProfile(telegramId).then((p) => {
      setProfile(p)
      setLoading(false)
    })
  }, [telegramId, self])

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
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Профиль игрока</h1>
      </div>

      {loading && <p className="text-center text-slate-500 py-8">Загрузка...</p>}

      {!loading && !profile && (
        <p className="text-center text-slate-500 py-8">Профиль не найден или игрок ещё не синхронизировался</p>
      )}

      {profile && (
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-full bg-aether-card flex items-center justify-center text-3xl ${getFrameClass(profile.profileFrameId)}`}>
              {getAvatarPreview(profile.cosmeticAvatarId)}
            </div>
            <h2 className="text-lg font-bold text-white mt-2">{profile.displayName}</h2>
            <p className="text-sm text-slate-400">@{profile.username}</p>
            <p className="text-xs text-aether-cyan mt-1">
              Ур. {profile.level} · {className} · Этаж {profile.highestFloor}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {profile.telegramId}</p>
          </div>

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

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-white mb-2">Снаряжение</p>
              {profile.equipped.length === 0 ? (
                <p className="text-xs text-slate-500">Нет данных о снаряжении</p>
              ) : (
                <div className="space-y-1.5">
                  {profile.equipped.map((item) => (
                    <div key={`${item.slot}-${item.name}`} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{item.slot}</span>
                      <span className="text-white truncate mx-2 flex-1">{item.name}</span>
                      <Badge variant={item.rarity} className="text-[8px]">
                        {RARITY_LABELS_RU[item.rarity] ?? item.rarity}
                      </Badge>
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
