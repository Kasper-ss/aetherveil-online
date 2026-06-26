import type { Player } from '@/types/game'

export type FateCardType = 'gold' | 'exp'

export const FATE_CARD_COOLDOWN_MS = 6 * 60 * 60 * 1000
export const FATE_CARD_BUFF_DURATION_MS = 2 * 60 * 60 * 1000
export const FATE_GOLD_MULTIPLIER = 1.75
export const FATE_EXP_MULTIPLIER = 1.75

export const FATE_CARDS: Record<FateCardType, {
  id: FateCardType
  nameRu: string
  nameEn: string
  emoji: string
  descriptionRu: string
  descriptionEn: string
  multiplier: number
}> = {
  gold: {
    id: 'gold',
    nameRu: 'Золотая Судьба',
    nameEn: 'Golden Fate',
    emoji: '🃏',
    descriptionRu: `+${Math.round((FATE_GOLD_MULTIPLIER - 1) * 100)}% золото на 2 ч`,
    descriptionEn: `+${Math.round((FATE_GOLD_MULTIPLIER - 1) * 100)}% gold for 2h`,
    multiplier: FATE_GOLD_MULTIPLIER,
  },
  exp: {
    id: 'exp',
    nameRu: 'Судьба Мудрости',
    nameEn: 'Fate of Wisdom',
    emoji: '🎴',
    descriptionRu: `+${Math.round((FATE_EXP_MULTIPLIER - 1) * 100)}% опыт на 2 ч`,
    descriptionEn: `+${Math.round((FATE_EXP_MULTIPLIER - 1) * 100)}% EXP for 2h`,
    multiplier: FATE_EXP_MULTIPLIER,
  },
}

export function getFateCardCooldownRemaining(player: Player): number {
  if (!player.fateCardLastUsedAt) return 0
  const next = new Date(player.fateCardLastUsedAt).getTime() + FATE_CARD_COOLDOWN_MS
  return Math.max(0, next - Date.now())
}

export function canDrawFateCard(player: Player): boolean {
  return getFateCardCooldownRemaining(player) <= 0
}

export function formatFateCardCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`
  }
  return `${totalMin}м`
}
