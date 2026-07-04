import type { Player } from '@/types/game'

export const REFERRAL_SIGNUP_GOLD = 500
export const REFERRAL_SIGNUP_GEMS = 5
export const REFERRAL_MILESTONE_THRESHOLD = 100_000
export const REFERRAL_MILESTONE_GOLD = 1_000

export function referralCodeToTelegramId(code: string): number | null {
  if (!code.startsWith('AV')) return null
  const id = parseInt(code.slice(2), 36)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function isReferralActivated(player: Pick<Player, 'classSelected' | 'tutorialCompleted' | 'level' | 'highestFloor'>): boolean {
  if (!player.classSelected) return false
  return player.tutorialCompleted || player.level >= 2 || player.highestFloor > 1
}

export function countActiveReferrals(
  invites: import('@/types/game').ReferralInviteSummary[] | undefined,
): number {
  return (invites ?? []).filter((i) => i.activated).length
}

export function formatReferralGold(n: number): string {
  return n.toLocaleString('ru-RU')
}

export function getReferralUncollectedTotal(
  uncollected: import('@/types/game').ReferralUncollected | undefined,
): number {
  if (!uncollected) return 0
  return uncollected.gold + uncollected.gems + uncollected.items
}

export function parseReferralStartParam(startParam: string | null | undefined): string | null {
  if (!startParam) return null
  if (startParam.startsWith('ref_')) return startParam.slice(4)
  return null
}
