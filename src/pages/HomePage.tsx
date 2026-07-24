import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Castle, Users, Package, ShoppingBag, User, Gift, Share2, Trophy, Briefcase, Anvil, Landmark, Sparkles, Copy, Dices, Fish, ChefHat, ScrollText, Skull, Home, Pickaxe, Leaf, Shield, Building2, Heart, Factory, Calendar, GitBranch, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlayerStatsPanel } from '@/components/ui/stat-bar'
import { EnergyTimer } from '@/components/ui/EnergyTimer'
import { HpTimer } from '@/components/ui/HpTimer'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { usePlayerStore, usePlayerStats } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import { xpForLevel, formatNumber } from '@/lib/utils'
import { hapticImpact, hapticSuccess } from '@/lib/telegram'
import { InviteFriendDialog } from '@/components/InviteFriendDialog'
import { playSfx } from '@/lib/audio'
import { getFloorData } from '@/data/gameData'
import { getMobsRequiredForFloor } from '@/data/items'
import { getCombatMaxHp, getPlayerCurrentHp, getMaxEnergy } from '@/lib/playerStats'
import { getMaxMana, getPlayerCurrentMana, usesMana } from '@/lib/mana'
import { ManaTimer } from '@/components/ui/ManaTimer'
import { useT } from '@/hooks/useT'
import { CLASSES } from '@/data/classes'
import { getPetRewardTimeRemaining, formatPetRewardCountdown } from '@/lib/petRewards'
import { isWorldBossUnlocked, getWorldBossCooldown, WORLD_BOSS_UNLOCK_FLOOR } from '@/data/worldBoss'
import { maybeNotifyWorldBoss } from '@/lib/worldBossNotifications'
import { maybeNotifyGameEvent } from '@/lib/eventsNotifications'
import { getActiveEvents } from '@shared/eventsSchedule'
import { isRealEstateUnlocked } from '@/data/realEstate'
import { isCityUnlocked } from '@/data/cityBuildings'
import { PRODUCTION_UNLOCK_FLOOR } from '@/data/production'
import { RankBadge } from '@/components/ui/RankBadge'
import { PlayerRankPanel } from '@/components/ui/PlayerRankPanel'
import { getPlayerRankFromPlayer, getRankInputFromPlayer } from '@/lib/playerRank'
import { getArenaDailyStatus, ARENA_DAILY_LIMIT } from '@/data/arena'

