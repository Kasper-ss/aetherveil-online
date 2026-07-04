import type { Player } from '@/types/game'

export interface PropertyDef {
  id: string
  nameRu: string
  descriptionRu: string
  icon: string
  unlockLevel: number
  goldCost: number
  bonusLabelRu: string
  exclusiveTitleId?: string
}

export const REAL_ESTATE_PROPERTIES: PropertyDef[] = [
  {
    id: 'forest_hut',
    nameRu: 'Лесная Хижина',
    descriptionRu: 'Уютное жильё у опушки — отдых ускоряет восстановление сил.',
    icon: '🛖',
    unlockLevel: 5,
    goldCost: 125_000,
    bonusLabelRu: '+5% к скорости восстановления энергии',
  },
  {
    id: 'stone_cottage',
    nameRu: 'Каменный Коттедж',
    descriptionRu: 'Надёжные стены и кладовая для добычи с этажей.',
    icon: '🏠',
    unlockLevel: 10,
    goldCost: 250_000,
    bonusLabelRu: '+10% к золоту с мобов',
  },
  {
    id: 'fortified_house',
    nameRu: 'Укрепленный Дом',
    descriptionRu: 'Бронированные ворота и сторожевая башня.',
    icon: '🏡',
    unlockLevel: 15,
    goldCost: 400_000,
    bonusLabelRu: '+8% к защите',
  },
  {
    id: 'guard_tower',
    nameRu: 'Башня Стража',
    descriptionRu: 'Вид на всю башню — опыт растёт быстрее.',
    icon: '🗼',
    unlockLevel: 20,
    goldCost: 600_000,
    bonusLabelRu: '+12% к опыту с этажей',
  },
  {
    id: 'hunter_villa',
    nameRu: 'Вилла Охотника',
    descriptionRu: 'Охотничьи угодья и сад с редкими травами.',
    icon: '🏹',
    unlockLevel: 25,
    goldCost: 850_000,
    bonusLabelRu: '+15% к ресурсам с рыбалки и сбора трав',
  },
  {
    id: 'master_mansion',
    nameRu: 'Особняк Мастера',
    descriptionRu: 'Мастерская и кузница под одной крышей.',
    icon: '🏛️',
    unlockLevel: 30,
    goldCost: 1_150_000,
    bonusLabelRu: '+10% к успеху крафта и улучшений в Кузнице',
  },
  {
    id: 'seeker_castle',
    nameRu: 'Замок Искателя',
    descriptionRu: 'Коллекция трофеев и охота за редким лутом.',
    icon: '🏰',
    unlockLevel: 35,
    goldCost: 1_500_000,
    bonusLabelRu: '+20% к шансу редких предметов',
  },
  {
    id: 'sky_penthouse',
    nameRu: 'Небесный Пентхаус',
    descriptionRu: 'Панорамный вид и запас энергии для героев.',
    icon: '🌆',
    unlockLevel: 40,
    goldCost: 1_900_000,
    bonusLabelRu: '+15% к макс. энергии и быстрее восстановление',
  },
  {
    id: 'legend_fortress',
    nameRu: 'Крепость Легенды',
    descriptionRu: 'Легендарная цитадель усиливает все статы.',
    icon: '⚔️',
    unlockLevel: 45,
    goldCost: 2_400_000,
    bonusLabelRu: '+12% ко всем характеристикам',
  },
  {
    id: 'ascension_townhouse',
    nameRu: 'Таунхаус Восхождения',
    descriptionRu: 'Резиденция для тех, кто покорил вершины.',
    icon: '✨',
    unlockLevel: 50,
    goldCost: 3_000_000,
    bonusLabelRu: '+25% ко всем наградам + эксклюзивный титул',
    exclusiveTitleId: 'ascension_homeowner',
  },
]

export const PROPERTY_SELL_REFUND_RATE = 0.7
export const UNLIMITED_PROPERTY_ID = 'ascension_townhouse'

export function getPropertyById(id: string): PropertyDef | undefined {
  return REAL_ESTATE_PROPERTIES.find((p) => p.id === id)
}

export function isPropertyUnlockedForPlayer(player: Pick<Player, 'level'>, property: PropertyDef): boolean {
  return player.level >= property.unlockLevel
}

export function getPropertySellPrice(purchasePrice: number): number {
  return Math.floor(purchasePrice * PROPERTY_SELL_REFUND_RATE)
}

export function isRealEstateUnlocked(player: Pick<Player, 'highestFloor'>): boolean {
  return player.highestFloor >= 5
}
