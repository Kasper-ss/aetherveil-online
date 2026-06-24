import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { formatNumber } from '@/lib/utils'
import { formatBankRate, formatInterestEta } from '@/lib/bank'
import { hapticError, hapticSuccess } from '@/lib/telegram'

export function BankPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const depositToBank = usePlayerStore((s) => s.depositToBank)
  const withdrawFromBank = usePlayerStore((s) => s.withdrawFromBank)
  const accrueBankInterest = usePlayerStore((s) => s.accrueBankInterest)
  const [amount, setAmount] = useState('')

  useTelegramBackButton(() => navigate('/'), true)

  useEffect(() => {
    accrueBankInterest()
  }, [accrueBankInterest])

  if (!player) return null

  const bankBalance = player.bankBalance ?? 0
  const walletGold = player.gold
  const parsed = parseInt(amount, 10)

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

      <div className="p-4 space-y-4">
        <Card className="border-aether-gold/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">{t('bank.balance')}</p>
            <p className="text-3xl font-bold text-aether-gold">🪙 {formatNumber(bankBalance)}</p>
            <p className="text-[10px] text-slate-500 mt-2">
              {t('bank.rate')}: {formatBankRate()}
            </p>
            <p className="text-[10px] text-aether-cyan mt-1">
              {formatInterestEta(bankBalance, player.bankLastInterestAt)}
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
      </div>
    </div>
  )
}
