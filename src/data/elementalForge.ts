import type { ElementalBuffId, ItemRarity, ResourceId, Stats } from '@/types/game'

export interface ElementalBuffDef {
  id: ElementalBuffId
  nameRu: string
  icon: string
  element: 'water' | 'fire' | 'air' | 'earth'
  statPerLevel: Partial<Stats>
  descriptionRu: string
}

export const ELEMENTAL_BUFF_SLOTS: Record<ItemRarity, number> = {
  common: 0,
  rare: 2,
  epic: 5,
  legendary: 7,
  mythic: 10,
}

export const ELEMENTAL_BUFFS: ElementalBuffDef[] = [
  { id: 'inferno_strike', nameRu: 'Удар пламени', icon: '🔥', element: 'fire', statPerLevel: { atk: 3 }, descriptionRu: '+3 ATK за уровень' },
  { id: 'tidal_edge', nameRu: 'Приливный клинок', icon: '💧', element: 'water', statPerLevel: { def: 2 }, descriptionRu: '+2 DEF за уровень' },
  { id: 'gale_fury', nameRu: 'Ярость ветра', icon: '💨', element: 'air', statPerLevel: { speed: 1, crit: 1 }, descriptionRu: '+1 SPD, +1% CRIT за уровень' },
  { id: 'stonebreaker', nameRu: 'Каменолом', icon: '🪨', element: 'earth', statPerLevel: { atk: 2, def: 2 }, descriptionRu: '+2 ATK, +2 DEF за уровень' },
  { id: 'steam_burst', nameRu: 'Паровой взрыв', icon: '♨️', element: 'fire', statPerLevel: { crit: 2 }, descriptionRu: '+2% CRIT за уровень' },
  { id: 'lightning_arc', nameRu: 'Дуга молнии', icon: '⚡', element: 'air', statPerLevel: { atk: 4 }, descriptionRu: '+4 ATK за уровень' },
  { id: 'frozen_heart', nameRu: 'Ледяное сердце', icon: '❄️', element: 'water', statPerLevel: { hp: 12 }, descriptionRu: '+12 HP за уровень' },
  { id: 'magma_core', nameRu: 'Магмовое ядро', icon: '🌋', element: 'fire', statPerLevel: { atk: 2, crit: 1 }, descriptionRu: '+2 ATK, +1% CRIT за уровень' },
  { id: 'storm_lance', nameRu: 'Копьё бури', icon: '🌪️', element: 'air', statPerLevel: { speed: 2, atk: 2 }, descriptionRu: '+2 SPD, +2 ATK за уровень' },
  { id: 'world_sunder', nameRu: 'Раскол мира', icon: '🌍', element: 'earth', statPerLevel: { atk: 3, def: 3, hp: 8 }, descriptionRu: '+3 ATK, +3 DEF, +8 HP за уровень' },
]

const ELEMENT_RESOURCE: Record<ElementalBuffDef['element'], ResourceId> = {
  water: 'element_water',
  fire: 'element_fire',
  air: 'element_air',
  earth: 'element_earth',
}

const RARITY_COST_MULT: Record<ItemRarity, number> = {
  common: 1,
  rare: 2.5,
  epic: 5,
  legendary: 10,
  mythic: 20,
}

export function getElementalBuffDef(id: ElementalBuffId): ElementalBuffDef {
  return ELEMENTAL_BUFFS.find((b) => b.id === id)!
}

export function getElementalBuffStats(id: ElementalBuffId, level: number): Partial<Stats> {
  const def = getElementalBuffDef(id)
  const stats: Partial<Stats> = {}
  for (const [k, v] of Object.entries(def.statPerLevel)) {
    stats[k as keyof Stats] = (v as number) * level
  }
  return stats
}

export function getElementalBuffApplyCost(
  rarity: ItemRarity,
  buffLevel: number,
  buffId: ElementalBuffId,
): { gold: number; resources: Partial<Record<ResourceId, number>> } {
  const def = getElementalBuffDef(buffId)
  const mult = RARITY_COST_MULT[rarity] ?? 1
  const lvlMult = Math.pow(buffLevel, 1.65)
  const elem = ELEMENT_RESOURCE[def.element]
  const resources: Partial<Record<ResourceId, number>> = {
    [elem]: Math.max(1, Math.ceil(2 * mult * lvlMult)),
  }
  const dust = Math.floor(mult * buffLevel * 0.5)
  if (dust > 0) resources.aether_dust = dust
  if (rarity === 'mythic' || rarity === 'legendary') {
    resources.star_shard = Math.max(1, Math.floor(buffLevel * mult * 0.15))
  }
  return {
    gold: Math.floor(8000 * mult * lvlMult),
    resources,
  }
}

export function hasElementalForge(player: { professionLevels?: Partial<Record<'blacksmith', number[]>> }): boolean {
  const idx = 7 // bs_8
  return (player.professionLevels?.blacksmith?.[idx] ?? 0) >= 1
}
