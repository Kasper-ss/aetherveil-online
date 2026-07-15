export interface PromoReward {
  gold?: number
  gems?: number
  goldBuffPct?: number
  goldBuffHours?: number
}

export const PROMO_CODES: Record<string, PromoReward> = {
  IAMWIN: {
    gold: 50_000,
    gems: 20,
    goldBuffPct: 70,
    goldBuffHours: 2,
  },
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}

export function getPromoReward(code: string): PromoReward | null {
  return PROMO_CODES[normalizePromoCode(code)] ?? null
}
