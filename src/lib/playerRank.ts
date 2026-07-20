import type { Player } from '@/types/game'
import { getPlayerCombatPower } from '@/lib/combatScaling'
import { countClaimedAchievements } from '@/data/achievements'

export type PlayerRankId = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+'

export interface RankRequirements {
  level: number
  highestFloor: number
  combatPower: number
  achievementsClaimed: number
  pvpWins: number
}

export interface RankBonuses {
  goldPct: number
  expPct: number
  lootPct: number
  craftDiscountPct: number
  allStatsPct: number
}

export interface RankTier {
  id: PlayerRankId
  labelRu: string
  requirements: RankRequirements
  bonuses: RankBonuses
  badgeClass: string
}

export const RANK_ORDER: PlayerRankId[] = ['E', 'D', 'C', 'B', 'A', 'S', 'S+']

export const RANK_TIERS: RankTier[] = [
  {
    id: 'E',
    labelRu: 'E — Новичок',
    requirements: { level: 1, highestFloor: 1, combatPower: 0, achievementsClaimed: 0, pvpWins: 0 },
    bonuses: { goldPct: 0, expPct: 0, lootPct: 0, craftDiscountPct: 0, allStatsPct: 0 },
    badgeClass: 'bg-slate-600/80 text-slate-200 border-slate-500/50',
  },
  {
    id: 'D',
    labelRu: 'D — Ученик',
    requirements: { level: 8, highestFloor: 12, combatPower: 800, achievementsClaimed: 3, pvpWins: 0 },
    bonuses: { goldPct: 0.02, expPct: 0.02, lootPct: 0.01, craftDiscountPct: 0.01, allStatsPct: 0.01 },
    badgeClass: 'bg-amber-900/70 text-amber-200 border-amber-700/60',
  },
  {
    id: 'C',
    labelRu: 'C — Боец',
    requirements: { level: 20, highestFloor: 30, combatPower: 3500, achievementsClaimed: 10, pvpWins: 0 },
    bonuses: { goldPct: 0.05, expPct: 0.05, lootPct: 0.03, craftDiscountPct: 0.02, allStatsPct: 0.02 },
    badgeClass: 'bg-emerald-900/70 text-emerald-200 border-emerald-600/60',
  },
  {
    id: 'B',
    labelRu: 'B — Ветеран',
    requirements: { level: 40, highestFloor: 55, combatPower: 12000, achievementsClaimed: 25, pvpWins: 2 },
    bonuses: { goldPct: 0.08, expPct: 0.08, lootPct: 0.05, craftDiscountPct: 0.04, allStatsPct: 0.04 },
    badgeClass: 'bg-blue-900/70 text-blue-200 border-blue-500/60',
  },
  {
    id: 'A',
    labelRu: 'A — Элита',
    requirements: { level: 65, highestFloor: 85, combatPower: 40000, achievementsClaimed: 45, pvpWins: 8 },
    bonuses: { goldPct: 0.12, expPct: 0.12, lootPct: 0.07, craftDiscountPct: 0.06, allStatsPct: 0.06 },
    badgeClass: 'bg-purple-900/70 text-purple-200 border-purple-500/60',
  },
  {
    id: 'S',
    labelRu: 'S — Мастер',
    requirements: { level: 95, highestFloor: 120, combatPower: 120000, achievementsClaimed: 70, pvpWins: 20 },
    bonuses: { goldPct: 0.18, expPct: 0.18, lootPct: 0.10, craftDiscountPct: 0.09, allStatsPct: 0.08 },
    badgeClass: 'bg-orange-900/70 text-orange-200 border-orange-500/60 glow-gold',
  },
  {
    id: 'S+',
    labelRu: 'S+ — Легенда',
    requirements: { level: 120, highestFloor: 160, combatPower: 300000, achievementsClaimed: 95, pvpWins: 40 },
    bonuses: { goldPct: 0.25, expPct: 0.25, lootPct: 0.14, craftDiscountPct: 0.12, allStatsPct: 0.10 },
    badgeClass: 'bg-gradient-to-r from-aether-gold/90 to-orange-500/90 text-aether-bg border-aether-gold glow-gold',
  },
]

export interface RankInput {
  level: number
  highestFloor: number
  combatPower?: number
  achievementsClaimed?: number
  pvpWins?: number
}

export function getRankTier(rank: PlayerRankId): RankTier {
  return RANK_TIERS.find((t) => t.id === rank) ?? RANK_TIERS[0]
}

