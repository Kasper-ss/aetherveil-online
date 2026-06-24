export type StarProductId =
  | 'starter_boost'
  | 'infinite_energy_24h'
  | 'double_exp_7d'
  | 'stat_reset'
  | 'telegram_hero_set'
  | 'mythic_craft_pack'
  | 'triple_gold_3d'
  | 'daily_bonus_50_30d'
  | 'mythic_starter_pack'

export interface StarProduct {
  id: StarProductId
  nameRu: string
  descriptionRu: string
  stars: number
}

export const STAR_PRODUCTS: Record<StarProductId, StarProduct> = {
  starter_boost: {
    id: 'starter_boost',
    nameRu: 'Набор Стартового Буста',
    descriptionRu: '5000 Gold, 50 Gems, 3 случайных редких предмета.',
    stars: 150,
  },
  infinite_energy_24h: {
    id: 'infinite_energy_24h',
    nameRu: 'Бесконечная Энергия на 24 часа',
    descriptionRu: 'Энергия не тратится в течение 24 часов.',
    stars: 200,
  },
  double_exp_7d: {
    id: 'double_exp_7d',
    nameRu: 'Двойной EXP на 7 дней',
    descriptionRu: 'x2 опыт за бои, простой и награды.',
    stars: 250,
  },
  stat_reset: {
    id: 'stat_reset',
    nameRu: 'Сброс очков характеристик',
    descriptionRu: 'Один раз перераспределить все вложенные статы.',
    stars: 100,
  },
  telegram_hero_set: {
    id: 'telegram_hero_set',
    nameRu: 'Сет «Герой Телеграм»',
    descriptionRu: 'Полный легендарный сет с уникальной аурой и бонусами.',
    stars: 1000,
  },
  mythic_craft_pack: {
    id: 'mythic_craft_pack',
    nameRu: 'Набор Ресурсов для Мифического Крафта',
    descriptionRu: 'Материалы для одного мифического улучшения.',
    stars: 500,
  },
  triple_gold_3d: {
    id: 'triple_gold_3d',
    nameRu: 'Тройной Gold на 3 дня',
    descriptionRu: 'x3 золото с боёв, простоя и наград.',
    stars: 200,
  },
  daily_bonus_50_30d: {
    id: 'daily_bonus_50_30d',
    nameRu: '+50 Ежедневных Бонусов',
    descriptionRu: '+50 Gold и +5 Gems к ежедневной награде на 30 дней.',
    stars: 300,
  },
  mythic_starter_pack: {
    id: 'mythic_starter_pack',
    nameRu: 'Мифический Стартер Пак',
    descriptionRu: 'Мифический аватар + легендарный сет + 100 Gems + 10000 Gold.',
    stars: 800,
  },
}

export function getStarProduct(productId: string): StarProduct | null {
  return STAR_PRODUCTS[productId as StarProductId] ?? null
}

export function isStarProductId(productId: string): productId is StarProductId {
  return productId in STAR_PRODUCTS
}
