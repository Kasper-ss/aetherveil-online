export const VIP_TIERS = [
  { level: 1, stars: 250 },
  { level: 2, stars: 500 },
  { level: 3, stars: 1000 },
  { level: 4, stars: 2100 },
  { level: 5, stars: 3800 },
  { level: 6, stars: 6500 },
]

export function getVipUpgradeStars(currentLevel: number, targetLevel: number): number {
  const target = VIP_TIERS.find((t) => t.level === targetLevel)
  if (!target) return 0
  const paid = currentLevel > 0 ? (VIP_TIERS.find((t) => t.level === currentLevel)?.stars ?? 0) : 0
  return Math.max(0, target.stars - paid)
}

export function getNextVipLevel(currentLevel: number): number | null {
  if (currentLevel >= VIP_TIERS.length) return null
  return currentLevel + 1
}
