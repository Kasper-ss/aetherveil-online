import type { CraftRecipe, ResourceId } from '@/types/game'

function scaleResources(
  resources: Partial<Record<ResourceId, number>>,
  mult: number,
): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {}
  for (const [k, v] of Object.entries(resources)) {
    if (v) out[k as ResourceId] = Math.ceil(v * mult)
  }
  return out
}

function scaleRecipe(recipe: CraftRecipe, goldMult: number, resMult: number): CraftRecipe {
  return {
    ...recipe,
    goldCost: Math.ceil(recipe.goldCost * goldMult),
    resources: scaleResources(recipe.resources, resMult),
  }
}

type SetPieceCraft = {
  id: string
  resultItemId: string
  name: string
  description: string
  resources: Partial<Record<ResourceId, number>>
  goldCost: number
  requiredProfession: 'blacksmith' | 'jeweler'
  requiredProfessionLevel: number
}

const EPIC_STORM: SetPieceCraft[] = [
  { id: 'storm_helmet', resultItemId: 'storm_breaker_helmet', name: 'Шлем Громобоя', description: 'ЗАЩ +18, АТК +6, КРИТ +8', resources: { iron_ore: 12, gem_shard: 4, upgrade_core: 3 }, goldCost: 1800, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'storm_chest', resultItemId: 'storm_breaker_chestplate', name: 'Кираса Громобоя', description: 'ЗАЩ +30, HP +90, АТК +5', resources: { iron_ore: 16, gem_shard: 5, upgrade_core: 4 }, goldCost: 2800, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'storm_weapon', resultItemId: 'storm_breaker_weapon', name: 'Молот грома', description: 'АТК +38, КРИТ +14, СКР +6', resources: { iron_ore: 18, gem_shard: 6, upgrade_core: 5 }, goldCost: 3500, requiredProfession: 'blacksmith', requiredProfessionLevel: 14 },
  { id: 'storm_leggings', resultItemId: 'storm_breaker_leggings', name: 'Поножи Громобоя', description: 'ЗАЩ +16, СКР +10, АТК +4', resources: { iron_ore: 14, gem_shard: 4, upgrade_core: 3 }, goldCost: 2400, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'storm_boots', resultItemId: 'storm_breaker_boots', name: 'Сапоги Громобоя', description: 'СКР +14, ЗАЩ +10, КРИТ +5', resources: { iron_ore: 12, gem_shard: 3, upgrade_core: 3 }, goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'storm_necklace', resultItemId: 'storm_breaker_necklace', name: 'Амулет бури', description: 'АТК +12, КРИТ +10', resources: { gem_shard: 6, mana_crystal: 3, upgrade_core: 2 }, goldCost: 2200, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
  { id: 'storm_ring', resultItemId: 'storm_breaker_ring', name: 'Кольцо молнии', description: 'АТК +10, КРИТ +12', resources: { gem_shard: 5, mana_crystal: 2, upgrade_core: 2 }, goldCost: 1800, requiredProfession: 'jeweler', requiredProfessionLevel: 10 },
]

const EPIC_CRYSTAL: SetPieceCraft[] = [
  { id: 'crystal_helmet', resultItemId: 'crystal_guard_helmet', name: 'Корона кристалла', description: 'ЗАЩ +22, HP +50, КРИТ +4', resources: { gem_shard: 6, mana_crystal: 4, upgrade_core: 3 }, goldCost: 1800, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'crystal_chest', resultItemId: 'crystal_guard_chestplate', name: 'Кираса кристалла', description: 'ЗАЩ +36, HP +110', resources: { gem_shard: 8, mana_crystal: 5, upgrade_core: 4 }, goldCost: 2800, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'crystal_weapon', resultItemId: 'crystal_guard_weapon', name: 'Клинок кристалла', description: 'АТК +28, ЗАЩ +8, HP +40', resources: { gem_shard: 8, mana_crystal: 6, upgrade_core: 5 }, goldCost: 3500, requiredProfession: 'blacksmith', requiredProfessionLevel: 14 },
  { id: 'crystal_leggings', resultItemId: 'crystal_guard_leggings', name: 'Поножи кристалла', description: 'ЗАЩ +20, HP +40, СКР +6', resources: { gem_shard: 6, mana_crystal: 4, upgrade_core: 3 }, goldCost: 2400, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'crystal_boots', resultItemId: 'crystal_guard_boots', name: 'Сапоги кристалла', description: 'ЗАЩ +14, СКР +8, HP +30', resources: { gem_shard: 5, mana_crystal: 3, upgrade_core: 3 }, goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'crystal_necklace', resultItemId: 'crystal_guard_necklace', name: 'Ожерелье стража', description: 'ЗАЩ +8, HP +45, АТК +6', resources: { gem_shard: 7, mana_crystal: 4, upgrade_core: 2 }, goldCost: 2200, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
  { id: 'crystal_ring', resultItemId: 'crystal_guard_ring', name: 'Кольцо стража', description: 'ЗАЩ +10, HP +35, КРИТ +6', resources: { gem_shard: 6, mana_crystal: 3, upgrade_core: 2 }, goldCost: 1800, requiredProfession: 'jeweler', requiredProfessionLevel: 10 },
]

const EPIC_BEAST: SetPieceCraft[] = [
  { id: 'beast_helmet', resultItemId: 'beast_master_helmet', name: 'Маска охотника', description: 'ЗАЩ +16, СКР +10, КРИТ +6', resources: { hide: 12, herb: 6, upgrade_core: 3 }, goldCost: 1800, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'beast_chest', resultItemId: 'beast_master_chestplate', name: 'Шкура альфы', description: 'ЗАЩ +28, HP +85, АТК +6', resources: { hide: 16, herb: 8, upgrade_core: 4 }, goldCost: 2800, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'beast_weapon', resultItemId: 'beast_master_weapon', name: 'Копьё повелителя', description: 'АТК +34, КРИТ +12, СКР +8', resources: { hide: 14, gem_shard: 4, upgrade_core: 5 }, goldCost: 3500, requiredProfession: 'blacksmith', requiredProfessionLevel: 14 },
  { id: 'beast_leggings', resultItemId: 'beast_master_leggings', name: 'Поножи следопыта', description: 'ЗАЩ +18, СКР +12, АТК +4', resources: { hide: 12, herb: 6, upgrade_core: 3 }, goldCost: 2400, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'beast_boots', resultItemId: 'beast_master_boots', name: 'Сапоги следопыта', description: 'СКР +16, ЗАЩ +8, КРИТ +5', resources: { hide: 10, herb: 5, upgrade_core: 3 }, goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'beast_necklace', resultItemId: 'beast_master_necklace', name: 'Клык зверя', description: 'АТК +14, КРИТ +8, СКР +4', resources: { hide: 8, gem_shard: 4, upgrade_core: 2 }, goldCost: 2200, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
  { id: 'beast_ring', resultItemId: 'beast_master_ring', name: 'Коготь зверя', description: 'АТК +12, КРИТ +10', resources: { hide: 8, gem_shard: 3, upgrade_core: 2 }, goldCost: 1800, requiredProfession: 'jeweler', requiredProfessionLevel: 10 },
]

function toEpicRecipes(setName: string, pieces: SetPieceCraft[]): CraftRecipe[] {
  return pieces.map((p) => ({
    id: `craft_epic_${p.id}`,
    resultItemId: p.resultItemId,
    name: p.name,
    description: `Эпический сет «${setName}». ${p.description}`,
    resources: p.resources,
    goldCost: p.goldCost,
    requiredProfession: p.requiredProfession,
    requiredProfessionLevel: p.requiredProfessionLevel,
    isSetCraft: true,
    setCraftRarity: 'epic' as const,
  }))
}

function toLegendaryRecipes(pieces: SetPieceCraft[]): CraftRecipe[] {
  return pieces.map((p) => scaleRecipe({
    id: `craft_${p.id}`,
    resultItemId: p.resultItemId,
    name: p.name,
    description: `Легендарный сет. ${p.description}`,
    resources: p.resources,
    goldCost: p.goldCost,
    requiredProfession: p.requiredProfession,
    requiredProfessionLevel: p.requiredProfessionLevel,
    isSetCraft: true,
    setCraftRarity: 'legendary' as const,
  }, 3, 3))
}

const LEGENDARY_SHADOW: SetPieceCraft[] = [
  { id: 'shadow_helmet', resultItemId: 'shadow_ascension_helmet', name: 'Шлем Восхождения в Тени', description: 'ЗАЩ +28, КРИТ +12, HP +80', resources: { aether_dust: 15, star_shard: 5, gem_shard: 10, upgrade_core: 5 }, goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20 },
  { id: 'shadow_chest', resultItemId: 'shadow_ascension_chestplate', name: 'Нагрудник Восхождения в Тени', description: 'ЗАЩ +45, HP +150, АТК +8', resources: { aether_dust: 20, star_shard: 8, gem_shard: 12, upgrade_core: 8 }, goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25 },
  { id: 'shadow_weapon', resultItemId: 'shadow_ascension_weapon', name: 'Клинок Восхождения в Тени', description: 'АТК +55, КРИТ +25, СКР +8', resources: { aether_dust: 25, star_shard: 10, gem_shard: 15, upgrade_core: 10 }, goldCost: 10000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30 },
  { id: 'shadow_leggings', resultItemId: 'shadow_ascension_leggings', name: 'Поножи Восхождения в Тени', description: 'ЗАЩ +25, СКР +15, КРИТ +5', resources: { aether_dust: 18, star_shard: 7, gem_shard: 10, upgrade_core: 6 }, goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22 },
  { id: 'shadow_boots', resultItemId: 'shadow_ascension_boots', name: 'Ботинки Восхождения в Тени', description: 'СКР +18, ЗАЩ +12, КРИТ +8', resources: { aether_dust: 16, star_shard: 6, gem_shard: 8, upgrade_core: 5 }, goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21 },
  { id: 'shadow_necklace', resultItemId: 'shadow_ascension_necklace', name: 'Ожерелье Восхождения в Тени', description: 'АТК +15, КРИТ +18, СКР +5', resources: { aether_dust: 14, star_shard: 6, gem_shard: 12, upgrade_core: 4 }, goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22 },
  { id: 'shadow_ring', resultItemId: 'shadow_ascension_ring', name: 'Кольцо Восхождения в Тени', description: 'КРИТ +20, АТК +12', resources: { aether_dust: 12, star_shard: 5, gem_shard: 10, upgrade_core: 4 }, goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20 },
]

const LEGENDARY_SOLO: SetPieceCraft[] = [
  { id: 'solo_helmet', resultItemId: 'solo_leveling_helmet', name: 'Шлем Одиночки', description: 'ЗАЩ +30, HP +100, АТК +5', resources: { aether_dust: 15, star_shard: 5, mana_crystal: 10, upgrade_core: 5 }, goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20 },
  { id: 'solo_chest', resultItemId: 'solo_leveling_chestplate', name: 'Нагрудник Одиночки', description: 'ЗАЩ +50, HP +180, АТК +8', resources: { aether_dust: 20, star_shard: 8, mana_crystal: 12, upgrade_core: 8 }, goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25 },
  { id: 'solo_weapon', resultItemId: 'solo_leveling_weapon', name: 'Клинок Одиночки', description: 'АТК +60, КРИТ +15, СКР +10', resources: { aether_dust: 25, star_shard: 10, mana_crystal: 15, upgrade_core: 10 }, goldCost: 10000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30 },
  { id: 'solo_leggings', resultItemId: 'solo_leveling_leggings', name: 'Поножи Одиночки', description: 'ЗАЩ +28, СКР +12, HP +60', resources: { aether_dust: 18, star_shard: 7, mana_crystal: 10, upgrade_core: 6 }, goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22 },
  { id: 'solo_boots', resultItemId: 'solo_leveling_boots', name: 'Ботинки Одиночки', description: 'СКР +16, ЗАЩ +15, АТК +5', resources: { aether_dust: 16, star_shard: 6, mana_crystal: 8, upgrade_core: 5 }, goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21 },
  { id: 'solo_necklace', resultItemId: 'solo_leveling_necklace', name: 'Ожерелье Одиночки', description: 'АТК +18, КРИТ +10, HP +50', resources: { aether_dust: 14, star_shard: 6, mana_crystal: 12, upgrade_core: 4 }, goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22 },
  { id: 'solo_ring', resultItemId: 'solo_leveling_ring', name: 'Кольцо Одиночки', description: 'АТК +15, КРИТ +12, СКР +5', resources: { aether_dust: 12, star_shard: 5, mana_crystal: 10, upgrade_core: 4 }, goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20 },
]

const LEGENDARY_PUNCH: SetPieceCraft[] = [
  { id: 'punch_helmet', resultItemId: 'one_punch_helmet', name: 'Плащ Ванпанчмена', description: 'ЗАЩ +15, АТК +20, КРИТ +10', resources: { aether_dust: 15, star_shard: 5, upgrade_core: 5 }, goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20 },
  { id: 'punch_chest', resultItemId: 'one_punch_chestplate', name: 'Костюм Ванпанчмена', description: 'ЗАЩ +35, АТК +25, HP +120', resources: { aether_dust: 20, star_shard: 8, upgrade_core: 8 }, goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25 },
  { id: 'punch_weapon', resultItemId: 'one_punch_weapon', name: 'Кулак справедливости', description: 'АТК +80, КРИТ +30, СКР +15', resources: { aether_dust: 30, star_shard: 12, upgrade_core: 12 }, goldCost: 12000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30 },
  { id: 'punch_leggings', resultItemId: 'one_punch_leggings', name: 'Штаны Ванпанчмена', description: 'ЗАЩ +20, СКР +20, АТК +10', resources: { aether_dust: 18, star_shard: 7, upgrade_core: 6 }, goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22 },
  { id: 'punch_boots', resultItemId: 'one_punch_boots', name: 'Ботинки Ванпанчмена', description: 'СКР +25, АТК +15, КРИТ +8', resources: { aether_dust: 16, star_shard: 6, upgrade_core: 5 }, goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21 },
  { id: 'punch_necklace', resultItemId: 'one_punch_necklace', name: 'Значок героя', description: 'АТК +30, КРИТ +15', resources: { aether_dust: 14, star_shard: 6, gem_shard: 8, upgrade_core: 4 }, goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22 },
  { id: 'punch_ring', resultItemId: 'one_punch_ring', name: 'Перчатка Ванпанчмена', description: 'АТК +35, КРИТ +20', resources: { aether_dust: 12, star_shard: 5, gem_shard: 8, upgrade_core: 4 }, goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20 },
]

export const EPIC_SET_CRAFT_RECIPES: CraftRecipe[] = [
  ...toEpicRecipes('Громобой', EPIC_STORM),
  ...toEpicRecipes('Кристальный Страж', EPIC_CRYSTAL),
  ...toEpicRecipes('Повелитель Зверей', EPIC_BEAST),
]

export const LEGENDARY_SET_CRAFT_RECIPES: CraftRecipe[] = [
  ...toLegendaryRecipes(LEGENDARY_SHADOW),
  ...toLegendaryRecipes(LEGENDARY_SOLO),
  ...toLegendaryRecipes(LEGENDARY_PUNCH),
]
