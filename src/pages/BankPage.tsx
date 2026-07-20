import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StockMarketPanel } from '@/components/ui/StockMarketPanel'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { formatNumber } from '@/lib/utils'
import { formatBankRate, formatBankRateTiers, formatInterestEta, formatPendingInterestPercent } from '@/lib/bank'
import { hapticError, hapticSuccess } from '@/lib/telegram'

export function BankPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const depositToBank = usePlayerStore((s) => s.depositToBank)
  const withdrawFromBank = usePlayerStore((s) => s.withdrawFromBank)
  const accrueBankInterest = usePlayerStore((s) => s.accrueBankInterest)
  const collectBankInterest = usePlayerStore((s) => s.collectBankInterest)
  const [amount, setAmount] = useState('')
  const [, tick] = useState(0)

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    accrueBankInterest()
    const id = setInterval(() => {
      accrueBankInterest()
      tick((n) => n + 1)
    }, 60_000)
    return () => clearInterval(id)
  }, [accrueBankInterest])

  if (!player) return null

  const bankBalance = player.bankBalance ?? 0
  const pendingInterest = player.bankPendingInterest ?? 0
  const walletGold = player.gold
  const parsed = parseInt(amount, 10)
  const pendingPercent = formatPendingInterestPercent(bankBalance, pendingInterest)

  function handleDeposit() {
    if (!parsed || parsed < 1) { hapticError(); return }
    if (depositToBank(parsed)) {
      setAmount('')
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  function handleWithdraw() {
    if (!parsed || parsed < 1) { hapticError(); return }
    if (withdrawFromBank(parsed)) {
      setAmount('')
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  function handleCollectInterest() {
    if (collectBankInterest()) {
      hapticSuccess()
    } else {
      hapticError()
    }
  }

  function setMaxDeposit() {
    setAmount(String(walletGold))
  }

  function setMaxWithdraw() {
    setAmount(String(bankBalance))
  }

  return (
    <div className="h-full overflow-y-auto page-enter pb-6">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Landmark className="h-5 w-5 text-aether-gold" />
          {t('bank.title')}
        </h1>
      </div>

      <Tabs defaultValue="deposit" className="p-4">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="deposit" className="flex-1 text-xs">Депозит</TabsTrigger>
          <TabsTrigger value="stocks" className="flex-1 text-xs">Акции</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4 mt-0">
          <Card className="border-aether-gold/30">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">{t('bank.balance')}</p>
              <p className="text-3xl font-bold text-aether-gold">🪙 {formatNumber(bankBalance)}</p>
              <p className="text-[10px] text-slate-500 mt-2">
                {t('bank.rate')}: {formatBankRate(bankBalance)}
              </p>
              <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                {formatBankRateTiers().map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="text-[10px] text-aether-cyan mt-1">
                {formatInterestEta(bankBalance, player.bankLastInterestAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-aether-cyan/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Накопленный процент за время отсутствия:</span>
                <span className="text-aether-cyan font-bold">{pendingPercent}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">К зачислению на счёт:</span>
                <span className="text-white font-medium">🪙 {formatNumber(pendingInterest)}</span>
              </div>
              <Button
                className="w-full"
                variant="secondary"
                disabled={pendingInterest < 1}
                onClick={handleCollectInterest}
              >
                Собрать процент
              </Button>
              <p className="text-[10px] text-slate-500 text-center">
                Процент зачисляется на основной кошелёк, не на депозит в банке.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('bank.wallet')}</span>
                <span className="text-white">🪙 {formatNumber(walletGold)}</span>
              </div>
              <p className="text-[10px] text-slate-500">{t('bank.hint')}</p>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
                placeholder={t('bank.amountPlaceholder')}
                min={1}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={setMaxDeposit} disabled={walletGold < 1}>
                  {t('bank.maxDeposit')}
                </Button>
                <Button variant="secondary" size="sm" onClick={setMaxWithdraw} disabled={bankBalance < 1}>
                  {t('bank.maxWithdraw')}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleDeposit} disabled={!parsed || parsed > walletGold}>
                  {t('bank.deposit')}
                </Button>
                <Button variant="gold" onClick={handleWithdraw} disabled={!parsed || parsed > bankBalance}>
                  {t('bank.withdraw')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="mt-0">
          <StockMarketPanel player={player} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
