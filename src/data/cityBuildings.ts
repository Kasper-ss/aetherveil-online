import type { ResourceId } from '@/types/game'

export const CITY_GRID_SIZE = 15
export const CITY_MAX_BUILDING_LEVEL = 5
export const FOREST_CHOP_ENERGY = 12

export type CityBuildingCategory = 'house' | 'production' | 'decoration'

export type CityBuildingId =
  | 'forest_hut'
  | 'stone_house'
  | 'fortified_house'
  | 'mine_building'
  | 'sawmill'
  | 'residential_complex'
  | 'alchemy_lab'
  | 'forge_building'
  | 'guard_tower'
  | 'ascension_temple'
  | 'flower_garden'
  | 'fountain'
  | 'warrior_statue'
  | 'magic_crystal'
  | 'ancient_tree'

export interface CityBuildingBonuses {
  energyRegen?: number
  maxEnergy?: number
  mobGold?: number
  def?: number
  atk?: number
  exp?: number
  gatherResources?: number
  craftSuccess?: number
  rareLoot?: number
  allRewards?: number
}

export interface CityPassiveRates {
  wood_plank?: number
  stone_chunk?: number
  iron_ore?: number
  gold_ore?: number
}

export interface CityBuildingDef {
  id: CityBuildingId
  nameRu: string
  icon: string
  category: CityBuildingCategory
  descriptionRu: string
  goldCost: number
  resourceCosts: Partial<Record<ResourceId, number>>
  buildTimeMs: number
  bonuses: CityBuildingBonuses
  passiveRates?: CityPassiveRates
  /** Instant build for decorations */
  isDecoration?: boolean
}

export const CITY_BUILDING_DEFS: Record<CityBuildingId, CityBuildingDef> = {
  forest_hut: {
    id: 'forest_hut',
    nameRu: 'Лесная Хижина',
    icon: '🛖',
    category: 'house',
    descriptionRu: '+8% к восстановлению энергии',
    goldCost: 5000,
    resourceCosts: { wood_plank: 50 },
    buildTimeMs: 30 * 60_000,
    bonuses: { energyRegen: 1.08 },
  },
  stone_house: {
    id: 'stone_house',
    nameRu: 'Каменный Дом',
    icon: '🏠',
    category: 'house',
    descriptionRu: '+12% к получаемому Gold',
    goldCost: 15000,
    resourceCosts: { wood_plank: 120, stone_chunk: 80 },
    buildTimeMs: 2 * 3_600_000,
    bonuses: { mobGold: 1.12 },
  },
  fortified_house: {
    id: 'fortified_house',
    nameRu: 'Укрепленный Дом',
    icon: '🏰',
    category: 'house',
    descriptionRu: '+15% к Защите',
    goldCost: 45000,
    resourceCosts: { wood_plank: 300, stone_chunk: 250 },
    buildTimeMs: 6 * 3_600_000,
    bonuses: { def: 1.15 },
  },
  mine_building: {
    id: 'mine_building',
    nameRu: 'Шахта',
    icon: '⛏️',
    category: 'production',
    descriptionRu: 'Автоматическая добыча камня и руды',
    goldCost: 80000,
    resourceCosts: { wood_plank: 400, stone_chunk: 600 },
    buildTimeMs: 12 * 3_600_000,
    bonuses: {},
    passiveRates: { stone_chunk: 4, iron_ore: 1, gold_ore: 0.15 },
  },
  sawmill: {
    id: 'sawmill',
    nameRu: 'Лесопилка',
    icon: '🪚',
    category: 'production',
    descriptionRu: 'Автоматическая добыча досок',
    goldCost: 60000,
    resourceCosts: { wood_plank: 350, stone_chunk: 200 },
    buildTimeMs: 8 * 3_600_000,
    bonuses: {},
    passiveRates: { wood_plank: 10 },
  },
  residential_complex: {
    id: 'residential_complex',
    nameRu: 'Жилой Комплекс',
    icon: '🏢',
    category: 'house',
    descriptionRu: '+20% к максимальной энергии',
    goldCost: 120000,
    resourceCosts: { wood_plank: 800, stone_chunk: 700 },
    buildTimeMs: 18 * 3_600_000,
    bonuses: { maxEnergy: 1.2 },
  },
  alchemy_lab: {
    id: 'alchemy_lab',
    nameRu: 'Алхимическая Лаборатория',
    icon: '⚗️',
    category: 'house',
    descriptionRu: '+25% к эффективности зелий и крафта',
    goldCost: 150000,
    resourceCosts: { wood_plank: 600, stone_chunk: 500, herb: 100 },
    buildTimeMs: 24 * 3_600_000,
    bonuses: { craftSuccess: 1.25 },
  },
  forge_building: {
    id: 'forge_building',
    nameRu: 'Кузница',
    icon: '🔥',
    category: 'production',
    descriptionRu: '+18% к появлению редкой руды с мобов',
    goldCost: 200000,
    resourceCosts: { wood_plank: 900, stone_chunk: 1200 },
    buildTimeMs: 30 * 3_600_000,
    bonuses: { rareLoot: 1.18 },
  },
  guard_tower: {
    id: 'guard_tower',
    nameRu: 'Башня Стража',
    icon: '🗼',
    category: 'house',
    descriptionRu: '+22% к Атаке',
    goldCost: 350000,
    resourceCosts: { wood_plank: 1500, stone_chunk: 2000 },
    buildTimeMs: 48 * 3_600_000,
    bonuses: { atk: 1.22 },
  },
  ascension_temple: {
    id: 'ascension_temple',
    nameRu: 'Храм Восхождения',
    icon: '⛩️',
    category: 'house',
    descriptionRu: '+30% ко всем получаемым наградам',
    goldCost: 500000,
    resourceCosts: { wood_plank: 2500, stone_chunk: 3000 },
    buildTimeMs: 72 * 3_600_000,
    bonuses: { allRewards: 1.3 },
  },
  flower_garden: {
    id: 'flower_garden',
    nameRu: 'Сад с цветами',
    icon: '🌸',
    category: 'decoration',
    descriptionRu: '+3% к восстановлению энергии',
    goldCost: 8000,
    resourceCosts: { wood_plank: 40 },
    buildTimeMs: 5 * 60_000,
    bonuses: { energyRegen: 1.03 },
    isDecoration: true,
  },
  fountain: {
    id: 'fountain',
    nameRu: 'Фонтан',
    icon: '⛲',
    category: 'decoration',
    descriptionRu: '+5% к Gold',
    goldCost: 15000,
    resourceCosts: { wood_plank: 80 },
    buildTimeMs: 10 * 60_000,
    bonuses: { mobGold: 1.05 },
    isDecoration: true,
  },
  warrior_statue: {
    id: 'warrior_statue',
    nameRu: 'Статуя Воина',
    icon: '🗿',
    category: 'decoration',
    descriptionRu: '+4% к Атаке',
    goldCost: 25000,
    resourceCosts: { wood_plank: 150 },
    buildTimeMs: 15 * 60_000,
    bonuses: { atk: 1.04 },
    isDecoration: true,
  },
  magic_crystal: {
    id: 'magic_crystal',
    nameRu: 'Магический Кристалл',
    icon: '🔮',
    category: 'decoration',
    descriptionRu: '+6% к опыту',
    goldCost: 40000,
    resourceCosts: { wood_plank: 200 },
    buildTimeMs: 20 * 60_000,
    bonuses: { exp: 1.06 },
    isDecoration: true,
  },
  ancient_tree: {
    id: 'ancient_tree',
    nameRu: 'Древнее Дерево',
    icon: '🌳',
    category: 'decoration',
    descriptionRu: '+5% к ресурсам',
    goldCost: 30000,
    resourceCosts: { wood_plank: 120 },
    buildTimeMs: 15 * 60_000,
    bonuses: { gatherResources: 1.05 },
    isDecoration: true,
  },
}

