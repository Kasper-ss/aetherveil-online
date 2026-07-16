import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Sparkles, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import {
  formatEventCountdown,
  formatEventDateTime,
  getActiveEvents,
  getEventStatus,
  getScheduledEvents,
} from '@shared/eventsSchedule'
import { TIER_LABELS } from '@shared/gameEvents'
import type { ScheduledGameEvent } from '@shared/eventsSchedule'
import { hapticImpact } from '@/lib/telegram'

function tierBadgeClass(tier: ScheduledGameEvent['tier']): string {
  if (tier === 'legendary') return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  if (tier === 'rare') return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
}

function EventCard({ ev, now }: { ev: ScheduledGameEvent; now: number }) {
  const navigate = useNavigate()
  const status = getEventStatus(ev, now)
  const msUntilStart = ev.startAt - now
  const msUntilEnd = ev.endAt - now

  return (
    <Card className={`${status === 'active' ? 'border-aether-cyan/50 glow-cyan' : 'border-slate-700'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start gap-2 text-base">
          <span className="text-2xl shrink-0">{ev.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white">{ev.title}</span>
              <Badge className={`text-[9px] ${tierBadgeClass(ev.tier)}`}>{TIER_LABELS[ev.tier]}</Badge>
              {status === 'active' && (
                <Badge className="bg-aether-success/20 text-aether-success text-[9px]">Идёт сейчас</Badge>
              )}
              {status === 'upcoming' && (
                <Badge className="bg-slate-700 text-slate-300 text-[9px]">
                  Через {formatEventCountdown(msUntilStart)}
                </Badge>
              )}
            </div>
            {ev.isHardDungeon && (
              <p className="text-xs font-bold text-red-400 mt-1 tracking-wide uppercase">
                ⚠ Сложный данж — экстремальная сложность
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>{ev.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {ev.buffs.map((b) => (
            <Badge key={b} className="text-[9px] font-normal bg-slate-700 text-slate-300">
              {b}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-400">
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            Начало: {formatEventDateTime(ev.startAt)}
          </p>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            Конец: {formatEventDateTime(ev.endAt)}
          </p>
          {status === 'active' && (
            <p className="text-aether-cyan">Осталось: {formatEventCountdown(msUntilEnd)}</p>
          )}
        </div>
        {status === 'active' && ev.kind === 'dark_portal' && (
          <Button
            className="w-full bg-red-900/80 hover:bg-red-800 text-white font-bold tracking-wide"
            onClick={() => {
              hapticImpact('heavy')
              navigate('/raids')
            }}
          >
            <Swords className="h-4 w-4 mr-2" />
            Войти в Тёмный Портал
          </Button>
        )}
        {status === 'active' && ev.kind === 'secret_floor' && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              hapticImpact('medium')
              navigate('/tower')
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            К секретному этажу
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function EventsPage() {
  const navigate = useNavigate()
  const [, tick] = useState(0)
  const now = Date.now()

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const active = getActiveEvents(now)
  const scheduled = getScheduledEvents(now, 35).filter((e) => getEventStatus(e, now) !== 'ended')
  const upcoming = scheduled.filter((e) => getEventStatus(e, now) === 'upcoming')

  return (
    <div className="h-full min-h-0 overflow-y-auto page-enter pb-8">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-aether-purple" />
          События
        </h1>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-aether-purple/30 bg-gradient-to-b from-purple-900/20 to-transparent">
          <CardContent className="p-4 text-sm text-slate-300 space-y-2">
            <p>
              Каждую неделю проходит <strong className="text-white">1–2 события</strong>: Кровавая Луна, Охота на
              Легендарных Монстров или Тёмный Портал.
            </p>
            <p>
              Редко — <strong className="text-purple-300">Вторжение Теней</strong>. Раз в месяц —{' '}
              <strong className="text-amber-300">Секретный Этаж</strong>.
            </p>
          </CardContent>
        </Card>

        {active.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-aether-cyan">Активные события</h2>
            {active.map((ev) => (
              <EventCard key={ev.instanceId} ev={ev} now={now} />
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">
            {active.length > 0 ? 'Ближайшие события' : 'Расписание'}
          </h2>
          {upcoming.length === 0 && active.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">Нет запланированных событий в ближайшие недели.</p>
          )}
          {upcoming.map((ev) => (
            <EventCard key={ev.instanceId} ev={ev} now={now} />
          ))}
        </section>
      </div>
    </div>
  )
}
