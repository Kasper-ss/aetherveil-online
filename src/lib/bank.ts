export const BANK_RATE_TIERS = [
  { maxBalance: 999_999, rate: 0.01 },
  { maxBalance: 9_999_999, rate: 0.008 },
  { maxBalance: Infinity, rate: 0.005 },
] as const

/** @deprecated use getBankDailyRate(balance) */
export const BANK_DAILY_RATE = BANK_RATE_TIERS[0].rate

export function getBankDailyRate(balance: number): number {
  if (balance >= 10_000_000) return BANK_RATE_TIERS[2].rate
  if (balance >= 1_000_000) return BANK_RATE_TIERS[1].rate
  return BANK_RATE_TIERS[0].rate
}

export function calcBankInterest(balance: number, lastInterestAt: string | undefined, now = Date.now()): number {
  if (balance <= 0) return 0
  const last = new Date(lastInterestAt ?? new Date(now).toISOString()).getTime()
  const days = (now - last) / 86_400_000
  if (days < 1 / 1440) return 0 // меньше минуты — не начисляем
  return Math.floor(balance * getBankDailyRate(balance) * days)
}

export function calcPendingInterestPercent(balance: number, pendingGold: number): number {
  if (balance <= 0 || pendingGold <= 0) return 0
  return Math.round((pendingGold / balance) * 1000) / 10
}

export function formatPendingInterestPercent(balance: number, pendingGold: number): string {
  const pct = calcPendingInterestPercent(balance, pendingGold)
  return pct > 0 ? `${pct.toFixed(1)}%` : '0%'
}

export function formatRatePercent(rate: number): string {
  const pct = rate * 100
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`
}

export function formatBankRate(balance = 0): string {
  return `${formatRatePercent(getBankDailyRate(balance))} в день`
}

export function formatBankRateTiers(): string[] {
  return [
    `до 1 000 000 — ${formatRatePercent(BANK_RATE_TIERS[0].rate)} в день`,
    `1 000 000–9 999 999 — ${formatRatePercent(BANK_RATE_TIERS[1].rate)} в день`,
    `от 10 000 000 — ${formatRatePercent(BANK_RATE_TIERS[2].rate)} в день`,
  ]
}

export function formatInterestEta(balance: number, lastInterestAt: string | undefined): string {
  if (balance <= 0) return '—'
  const nextGold = Math.max(1, Math.floor(balance * getBankDailyRate(balance)))
  const last = new Date(lastInterestAt ?? Date.now()).getTime()
  const msUntilDay = 86_400_000 - ((Date.now() - last) % 86_400_000)
  const h = Math.floor(msUntilDay / 3_600_000)
  const m = Math.ceil((msUntilDay % 3_600_000) / 60_000)
  return `+${nextGold} 🪙 через ~${h > 0 ? `${h}ч ` : ''}${m} мин`
}