export const CITY_HOUSE_IDS: CityBuildingId[] = [
  'forest_hut', 'stone_house', 'fortified_house', 'residential_complex',
  'alchemy_lab', 'guard_tower', 'ascension_temple',
]

export const CITY_PRODUCTION_IDS: CityBuildingId[] = ['mine_building', 'sawmill', 'forge_building']

export const CITY_DECORATION_IDS: CityBuildingId[] = [
  'flower_garden', 'fountain', 'warrior_statue', 'magic_crystal', 'ancient_tree',
]

export const ALL_CITY_BUILDING_IDS: CityBuildingId[] = [
  ...CITY_HOUSE_IDS, ...CITY_PRODUCTION_IDS, ...CITY_DECORATION_IDS,
]

export function getCityBuildingDef(id: CityBuildingId): CityBuildingDef {
  return CITY_BUILDING_DEFS[id]
}

export function getCityCellColor(category: CityBuildingCategory): string {
  switch (category) {
    case 'house': return 'bg-amber-900/70 border-amber-700/60'
    case 'production': return 'bg-zinc-900/80 border-zinc-700/70'
    case 'decoration': return 'bg-emerald-900/60 border-emerald-700/50'
  }
}

export function formatCityBuildTime(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000)
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return m > 0 ? `${h} ч ${m} м` : `${h} ч`
  }
  return `${totalMin} м`
}

/** Level 1 = 1.0, level 5 = 1.6 */
export function getCityLevelMultiplier(level: number): number {
  return 1 + (Math.min(CITY_MAX_BUILDING_LEVEL, Math.max(1, level)) - 1) * 0.15
}

export function getUpgradeGoldCost(def: CityBuildingDef, currentLevel: number): number {
  if (currentLevel >= CITY_MAX_BUILDING_LEVEL) return 0
  return Math.floor(def.goldCost * 0.4 * currentLevel)
}

export function getUpgradeResourceCosts(
  def: CityBuildingDef,
  currentLevel: number,
): Partial<Record<ResourceId, number>> {
  if (currentLevel >= CITY_MAX_BUILDING_LEVEL) return {}
  const mult = 0.35 * currentLevel
  const costs: Partial<Record<ResourceId, number>> = {}
  for (const [rid, amt] of Object.entries(def.resourceCosts)) {
    costs[rid as ResourceId] = Math.max(1, Math.floor(amt * mult))
  }
  return costs
}

export function getUpgradeTimeMs(def: CityBuildingDef, currentLevel: number): number {
  if (currentLevel >= CITY_MAX_BUILDING_LEVEL) return 0
  return Math.floor(def.buildTimeMs * 0.25 * currentLevel)
}

export function isCityUnlocked(player: import('@/types/game').Player): boolean {
  return player.highestFloor >= 3 || player.level >= 5
}

export const CITY_UNLOCK_HINT = 'Откройте 3-й этаж башни или достигните 5 уровня'
