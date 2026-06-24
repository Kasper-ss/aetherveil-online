import { useNavigate } from 'react-router-dom'
import { Castle, Swords, Users, Package, ShoppingBag, User, Gift, Share2, Trophy, Briefcase, Anvil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlayerStatsPanel } from '@/components/ui/stat-bar'
import { EnergyTimer } from '@/components/ui/EnergyTimer'
import { Sparkles } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { usePlayerStore, usePlayerStats } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import { xpForLevel, formatNumber } from '@/lib/utils'
import { shareInviteLink, hapticImpact } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { getFloorData } from '@/data/gameData'
import { getMobsRequiredForFloor } from '@/data/items'
import { getCombatMaxHp } from '@/lib/playerStats'
import { useT } from '@/hooks/useT'
import { CLASSES } from '@/data/classes'

export function HomePage() {
  const navigate = useNavigate()
  const t = useT()
  const setShowDaily = useUIStore((s) => s.setShowDailyReward)
  const setShowStats = useUIStore((s) => s.setShowStatDistribution)
  const player = usePlayerStore((s) => s.player)
  const playerLoading = usePlayerStore((s) => s.isLoading)
  const stats = usePlayerStats()

  if (playerLoading || !player) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        Загрузка персонажа...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        Подготовка статов...
      </div>
    )
  }

  const floor = getFloorData(player.farmFloor)
  const xpNeeded = xpForLevel(player.level)
  const xpPct = (player.exp / xpNeeded) * 100
  const maxHp = getCombatMaxHp(player)
  const classData = player.classId ? CLASSES.find((c) => c.id === player.classId) : null
  const mobsRequired = getMobsRequiredForFloor(player.farmFloor)
  const mobsKilled = player.floorMobKills[player.farmFloor] ?? 0

  function nav(path: string) {
    hapticImpact('light')
    playSfx('click')
    navigate(path)
  }

  function handleDaily() {
    hapticImpact('medium')
    playSfx('click')
    setShowDaily(true)
  }

  function handleShare() {
    shareInviteLink(player!.referralCode)
    hapticImpact('medium')
  }

  const menuItems = [
    { icon: Castle, label: t('hub.enterTower'), path: '/tower', variant: 'default' as const, primary: true },
    { icon: Swords, label: t('hub.arena'), path: '/arena', variant: 'destructive' as const },
    { icon: Users, label: t('hub.guild'), path: '/guild', variant: 'secondary' as const },
    { icon: Package, label: t('hub.inventory'), path: '/inventory', variant: 'secondary' as const },
    { icon: ShoppingBag, label: t('hub.shop'), path: '/shop', variant: 'purple' as const },
    { icon: Briefcase, label: t('hub.professions'), path: '/professions', variant: 'secondary' as const },
    { icon: Anvil, label: t('hub.forge'), path: '/forge', variant: 'gold' as const },
    { icon: Trophy, label: t('hub.leaderboard'), path: '/leaderboard', variant: 'secondary' as const },
    { icon: User, label: t('hub.profile'), path: '/profile', variant: 'ghost' as const },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto page-enter pb-4">
      <div className="relative p-4 pb-0">
        <div className="absolute inset-0 bg-gradient-to-b from-aether-purple/20 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aether-cyan to-aether-purple flex items-center justify-center text-2xl border-2 border-aether-cyan glow-cyan">
            {classData?.icon ?? '⚔️'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white truncate">{player.displayName}</h1>
              {player.statPoints > 0 && (
                <span className="text-[10px] bg-aether-gold/20 text-aether-gold px-1.5 py-0.5 rounded-full shrink-0">
                  +{player.statPoints}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-aether-cyan truncate">
                {t('hub.level')}{player.level} · {t('hub.floor')} {player.farmFloor}
                {classData && ` · ${classData.nameRu}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 shrink-0"
                onClick={() => { hapticImpact('light'); setShowStats(true) }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Распределить статы
              </Button>
            </div>
          </div>
          <LanguageSwitcher />
          <div className="text-right text-xs space-y-0.5">
            <div className="text-aether-gold">🪙 {formatNumber(player.gold)}</div>
            <div className="text-aether-purple">💎 {player.gems}</div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Опыт</span>
          <span>{player.exp}/{xpNeeded}</span>
        </div>
        <Progress value={xpPct} />
      </div>

      <Card className="mx-4 mt-3">
        <CardContent className="p-3 pt-3">
          <PlayerStatsPanel
            hp={maxHp} maxHp={maxHp}
            energy={player.energy} maxEnergy={player.maxEnergy}
            atk={stats.atk} def={stats.def}
            compact
          />
          <div className="mt-1 flex justify-end">
            <EnergyTimer />
          </div>
        </CardContent>
      </Card>

      <Card className="mx-4 mt-3">
        <CardContent className="p-3 pt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">{floor.name}</span>
            <span className="text-aether-cyan">{mobsKilled}/{mobsRequired} мобов</span>
          </div>
          <Progress value={(mobsKilled / mobsRequired) * 100} />
        </CardContent>
      </Card>

      <div className="flex gap-2 px-4 mt-3">
        <Button variant="gold" size="sm" className="flex-1" onClick={handleDaily}>
          <Gift className="h-4 w-4" /> {t('hub.daily')}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> {t('hub.invite')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant={item.variant}
            className={`h-16 flex-col gap-1 ${item.primary ? 'col-span-2 h-14' : ''}`}
            onClick={() => nav(item.path)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
