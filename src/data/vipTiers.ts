export interface VipTier {
  level: number
  stars: number
  expPct: number
  lootPct: number
  goldPct: number
  labelRu: string
}

export const VIP_TIERS: VipTier[] = [
  { level: 1, stars: 250, expPct: 0.15, lootPct: 0.40, goldPct: 0.19, labelRu: 'VIP I' },
  { level: 2, stars: 500, expPct: 0.30, lootPct: 0.60, goldPct: 0.30, labelRu: 'VIP II' },
  { level: 3, stars: 1000, expPct: 0.50, lootPct: 0.80, goldPct: 0.39, labelRu: 'VIP III' },
  { level: 4, stars: 2100, expPct: 0.70, lootPct: 1.00, goldPct: 0.50, labelRu: 'VIP IV' },
  { level: 5, stars: 3800, expPct: 0.95, lootPct: 1.50, goldPct: 0.60, labelRu: 'VIP V' },
  { level: 6, stars: 6500, expPct: 1.20, lootPct: 2.00, goldPct: 0.70, labelRu: 'VIP VI' },
]

export function getVipTier(level: number): VipTier | null {
  return VIP_TIERS.find((t) => t.level === level) ?? null
}

/** Стоимость апгрейда до targetLevel с учётом уже оплаченного VIP. */
export function getVipUpgradeStars(currentLevel: number, targetLevel: number): number {
  const target = getVipTier(targetLevel)
  if (!target) return 0
  const paid = currentLevel > 0 ? (getVipTier(currentLevel)?.stars ?? 0) : 0
  return Math.max(0, target.stars - paid)
}

export function getNextVipLevel(currentLevel: number): number | null {
  if (currentLevel >= VIP_TIERS.length) return null
  return currentLevel + 1
}