export function HomePage() {
  const navigate = useNavigate()
  const t = useT()
  const setShowDaily = useUIStore((s) => s.setShowDailyReward)
  const setShowStats = useUIStore((s) => s.setShowStatDistribution)
  const setShowPetReward = useUIStore((s) => s.setShowPetReward)
  const petReward = usePlayerStore((s) => s.petReward)
  const [showInvite, setShowInvite] = useState(false)
  const player = usePlayerStore((s) => s.player)
  const playerLoading = usePlayerStore((s) => s.isLoading)
  const authError = useUIStore((s) => s.telegramAuthError)
  const stats = usePlayerStats()
  const pet = player?.equipped.pet ?? null
  const [, petTick] = useState(0)

  useEffect(() => {
    if (!pet) return
    const id = setInterval(() => petTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [pet])

  useEffect(() => {
    if (player) {
      maybeNotifyWorldBoss()
      maybeNotifyGameEvent()
    }
  }, [player?.telegramId])

  if (authError) return null

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
  const currentHp = getPlayerCurrentHp(player)
  const maxEnergy = getMaxEnergy(player)
  const maxMana = usesMana(player) ? getMaxMana(player) : 0
  const currentMana = usesMana(player) ? getPlayerCurrentMana(player) : 0
  const classData = player.classId ? CLASSES.find((c) => c.id === player.classId) : null
  const mobsRequired = getMobsRequiredForFloor(player.farmFloor)
  const mobsKilled = player.floorMobKills[player.farmFloor] ?? 0
  const worldBossUnlocked = isWorldBossUnlocked(player)
  const worldBossStatus = getWorldBossCooldown(player)
  const worldBossReady = worldBossUnlocked && worldBossStatus.canFight
  const worldBossMenuLabel = worldBossReady
    ? 'Мировой Босс ⚔️'
    : worldBossStatus.isActive
      ? 'Мировой Босс ✓'
      : worldBossUnlocked
        ? `Мировой Босс · ${worldBossStatus.daysUntilNext} д`
        : `Мировой Босс 🔒 ${WORLD_BOSS_UNLOCK_FLOOR} эт.`
  const realEstateUnlocked = isRealEstateUnlocked(player)
  const cityUnlocked = isCityUnlocked(player)

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
    setShowInvite(true)
    hapticImpact('medium')
  }

  async function copyPlayerId() {
    try {
      await navigator.clipboard.writeText(String(player!.telegramId))
      hapticSuccess()
    } catch {
      /* clipboard unavailable */
    }
  }

  const productionUnlocked = player.highestFloor >= PRODUCTION_UNLOCK_FLOOR
  const activeEvents = getActiveEvents()
  const eventsMenuLabel = activeEvents.length > 0 ? `События ⚡ ${activeEvents.length}` : 'События'
  const playerRank = getPlayerRankFromPlayer(player)
  const rankInput = getRankInputFromPlayer(player)
  const arenaStatus = getArenaDailyStatus(player)
  const arenaMenuLabel = arenaStatus.canFight
    ? `Арена ⚔️ ${arenaStatus.fightsLeft}/${ARENA_DAILY_LIMIT}`
    : arenaStatus.dailyLimitReached
      ? 'Арена · лимит'
      : 'Арена · пауза'

  const menuItems = [
    { icon: Castle, label: t('hub.enterTower'), path: '/tower', variant: 'default' as const, primary: true },
    { icon: Swords, label: arenaMenuLabel, path: '/arena', variant: 'purple' as const, primary: false },
    { icon: Calendar, label: eventsMenuLabel, path: '/events', variant: 'purple' as const, primary: activeEvents.length > 0 },
    {
      icon: Skull,
      label: worldBossMenuLabel,
      path: '/world-boss',
      variant: 'purple' as const,
      primary: worldBossReady,
    },
    { icon: Pickaxe, label: 'Шахта', path: '/mine', variant: 'gold' as const },
    { icon: Heart, label: 'Питомник', path: '/nursery', variant: 'purple' as const },
    ...(productionUnlocked
      ? [{ icon: Factory, label: 'Производство', path: '/production', variant: 'gold' as const }]
      : [{ icon: Factory, label: `Производство 🔒 ${PRODUCTION_UNLOCK_FLOOR} эт.`, path: '/production', variant: 'secondary' as const }]),
    { icon: Leaf, label: 'Поле трав', path: '/field', variant: 'secondary' as const },
    { icon: Shield, label: 'Рейды', path: '/raids', variant: 'purple' as const, primary: false },
    ...(cityUnlocked
      ? [{ icon: Building2, label: 'Город', path: '/city', variant: 'secondary' as const }]
      : [{ icon: Building2, label: `Город 🔒`, path: '/city', variant: 'secondary' as const }]),
    { icon: Users, label: t('hub.guild'), path: '/guild', variant: 'secondary' as const },
    { icon: Package, label: t('hub.inventory'), path: '/inventory', variant: 'secondary' as const },
    { icon: ShoppingBag, label: t('hub.shop'), path: '/shop', variant: 'purple' as const },
    { icon: Briefcase, label: t('hub.professions'), path: '/professions', variant: 'secondary' as const },
    { icon: Fish, label: 'Рыбалка', path: '/fishing', variant: 'secondary' as const },
    { icon: ChefHat, label: 'Кухня', path: '/kitchen', variant: 'gold' as const },
    { icon: ScrollText, label: 'Квесты', path: '/quests', variant: 'purple' as const },
    { icon: Sparkles, label: t('hub.skills'), path: '/skills', variant: 'purple' as const },
    { icon: GitBranch, label: 'Дерево навыков', path: '/skill-tree', variant: 'purple' as const },
    { icon: Anvil, label: t('hub.forge'), path: '/forge', variant: 'gold' as const },
    { icon: Landmark, label: t('hub.bank'), path: '/bank', variant: 'gold' as const },
    ...(realEstateUnlocked ? [{ icon: Home, label: t('hub.realEstate'), path: '/real-estate', variant: 'gold' as const }] : []),
    { icon: Dices, label: t('hub.fair'), path: '/fair', variant: 'purple' as const },
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white truncate">{player.displayName}</h1>
              <RankBadge rank={playerRank} size="md" />
              <span className="text-[11px] font-bold bg-aether-cyan/20 text-aether-cyan px-2 py-0.5 rounded-full shrink-0">
                {t('hub.level')}{player.level}
              </span>
              {player.statPoints > 0 && (
                <span className="text-[10px] bg-aether-gold/20 text-aether-gold px-1.5 py-0.5 rounded-full shrink-0">
                  +{player.statPoints}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void copyPlayerId()}
              className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 hover:text-aether-cyan transition-colors"
            >
              ID: {player.telegramId}
              <Copy className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-aether-cyan truncate">
                {t('hub.floor')} {player.farmFloor}
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
          <PlayerRankPanel input={rankInput} compact />
        </CardContent>
      </Card>

      <Card className="mx-4 mt-3">
        <CardContent className="p-3 pt-3">
          <PlayerStatsPanel
            hp={currentHp} maxHp={maxHp}
            energy={player.energy} maxEnergy={maxEnergy}
            mana={currentMana} maxMana={maxMana}
            atk={stats.atk} def={stats.def}
            compact
          />
          <div className="mt-1 flex justify-between gap-2 flex-wrap">
            <HpTimer />
            <EnergyTimer />
            {maxMana > 0 && <ManaTimer />}
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

      {pet && (
        <Card className="mx-4 mt-3">
          <CardContent className="p-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300 truncate">
              {pet.icon} {pet.name}
            </span>
            {petReward ? (
              <Button
                size="sm"
                variant="gold"
                className="h-7 text-[10px] shrink-0"
                onClick={() => { hapticImpact('light'); setShowPetReward(true) }}
              >
                Забрать дар!
              </Button>
            ) : (
              <span className="text-[10px] text-slate-500 shrink-0">
                Дар через {formatPetRewardCountdown(getPetRewardTimeRemaining(player) ?? 0)}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 px-4 mt-3">
        <Button variant="gold" size="sm" className="flex-1" onClick={handleDaily}>
          <Gift className="h-4 w-4" /> {t('hub.daily')}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> {t('hub.invite')}
        </Button>
      </div>

      <InviteFriendDialog open={showInvite} onOpenChange={setShowInvite} />

      <div className="grid grid-cols-3 gap-2 p-3 pb-4">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant={item.variant}
            className={`h-11 flex-col gap-0.5 px-1 ${item.primary ? 'col-span-3 h-10' : ''}`}
            onClick={() => nav(item.path)}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[10px] leading-tight">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
