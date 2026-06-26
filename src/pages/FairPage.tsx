import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { formatNumber } from '@/lib/utils'
import { hapticError, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { FAIR_COLOR_LABELS, FAIR_PAYOUTS, type FairColor } from '@/lib/fairGame'
import {
  FATE_CARDS, canDrawFateCard, getFateCardCooldownRemaining,
  formatFateCardCountdown, type FateCardType,
} from '@/lib/fateCards'
import { formatBuffRemaining, isBuffActive } from '@/lib/playerBuffs'

const COLORS: FairColor[] = ['red', 'black', 'green']
const FATE_TYPES: FateCardType[] = ['gold', 'exp']

export function FairPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const playFairBet = usePlayerStore((s) => s.playFairBet)
  const drawFateCard = usePlayerStore((s) => s.drawFateCard)
  const [bet, setBet] = useState('100')
  const [pick, setPick] = useState<FairColor>('red')
  const [lastResult, setLastResult] = useState<FairColor | null>(null)
  const [lastWin, setLastWin] = useState<boolean | null>(null)
  const [lastPayout, setLastPayout] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [lastFateCard, setLastFateCard] = useState<FateCardType | null>(null)
  const [, cdTick] = useState(0)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    const id = setInterval(() => cdTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!player) return null

  const stats = player.fairStats ?? { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, goldWon: 0, goldLost: 0 }
  const fateReady = canDrawFateCard(player)
  const fateCd = getFateCardCooldownRemaining(player)

  function handleBet() {
    const amount = Math.floor(Number(bet))
    if (!Number.isFinite(amount) || amount < 1) {
      hapticError()
      return
    }
    if (amount > player!.gold) {
      hapticError()
      return
    }
    setSpinning(true)
    setTimeout(() => {
      const outcome = playFairBet(amount, pick)
      if (!outcome) {
        hapticError()
        setSpinning(false)
        return
      }
      setLastResult(outcome.result)
      setLastWin(outcome.won)
      setLastPayout(outcome.payout)
      if (outcome.won) {
        hapticSuccess()
        playSfx('victory')
      } else {
        hapticError()
        playSfx('defeat')
      }
      setSpinning(false)
    }, 600)
  }

  function handleFateCard(type: FateCardType) {
    if (!fateReady) {
      hapticError()
      return
    }
    const ok = drawFateCard(type)
    if (!ok) {
      hapticError()
      return
    }
    setLastFateCard(type)
    hapticSuccess()
    playSfx('victory')
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{t('fair.title')}</h1>
          <p className="text-xs text-slate-400">{t('fair.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="wheel" className="p-4">
        <TabsList className="w-full">
          <TabsTrigger value="wheel" className="flex-1 text-xs">{t('fair.tabWheel')}</TabsTrigger>
          <TabsTrigger value="fate" className="flex-1 text-xs">{t('fair.tabFate')}</TabsTrigger>
        </TabsList>

        <TabsContent value="wheel" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-400 mb-2">{t('fair.wallet')}</p>
              <p className="text-2xl font-bold text-aether-gold">🪙 {formatNumber(player.gold)}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            {COLORS.map((color) => {
              const meta = FAIR_COLOR_LABELS[color]
              const selected = pick === color
              return (
                <Button
                  key={color}
                  variant={selected ? 'default' : 'secondary'}
                  className={`h-20 flex-col gap-1 ${color === 'red' ? 'border-red-500/50' : ''} ${color === 'black' ? 'border-slate-500/50' : ''} ${color === 'green' ? 'border-green-500/50' : ''}`}
                  onClick={() => setPick(color)}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[10px]">{meta.ru}</span>
                  <span className="text-[9px] text-aether-cyan">×{FAIR_PAYOUTS[color]}</span>
                </Button>
              )
            })}
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <label className="text-xs text-slate-400">{t('fair.betAmount')}</label>
              <input
                type="number"
                min={1}
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
              />
              <div className="flex gap-2">
                {[50, 100, 500, 1000].map((v) => (
                  <Button key={v} size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setBet(String(v))}>
                    {v}
                  </Button>
                ))}
              </div>
              <Button className="w-full h-12" disabled={spinning} onClick={handleBet}>
                {spinning ? t('fair.spinning') : t('fair.play')}
              </Button>
            </CardContent>
          </Card>

          {lastResult && (
            <Card className={lastWin ? 'border-aether-cyan glow-cyan' : 'border-aether-danger/50'}>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-slate-300">
                  {t('fair.result')}: {FAIR_COLOR_LABELS[lastResult].emoji} {FAIR_COLOR_LABELS[lastResult].ru}
                </p>
                <p className={`text-lg font-bold mt-1 ${lastWin ? 'text-aether-cyan' : 'text-aether-danger'}`}>
                  {lastWin ? `+${formatNumber(lastPayout)} 🪙` : t('fair.lost')}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-medium text-white mb-3">{t('fair.statsTitle')}</h2>
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-aether-bg rounded-lg p-2">
                  <div className="text-slate-500">{t('fair.gamesPlayed')}</div>
                  <div className="text-lg font-bold text-white">{stats.gamesPlayed}</div>
                </div>
                <div className="bg-aether-bg rounded-lg p-2">
                  <div className="text-slate-500">{t('fair.gamesWon')}</div>
                  <div className="text-lg font-bold text-aether-cyan">{stats.gamesWon}</div>
                </div>
                <div className="bg-aether-bg rounded-lg p-2">
                  <div className="text-slate-500">{t('fair.gamesLost')}</div>
                  <div className="text-lg font-bold text-aether-danger">{stats.gamesLost}</div>
                </div>
                <div className="bg-aether-bg rounded-lg p-2">
                  <div className="text-slate-500">{t('fair.netGold')}</div>
                  <div className={`text-lg font-bold ${stats.goldWon - stats.goldLost >= 0 ? 'text-aether-gold' : 'text-aether-danger'}`}>
                    {stats.goldWon - stats.goldLost >= 0 ? '+' : ''}{formatNumber(stats.goldWon - stats.goldLost)}
                  </div>
                </div>
                <div className="bg-aether-bg rounded-lg p-2">
                  <div className="text-slate-500">{t('fair.goldWon')}</div>
                  <div className="text-sm font-bold text-aether-cyan">+{formatNumber(stats.goldWon)}</div>
                </div>
                <div className="bg-aether-bg rounded-lg p-2">
                  <div className="text-slate-500">{t('fair.goldLost')}</div>
                  <div className="text-sm font-bold text-aether-danger">−{formatNumber(stats.goldLost)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fate" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 text-center space-y-2">
              <p className="text-xs text-slate-400">{t('fair.fateIntro')}</p>
              {fateReady ? (
                <p className="text-sm text-aether-cyan font-medium">{t('fair.fateReady')}</p>
              ) : (
                <p className="text-sm text-slate-300">
                  {t('fair.fateCooldown')}: <span className="text-aether-gold">{formatFateCardCountdown(fateCd)}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {FATE_TYPES.map((type) => {
              const card = FATE_CARDS[type]
              const activeUntil = type === 'gold' ? player.buffFateGoldUntil : player.buffFateExpUntil
              const active = isBuffActive(activeUntil)
              return (
                <Card
                  key={type}
                  className={`${active ? 'border-aether-cyan/60 glow-cyan' : ''} ${type === 'gold' ? 'border-aether-gold/30' : 'border-aether-purple/30'}`}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <span className="text-4xl">{card.emoji}</span>
                    <p className="text-sm font-bold text-white">{card.nameRu}</p>
                    <p className="text-[10px] text-slate-400">{card.descriptionRu}</p>
                    {active && activeUntil && (
                      <p className="text-[10px] text-aether-cyan">
                        {t('fair.fateActive')}: {formatBuffRemaining(activeUntil)}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-1"
                      variant={type === 'gold' ? 'gold' : 'default'}
                      disabled={!fateReady}
                      onClick={() => handleFateCard(type)}
                    >
                      {t('fair.fateDraw')}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {lastFateCard && (
            <Card className="border-aether-cyan glow-cyan">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-slate-300">
                  {t('fair.fateDrawn')}: {FATE_CARDS[lastFateCard].emoji} {FATE_CARDS[lastFateCard].nameRu}
                </p>
                <p className="text-xs text-aether-cyan mt-1">{FATE_CARDS[lastFateCard].descriptionRu}</p>
              </CardContent>
            </Card>
          )}

          <p className="text-[10px] text-slate-500 text-center px-2">
            {t('fair.fateHint')}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