export function getRankInputFromPlayer(player: Player): RankInput {
  return {
    level: player.level,
    highestFloor: player.highestFloor,
    combatPower: getPlayerCombatPower(player),
    achievementsClaimed: countClaimedAchievements(player),
    pvpWins: player.pvpWins ?? 0,
  }
}

function meetsRequirements(input: RankInput, req: RankRequirements): boolean {
  return input.level >= req.level
    && input.highestFloor >= req.highestFloor
    && (input.combatPower ?? 0) >= req.combatPower
    && (input.achievementsClaimed ?? 0) >= req.achievementsClaimed
    && (input.pvpWins ?? 0) >= req.pvpWins
}

export function getPlayerRank(input: RankInput): PlayerRankId {
  let rank: PlayerRankId = 'E'
  for (const tier of RANK_TIERS) {
    if (meetsRequirements(input, tier.requirements)) rank = tier.id
  }
  return rank
}

export function getPlayerRankFromPlayer(player: Player): PlayerRankId {
  return getPlayerRank(getRankInputFromPlayer(player))
}

export function getRankBonuses(rank: PlayerRankId): RankBonuses {
  return getRankTier(rank).bonuses
}

export function getRankMultipliers(player: Player) {
  const b = getRankBonuses(getPlayerRankFromPlayer(player))
  return {
    exp: 1 + b.expPct,
    gold: 1 + b.goldPct,
    loot: 1 + b.lootPct,
    allStats: 1 + b.allStatsPct,
    craftDiscount: b.craftDiscountPct,
  }
}

export function getRankCraftDiscount(player: Player): number {
  return getRankBonuses(getPlayerRankFromPlayer(player)).craftDiscountPct
}

const REQ_LABELS: Record<keyof RankRequirements, string> = {
  level: 'Уровень',
  highestFloor: 'Макс. этаж',
  combatPower: 'Боевая мощь',
  achievementsClaimed: 'Достижения',
  pvpWins: 'PvP-победы',
}

export interface RankRequirementProgress {
  key: keyof RankRequirements
  label: string
  current: number
  required: number
  met: boolean
  pct: number
}

export interface RankProgress {
  currentRank: PlayerRankId
  nextRank: PlayerRankId | null
  requirements: RankRequirementProgress[]
  overallPct: number
}

export function getRankProgress(input: RankInput): RankProgress {
  const currentRank = getPlayerRank(input)
  const currentIdx = RANK_ORDER.indexOf(currentRank)
  const nextRank = currentIdx < RANK_ORDER.length - 1 ? RANK_ORDER[currentIdx + 1] : null

  if (!nextRank) {
    return { currentRank, nextRank: null, requirements: [], overallPct: 100 }
  }

  const req = getRankTier(nextRank).requirements
  const requirements: RankRequirementProgress[] = (Object.keys(req) as (keyof RankRequirements)[]).map((key) => {
    const required = req[key]
    const current = key === 'level' ? input.level
      : key === 'highestFloor' ? input.highestFloor
      : key === 'combatPower' ? (input.combatPower ?? 0)
      : key === 'achievementsClaimed' ? (input.achievementsClaimed ?? 0)
      : (input.pvpWins ?? 0)
    const pct = required <= 0 ? 100 : Math.min(100, Math.floor((current / required) * 100))
    return {
      key,
      label: REQ_LABELS[key],
      current,
      required,
      met: current >= required,
      pct,
    }
  })

  const overallPct = Math.floor(requirements.reduce((sum, r) => sum + r.pct, 0) / requirements.length)
  return { currentRank, nextRank, requirements, overallPct }
}

export function formatRankBonusLines(rank: PlayerRankId): string[] {
  const b = getRankBonuses(rank)
  if (rank === 'E') return ['Базовый ранг без бонусов']
  const lines: string[] = []
  if (b.goldPct > 0) lines.push(`+${Math.round(b.goldPct * 100)}% к золоту`)
  if (b.expPct > 0) lines.push(`+${Math.round(b.expPct * 100)}% к опыту`)
  if (b.lootPct > 0) lines.push(`+${Math.round(b.lootPct * 100)}% к луту`)
  if (b.craftDiscountPct > 0) lines.push(`−${Math.round(b.craftDiscountPct * 100)}% стоимость крафта`)
  if (b.allStatsPct > 0) lines.push(`+${Math.round(b.allStatsPct * 100)}% ко всем статам`)
  return lines
}
