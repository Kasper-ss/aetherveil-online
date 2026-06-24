import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Volume2, VolumeX, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore, usePlayerStats } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { xpForLevel, formatNumber } from '@/lib/utils'
import { toggleMusic, toggleSound } from '@/lib/audio'
import { useRef, useState } from 'react'
import { shareInviteLink, hapticSuccess } from '@/lib/telegram'
import { getCombatMaxHp } from '@/lib/playerStats'

export function ProfilePage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const stats = usePlayerStats()
  const claimEasterEgg = usePlayerStore((s) => s.claimExpEasterEgg)
  const claimUnderwearEasterEgg = usePlayerStore((s) => s.claimUnderwearEasterEgg)
  const changeDisplayName = usePlayerStore((s) => s.changeDisplayName)
  const [soundOn, setSoundOn] = useState(localStorage.getItem('aetherveil_sound') !== 'false')
  const [musicOn, setMusicOn] = useState(localStorage.getItem('aetherveil_music') !== 'false')
  const [showRename, setShowRename] = useState(false)
  const [showUnderwearEgg, setShowUnderwearEgg] = useState(false)
  const [newName, setNewName] = useState('')
  const clickTimes = useRef<number[]>([])
  const defClickTimes = useRef<number[]>([])

  useTelegramBackButton(() => navigate('/'), true)

  if (!player || !stats) return null

  const xpNeeded = xpForLevel(player.level)
  const maxHp = getCombatMaxHp(player)

  const avatarEmoji = player.cosmeticAvatarId === 'telegram_hero' ? '✈️'
    : player.cosmeticAvatarId === 'mythic_starter' ? '💎' : '⚔️'
  const avatarGlow = player.auraEffectId === 'telegram_hero' ? 'glow-cyan border-aether-cyan'
    : player.auraEffectId === 'mythic_starter' ? 'glow-purple border-aether-purple' : 'glow-cyan border-aether-cyan'

  function handleExpClick() {
    if (player!.expEasterEggClaimed) return
    const now = Date.now()
    clickTimes.current = clickTimes.current.filter((t) => now - t < 2000)
    clickTimes.current.push(now)
    if (clickTimes.current.length >= 10) {
      if (claimEasterEgg()) {
        hapticSuccess()
        clickTimes.current = []
      }
    }
  }

  function handleDefClick() {
    if (player!.underwearEasterEggClaimed) return
    const now = Date.now()
    defClickTimes.current = defClickTimes.current.filter((t) => now - t < 2000)
    defClickTimes.current.push(now)
    if (defClickTimes.current.length >= 10) {
      if (claimUnderwearEasterEgg()) {
        hapticSuccess()
        defClickTimes.current = []
        setShowUnderwearEgg(true)
      }
    }
  }

  function handleRename() {
    if (changeDisplayName(newName)) {
      setShowRename(false)
      setNewName('')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Профиль</h1>
      </div>

      <div className="p-4 text-center">
        <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-aether-cyan to-aether-purple flex items-center justify-center text-4xl border-2 ${avatarGlow} mb-3`}>
          {avatarEmoji}
        </div>
        <h2 className="text-xl font-bold text-white">{player.displayName}</h2>
        <p className="text-sm text-slate-400">@{player.username}</p>
        <p className="text-xs text-aether-cyan mt-1">Ур. {player.level} · Этаж {player.highestFloor}</p>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">ID: {player.telegramId}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => { setNewName(player.displayName); setShowRename(true) }}>
          Сменить ник
        </Button>
      </div>

      <Card className="mx-4">
        <CardContent className="p-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span
                role="presentation"
                onClick={handleExpClick}
                className="select-none cursor-default text-slate-400"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Опыт (EXP)
              </span>
              <span>{player.exp}/{xpNeeded}</span>
            </div>
            <Progress value={(player.exp / xpNeeded) * 100} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-aether-bg rounded-lg p-2">
              <div className="text-lg font-bold text-orange-400">{stats.atk}</div>
              <div className="text-[10px] text-slate-500">АТК</div>
            </div>
            <div className="bg-aether-bg rounded-lg p-2">
              <div className="text-lg font-bold text-blue-400">{stats.def}</div>
              <div
                role="presentation"
                onClick={handleDefClick}
                className="text-[10px] text-slate-500 select-none cursor-default"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                ЗАЩ
              </div>
            </div>
            <div className="bg-aether-bg rounded-lg p-2">
              <div className="text-lg font-bold text-red-400">{maxHp}</div>
              <div className="text-[10px] text-slate-500">HP</div>
            </div>
            <div className="bg-aether-bg rounded-lg p-2">
              <div className="text-lg font-bold text-yellow-400">{stats.crit}%</div>
              <div className="text-[10px] text-slate-500">КРИТ</div>
            </div>
          </div>

          {player.statPoints > 0 && (
            <p className="text-xs text-center text-aether-gold">
              Свободных очков характеристик: {player.statPoints}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 mt-3">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Золото</span>
            <span className="text-aether-gold">🪙 {formatNumber(player.gold)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Кристаллы</span>
            <span className="text-aether-purple">💎 {player.gems}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">PvP</span>
            <span className="text-white">{player.pvpWins}П / {player.pvpLosses}П</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Реферальный код</span>
            <button type="button" className="text-aether-cyan" onClick={() => void shareInviteLink(player.referralCode)}>
              {player.referralCode}
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Серия наград</span>
            <span className="text-white">{player.dailyRewardStreak} дн.</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 p-4">
        <Button variant="secondary" size="sm" className="flex-1"
          onClick={() => { setSoundOn(!soundOn); toggleSound(!soundOn) }}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          Звуки
        </Button>
        <Button variant="secondary" size="sm" className="flex-1"
          onClick={() => { setMusicOn(!musicOn); toggleMusic(!musicOn) }}
        >
          <Music className="h-4 w-4" />
          Музыка
        </Button>
      </div>

      <Dialog open={showUnderwearEgg} onOpenChange={setShowUnderwearEgg}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🎉 Поздравляем! Вы нашли легендарный предмет!</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-300">
            <p>Вы обыскивали старый Башни и среди пыльных артефактов внезапно обнаружили их...</p>
            <p className="text-center text-4xl">🩲</p>
            <p className="text-center font-bold text-white">Легендарные Трусы Неуязвимости</p>
            <p className="text-xs text-slate-400 italic text-center">
              «Эти священные трусы видели уже тысячи героев. Говорят, тот, кто их носит, получает иммунитет удара по самолюбию.»
            </p>
            <p className="text-center text-aether-gold font-medium">Эффекты: НИКАКИХ</p>
            <p className="text-xs text-center text-aether-cyan">
              Ты единственный игрок на сервере, кто нашёл этот ультра-редкий предмет!
            </p>
            <p className="text-center text-slate-400">Носи их с гордостью, легенда.</p>
          </div>
          <Button className="w-full mt-2" onClick={() => setShowUnderwearEgg(false)}>Понял</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сменить ник</DialogTitle>
          </DialogHeader>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={20}
            className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white mb-3"
            placeholder="Новый никнейм"
          />
          <Button className="w-full" onClick={handleRename} disabled={newName.trim().length < 2}>
            Сохранить
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
