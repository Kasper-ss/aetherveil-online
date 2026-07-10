export type FairColor = 'red' | 'black' | 'green'

export const FAIR_PAYOUTS: Record<FairColor, number> = {
  red: 2,
  black: 2,
  green: 7,
}

/** Weighted spin: red 45%, black 45%, green 10% */
export function spinFairWheel(): FairColor {
  const r = Math.random()
  if (r < 0.45) return 'red'
  if (r < 0.90) return 'black'
  return 'green'
}

export function calcFairPayout(bet: number, pick: FairColor, result: FairColor): number {
  if (pick !== result) return 0
  return bet * FAIR_PAYOUTS[pick]
}

export const FAIR_COLOR_LABELS: Record<FairColor, { ru: string; en: string; emoji: string }> = {
  red: { ru: 'Красное', en: 'Red', emoji: '🔴' },
  black: { ru: 'Чёрное', en: 'Black', emoji: '⚫' },
  green: { ru: 'Зелёное', en: 'Green', emoji: '🟢' },
}
