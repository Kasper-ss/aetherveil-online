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
    nameRu: 'Железная жила (устар.)',
    descriptionRu: 'Используйте Шахту в хабе.',
    icon: '⛏️',
    energyCost: 99,
    requiredTool: 'pickaxe',
    rewards: { iron_ore: 1 },
    professionXp: 1,
  },
  {
    id: 'mine_deep',
    professionId: 'blacksmith',
    nameRu: 'Глубокий забой (устар.)',
    descriptionRu: 'Используйте Шахту в хабе.',
    icon: '🪨',
    energyCost: 99,
    requiredTool: 'pickaxe',
    rewards: { iron_ore: 1 },
    professionXp: 1,
    minRank: 99,
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
    nameRu: 'Охота на зверей (устар.)',
    descriptionRu: 'Перейдите в Охотничьи угодья в хабе.',
    icon: '🏹',
    energyCost: 99,
    rewards: { meat: 1 },
    professionXp: 1,
  },
  {
    id: 'hunt_alpha',
    professionId: 'hunter',
    nameRu: 'Альфа-трофеи (устар.)',
    descriptionRu: 'Используйте Охотничьи угодья в хабе.',
    icon: '🐺',
    energyCost: 99,
    rewards: { meat: 1 },
    professionXp: 1,
    minRank: 99,
  },
  {
    id: 'gem_dig',
    professionId: 'jeweler',
    nameRu: 'Раскопки кристаллов (устар.)',
    descriptionRu: 'Перейдите в Кристальные рудники в хабе.',
    icon: '💠',
    energyCost: 99,
    requiredTool: 'pickaxe',
    rewards: { gem_shard: 1 },
    professionXp: 1,
  },
  {
    id: 'gem_infuse',
    professionId: 'jeweler',
    nameRu: 'Наполнение камней (устар.)',
    descriptionRu: 'Используйте Кристальные рудники в хабе.',
    icon: '✨',
    energyCost: 99,
    rewards: { gem_shard: 1 },
    professionXp: 1,
    minRank: 99,
  },
  {
    id: 'mana_well',
    professionId: 'sorcerer',
    nameRu: 'Колодец маны (устар.)',
    descriptionRu: 'Перейдите в Эфирный разлом в хабе.',
    icon: '🔮',
    energyCost: 99,
    rewards: { mana_crystal: 1 },
    professionXp: 1,
  },
  {
    id: 'aether_ritual',
    professionId: 'sorcerer',
    nameRu: 'Эфирный ритуал (устар.)',
    descriptionRu: 'Используйте Эфирный разлом в хабе.',
    icon: '🌟',
    energyCost: 99,
    rewards: { mana_crystal: 1 },
    professionXp: 1,
    minRank: 99,
  },
  {
    id: 'fish_shore',
    professionId: 'hunter',
    nameRu: 'Прибрежная рыбалка (устар.)',
    descriptionRu: 'Используйте Рыбалку в хабе.',
    icon: '🎣',
    energyCost: 99,
    requiredTool: 'fishing_rod',
    consumesItemId: 'fishing_bait',
    rewards: { meat: 1 },
    professionXp: 1,
  },
]

export function getActivitiesForProfession(professionId: ProfessionId): ProfessionActivity[] {
  return PROFESSION_ACTIVITIES.filter((a) => a.professionId === professionId)
}
