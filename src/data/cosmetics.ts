import type { StarProductId } from '@/data/starShop'

const COSMETIC_STAR_PRODUCTS: Record<string, StarProductId> = {
  telegram_hero: 'cosmetic_avatar_telegram_hero',
  mythic_starter: 'cosmetic_avatar_mythic_starter',
  gold: 'cosmetic_frame_gold',
  legendary: 'cosmetic_frame_legendary',
  mythic: 'cosmetic_frame_mythic',
}

export function getCosmeticStarProductId(cosmeticId: string): StarProductId | null {
  return COSMETIC_STAR_PRODUCTS[cosmeticId] ?? null
}

export interface CosmeticOption {
  id: string
  label: string
  stars: number
  preview: string
  type: 'avatar' | 'frame'
}

export const AVATAR_OPTIONS: CosmeticOption[] = [
  { id: 'default', label: 'Стандарт', stars: 0, preview: '⚔️', type: 'avatar' },
  { id: 'warrior', label: 'Воин', stars: 0, preview: '🛡️', type: 'avatar' },
  { id: 'mage', label: 'Маг', stars: 0, preview: '🔮', type: 'avatar' },
  { id: 'archer', label: 'Лучник', stars: 0, preview: '🏹', type: 'avatar' },
  { id: 'telegram_hero', label: 'Герой Telegram', stars: 150, preview: '✈️', type: 'avatar' },
  { id: 'mythic_starter', label: 'Мифический', stars: 300, preview: '💎', type: 'avatar' },
]

export const FRAME_OPTIONS: CosmeticOption[] = [
  { id: 'none', label: 'Без рамки', stars: 0, preview: '—', type: 'frame' },
  { id: 'cyan', label: 'Эфирная', stars: 0, preview: '◇', type: 'frame' },
  { id: 'gold', label: 'Золотая', stars: 100, preview: '◆', type: 'frame' },
  { id: 'legendary', label: 'Легендарная', stars: 200, preview: '✦', type: 'frame' },
  { id: 'mythic', label: 'Мифическая', stars: 400, preview: '✧', type: 'frame' },
]

export function getAvatarPreview(id?: string): string {
  return AVATAR_OPTIONS.find((a) => a.id === id)?.preview ?? '⚔️'
}

export function getFrameClass(id?: string): string {
  switch (id) {
    case 'gold': return 'ring-2 ring-aether-gold'
    case 'legendary': return 'ring-2 ring-amber-500 glow-purple'
    case 'mythic': return 'ring-2 ring-fuchsia-500 glow-cyan'
    case 'cyan': return 'ring-2 ring-aether-cyan'
    default: return 'ring-2 ring-aether-border'
  }
}
