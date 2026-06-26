import type { ProfessionId, ResourceId } from '@/types/game'

export interface ProfessionActivity {
  id: string
  professionId: ProfessionId
  nameRu: string
  descriptionRu: string
  icon: string
  energyCost: number
  requiredTool?: string
  consumesItemId?: string
  rewards: Partial<Record<ResourceId, number>>
  professionXp: number
  minRank?: number
}

export const PROFESSION_ACTIVITIES: ProfessionActivity[] = [
  {
    id: 'mine_iron',
    professionId: 'blacksmith',
    nameRu: 'Железная жила',
    descriptionRu: 'Добыча железной руды в шахте. Нужна кирка.',
    icon: '⛏️',
    energyCost: 18,
    requiredTool: 'pickaxe',
    rewards: { iron_ore: 3 },
    professionXp: 6,
  },
  {
    id: 'mine_deep',
    professionId: 'blacksmith',
    nameRu: 'Глубокий забой',
    descriptionRu: 'Редкая руда и ядра улучшения.',
    icon: '🪨',
    energyCost: 28,
    requiredTool: 'pickaxe',
    rewards: { iron_ore: 5, upgrade_core: 1 },
    professionXp: 10,
    minRank: 5,
  },
  {
    id: 'herb_gather',
    professionId: 'alchemist',
    nameRu: 'Сбор трав (устар.)',
    descriptionRu: 'Перейдите на Поле трав в хабе.',
    icon: '🌿',
    energyCost: 99,
    rewards: { herb: 1 },
    professionXp: 1,
  },
  {
    id: 'herb_rare',
    professionId: 'alchemist',
    nameRu: 'Редкие травы (устар.)',
    descriptionRu: 'Используйте Поле трав для сбора.',
    icon: '🍃',
    energyCost: 99,
    rewards: { herb: 1 },
    professionXp: 1,
    minRank: 99,
  },
  {
    id: 'hunt_beasts',
    professionId: 'hunter',
    nameRu: 'Охота на зверей',
    descriptionRu: 'Мясо и шкура с окрестных этажей.',
    icon: '🏹',
    energyCost: 11,
    rewards: { meat: 4, hide: 2 },
    professionXp: 11,
  },
  {
    id: 'hunt_alpha',
    professionId: 'hunter',
    nameRu: 'Альфа-трофеи',
    descriptionRu: 'Больше мяса и шанс осколка.',
    icon: '🐺',
    energyCost: 20,
    rewards: { meat: 6, hide: 4, gem_shard: 1 },
    professionXp: 20,
    minRank: 6,
  },
  {
    id: 'gem_dig',
    professionId: 'jeweler',
    nameRu: 'Раскопки кристаллов',
    descriptionRu: 'Осколки и пыль эфира.',
    icon: '💠',
    energyCost: 12,
    requiredTool: 'pickaxe',
    rewards: { gem_shard: 2 },
    professionXp: 12,
  },
  {
    id: 'gem_infuse',
    professionId: 'jeweler',
    nameRu: 'Наполнение камней',
    descriptionRu: 'Кристаллы маны и звёздные осколки.',
    icon: '✨',
    energyCost: 20,
    rewards: { gem_shard: 3, mana_crystal: 2 },
    professionXp: 21,
    minRank: 5,
  },
  {
    id: 'mana_well',
    professionId: 'sorcerer',
    nameRu: 'Колодец маны',
    descriptionRu: 'Сбор кристаллов маны.',
    icon: '🔮',
    energyCost: 11,
    rewards: { mana_crystal: 3 },
    professionXp: 11,
  },
  {
    id: 'aether_ritual',
    professionId: 'sorcerer',
    nameRu: 'Эфирный ритуал',
    descriptionRu: 'Пыль эфира и осколки.',
    icon: '🌟',
    energyCost: 24,
    rewards: { mana_crystal: 4, aether_dust: 1 },
    professionXp: 24,
    minRank: 7,
  },
  {
    id: 'fish_shore',
    professionId: 'hunter',
    nameRu: 'Прибрежная рыбалка',
    descriptionRu: 'Рыба и мусор. Нужны удочка и наживка.',
    icon: '🎣',
    energyCost: 12,
    requiredTool: 'fishing_rod',
    consumesItemId: 'fishing_bait',
    rewards: { meat: 2, hide: 1 },
    professionXp: 10,
  },
]

export function getActivitiesForProfession(professionId: ProfessionId): ProfessionActivity[] {
  return PROFESSION_ACTIVITIES.filter((a) => a.professionId === professionId)
}
