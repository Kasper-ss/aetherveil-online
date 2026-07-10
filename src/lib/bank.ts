export const BANK_DAILY_RATE = 0.01 // 1% в день

export function calcBankInterest(balance: number, lastInterestAt: string | undefined, now = Date.now()): number {
  if (balance <= 0) return 0
  const last = new Date(lastInterestAt ?? new Date(now).toISOString()).getTime()
  const days = (now - last) / 86_400_000
  if (days < 1 / 1440) return 0 // меньше минуты — не начисляем
  return Math.floor(balance * BANK_DAILY_RATE * days)
}

export function calcPendingInterestPercent(balance: number, pendingGold: number): number {
  if (balance <= 0 || pendingGold <= 0) return 0
  return Math.round((pendingGold / balance) * 1000) / 10
}

export function formatPendingInterestPercent(balance: number, pendingGold: number): string {
  const pct = calcPendingInterestPercent(balance, pendingGold)
  return pct > 0 ? `${pct.toFixed(1)}%` : '0%'
}

export function formatBankRate(): string {
  return `${(BANK_DAILY_RATE * 100).toFixed(0)}% в день`
}

export function formatInterestEta(balance: number, lastInterestAt: string | undefined): string {
  if (balance <= 0) return '—'
  const nextGold = Math.max(1, Math.floor(balance * BANK_DAILY_RATE))
  const last = new Date(lastInterestAt ?? Date.now()).getTime()
  const msUntilDay = 86_400_000 - ((Date.now() - last) % 86_400_000)
  const h = Math.floor(msUntilDay / 3_600_000)
  const m = Math.ceil((msUntilDay % 3_600_000) / 60_000)
  return `+${nextGold} 🪙 через ~${h > 0 ? `${h}ч ` : ''}${m} мин`
}
