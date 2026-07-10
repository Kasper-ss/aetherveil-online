import type { ResourceId } from '@/types/game'
import { FISH_TABLE } from '@/data/fishing'
import { JEWEL_RESOURCE_IDS } from '@/lib/jewelResources'

export const WOOD_RESOURCE_IDS: ResourceId[] = ['wood_plank']

export const BASIC_RESOURCE_IDS: ResourceId[] = [
  'hide', 'meat', 'gem_shard', 'mana_crystal', 'aether_dust', 'star_shard',
  'upgrade_core', 'rare_spice', 'abyssal_pearl', 'fishing_junk',
]

export const ORE_RESOURCE_IDS: ResourceId[] = [
  'stone_chunk', 'iron_ore', 'gold_ore', 'raw_diamond', 'mithril_ore', 'adamantite', 'sulfur',
]

export const HERB_RESOURCE_IDS: ResourceId[] = [
  'herb_mint', 'herb', 'herb_lotus', 'herb_phoenix', 'herb_void',
]

export const FISH_RESOURCE_IDS: ResourceId[] = FISH_TABLE.map((f) => f.id)

export interface ResourceSection {
  id: string
  titleRu: string
  resourceIds: ResourceId[]
}

export const RESOURCE_SECTIONS: ResourceSection[] = [
  { id: 'wood', titleRu: 'Древесина', resourceIds: WOOD_RESOURCE_IDS },
  { id: 'basic', titleRu: 'Материалы', resourceIds: BASIC_RESOURCE_IDS },
  { id: 'ore', titleRu: 'Руда', resourceIds: ORE_RESOURCE_IDS },
  { id: 'herbs', titleRu: 'Травы', resourceIds: HERB_RESOURCE_IDS },
  { id: 'jewels', titleRu: 'Камни (ювелир)', resourceIds: JEWEL_RESOURCE_IDS },
  { id: 'fish', titleRu: 'Рыба', resourceIds: FISH_RESOURCE_IDS },
]
