export const BANK_HOURLY_RATE = 0.01 // 1% в час

export function calcBankInterest(balance: number, lastInterestAt: string | undefined, now = Date.now()): number {
  if (balance <= 0) return 0
  const last = new Date(lastInterestAt ?? new Date(now).toISOString()).getTime()
  const hours = (now - last) / 3_600_000
  if (hours < 1 / 60) return 0 // меньше минуты — не начисляем
  return Math.floor(balance * BANK_HOURLY_RATE * hours)
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
  return `${(BANK_HOURLY_RATE * 100).toFixed(0)}% в час`
}

export function formatInterestEta(balance: number, lastInterestAt: string | undefined): string {
  if (balance <= 0) return '—'
  const nextGold = Math.max(1, Math.floor(balance * BANK_HOURLY_RATE))
  const last = new Date(lastInterestAt ?? Date.now()).getTime()
  const msUntilHour = 3_600_000 - ((Date.now() - last) % 3_600_000)
  const m = Math.ceil(msUntilHour / 60_000)
  return `+${nextGold} 🪙 через ~${m} мин`
}
