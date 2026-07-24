/** Официальный курс Telegram Stars ≈ 1.15 ₽ за Star */
export const STAR_TO_RUB = 1.15

export type StarProductId =
  | 'starter_boost'
  | 'infinite_energy_24h'
  | 'double_exp_7d'
  | 'stat_reset'
  | 'triple_gold_3d'
  | 'mythic_starter_pack'
  | 'extra_profession_slot'
  | 'cosmetic_avatar_telegram_hero'
  | 'cosmetic_avatar_mythic_starter'
  | 'cosmetic_frame_gold'
  | 'cosmetic_frame_legendary'
  | 'cosmetic_frame_mythic'
  | 'vip_upgrade'
  | 'city_build_rush'
  /** @deprecated Removed from shop; kept for legacy payment fulfillment */
  | 'telegram_hero_set'
  | 'mythic_craft_pack'
  | 'daily_bonus_50_30d'

export interface StarShopProduct {
  id: StarProductId
  nameRu: string
  descriptionRu: string
  stars: number
  icon: string
  dynamicVip?: boolean
}

export const STAR_SHOP_PRODUCTS: StarShopProduct[] = [
  {
    id: 'starter_boost',
    nameRu: 'Набор Стартового Буста',
    descriptionRu: '100 000 Gold, 100 Gems, 3 случайных редких предмета.',
    stars: 150,
    icon: '🎁',
  },
  {
    id: 'infinite_energy_24h',
    nameRu: 'Бесконечная Энергия на 24 часа',
    descriptionRu: 'Энергия не тратится в течение 24 часов.',
    stars: 200,
    icon: '⚡',
  },
  {
    id: 'double_exp_7d',
    nameRu: 'Двойной EXP на 7 дней',
    descriptionRu: 'x2 опыт за бои, простой и награды.',
    stars: 250,
    icon: '📈',
  },
  {
    id: 'stat_reset',
    nameRu: 'Сброс очков характеристик',
    descriptionRu: 'Один раз перераспределить все вложенные статы.',
    stars: 100,
    icon: '🔄',
  },
  {
    id: 'triple_gold_3d',
    nameRu: 'Тройной Gold на 3 дня',
    descriptionRu: 'x3 золото с боёв, простоя и наград.',
    stars: 200,
    icon: '🪙',
  },
  {
    id: 'mythic_starter_pack',
    nameRu: 'Мифический Стартер Пак',
    descriptionRu: 'Мифический аватар + легендарный сет + 100 Gems + 10000 Gold.',
    stars: 800,
    icon: '💎',
  },
  {
    id: 'extra_profession_slot',
    nameRu: '+1 слот профессии',
    descriptionRu: 'Дополнительный активный слот профессии (макс. 5).',
    stars: 350,
    icon: '📚',
  },
  {
    id: 'vip_upgrade',
    nameRu: 'VIP-статус',
    descriptionRu: 'Постоянные бонусы к опыту, дропу и золоту. Следующий уровень дешевле с учётом текущего.',
    stars: 250,
    icon: '👑',
    dynamicVip: true,
  },
  {
    id: 'city_build_rush',
    nameRu: 'Ускорение стройки',
    descriptionRu: 'Мгновенно завершить текущую постройку или улучшение в городе.',
    stars: 75,
    icon: '🏗️',
  },
]

export function starsToRubles(stars: number): number {
  return Math.round(stars * STAR_TO_RUB)
}

export function formatStarsRubles(stars: number): string {
  return `≈ ${starsToRubles(stars)} ₽`
}

export function formatStarsPriceLabel(stars: number): string {
  return `${stars} ⭐ ${formatStarsRubles(stars)}`
}
