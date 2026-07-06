import type { CraftRecipe, ResourceId } from '@/types/game'
import {
  craftTierForSlot,
  getEpicCraftResources,
  getLegendaryCraftResources,
  getMythicCraftResources,
  slotFromResultItemId,
} from '@/data/craftResources'

type SetPieceCraft = {
  id: string
  resultItemId: string
  name: string
  description: string
  goldCost: number
  requiredProfession: 'blacksmith' | 'jeweler'
  requiredProfessionLevel: number
}

const EPIC_STORM: SetPieceCraft[] = [
  { id: 'storm_helmet', resultItemId: 'storm_breaker_helmet', name: 'Шлем Громобоя', description: 'ЗАЩ +18, АТК +6, КРИТ +8', goldCost: 1800, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'storm_chest', resultItemId: 'storm_breaker_chestplate', name: 'Кираса Громобоя', description: 'ЗАЩ +30, HP +90, АТК +5', goldCost: 2800, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'storm_weapon', resultItemId: 'storm_breaker_weapon', name: 'Молот грома', description: 'АТК +38, КРИТ +14, СКР +6', goldCost: 3500, requiredProfession: 'blacksmith', requiredProfessionLevel: 14 },
  { id: 'storm_leggings', resultItemId: 'storm_breaker_leggings', name: 'Поножи Громобоя', description: 'ЗАЩ +16, СКР +10, АТК +4', goldCost: 2400, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'storm_boots', resultItemId: 'storm_breaker_boots', name: 'Сапоги Громобоя', description: 'СКР +14, ЗАЩ +10, КРИТ +5', goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'storm_necklace', resultItemId: 'storm_breaker_necklace', name: 'Амулет бури', description: 'АТК +12, КРИТ +10', goldCost: 2200, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
  { id: 'storm_ring', resultItemId: 'storm_breaker_ring', name: 'Кольцо молнии', description: 'АТК +10, КРИТ +12', goldCost: 1800, requiredProfession: 'jeweler', requiredProfessionLevel: 10 },
]

const EPIC_CRYSTAL: SetPieceCraft[] = [
  { id: 'crystal_helmet', resultItemId: 'crystal_guard_helmet', name: 'Корона кристалла', description: 'ЗАЩ +22, HP +50, КРИТ +4', goldCost: 1800, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'crystal_chest', resultItemId: 'crystal_guard_chestplate', name: 'Кираса кристалла', description: 'ЗАЩ +36, HP +110', goldCost: 2800, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'crystal_weapon', resultItemId: 'crystal_guard_weapon', name: 'Клинок кристалла', description: 'АТК +28, ЗАЩ +8, HP +40', goldCost: 3500, requiredProfession: 'blacksmith', requiredProfessionLevel: 14 },
  { id: 'crystal_leggings', resultItemId: 'crystal_guard_leggings', name: 'Поножи кристалла', description: 'ЗАЩ +20, HP +40, СКР +6', goldCost: 2400, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'crystal_boots', resultItemId: 'crystal_guard_boots', name: 'Сапоги кристалла', description: 'ЗАЩ +14, СКР +8, HP +30', goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'crystal_necklace', resultItemId: 'crystal_guard_necklace', name: 'Ожерелье стража', description: 'ЗАЩ +8, HP +45, АТК +6', goldCost: 2200, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
  { id: 'crystal_ring', resultItemId: 'crystal_guard_ring', name: 'Кольцо стража', description: 'ЗАЩ +10, HP +35, КРИТ +6', goldCost: 1800, requiredProfession: 'jeweler', requiredProfessionLevel: 10 },
]

const EPIC_BEAST: SetPieceCraft[] = [
  { id: 'beast_helmet', resultItemId: 'beast_master_helmet', name: 'Маска охотника', description: 'ЗАЩ +16, СКР +10, КРИТ +6', goldCost: 1800, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'beast_chest', resultItemId: 'beast_master_chestplate', name: 'Шкура альфы', description: 'ЗАЩ +28, HP +85, АТК +6', goldCost: 2800, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'beast_weapon', resultItemId: 'beast_master_weapon', name: 'Копьё повелителя', description: 'АТК +34, КРИТ +12, СКР +8', goldCost: 3500, requiredProfession: 'blacksmith', requiredProfessionLevel: 14 },
  { id: 'beast_leggings', resultItemId: 'beast_master_leggings', name: 'Поножи следопыта', description: 'ЗАЩ +18, СКР +12, АТК +4', goldCost: 2400, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'beast_boots', resultItemId: 'beast_master_boots', name: 'Сапоги следопыта', description: 'СКР +16, ЗАЩ +8, КРИТ +5', goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 10 },
  { id: 'beast_necklace', resultItemId: 'beast_master_necklace', name: 'Клык зверя', description: 'АТК +14, КРИТ +8, СКР +4', goldCost: 2200, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
  { id: 'beast_ring', resultItemId: 'beast_master_ring', name: 'Коготь зверя', description: 'АТК +12, КРИТ +10', goldCost: 1800, requiredProfession: 'jeweler', requiredProfessionLevel: 10 },
]

function resourcesForPiece(p: SetPieceCraft, rarity: 'epic' | 'legendary' | 'mythic'): Partial<Record<ResourceId, number>> {
  const slot = slotFromResultItemId(p.resultItemId)
  const tier = craftTierForSlot(slot)
  if (rarity === 'epic') return getEpicCraftResources(tier)
  if (rarity === 'legendary') return getLegendaryCraftResources(tier)
  return getMythicCraftResources(tier)
}

function toEpicRecipes(setName: string, pieces: SetPieceCraft[]): CraftRecipe[] {
  return pieces.map((p) => ({
    id: `craft_epic_${p.id}`,
    resultItemId: p.resultItemId,
    name: p.name,
    description: `Эпический сет «${setName}». ${p.description}`,
    resources: resourcesForPiece(p, 'epic'),
    goldCost: p.goldCost,
    requiredProfession: p.requiredProfession,
    requiredProfessionLevel: p.requiredProfessionLevel,
    isSetCraft: true,
    setCraftRarity: 'epic' as const,
  }))
}

function toLegendaryRecipes(pieces: SetPieceCraft[]): CraftRecipe[] {
  return pieces.map((p) => ({
    id: `craft_${p.id}`,
    resultItemId: p.resultItemId,
    name: p.name,
    description: `Легендарный сет. ${p.description}`,
    resources: resourcesForPiece(p, 'legendary'),
    goldCost: p.goldCost * 3,
    requiredProfession: p.requiredProfession,
    requiredProfessionLevel: p.requiredProfessionLevel,
    isSetCraft: true,
    setCraftRarity: 'legendary' as const,
  }))
}

const LEGENDARY_SHADOW: SetPieceCraft[] = [
  { id: 'shadow_helmet', resultItemId: 'shadow_ascension_helmet', name: 'Шлем Восхождения в Тени', description: 'ЗАЩ +28, КРИТ +12, HP +80', goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20 },
  { id: 'shadow_chest', resultItemId: 'shadow_ascension_chestplate', name: 'Нагрудник Восхождения в Тени', description: 'ЗАЩ +45, HP +150, АТК +8', goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25 },
  { id: 'shadow_weapon', resultItemId: 'shadow_ascension_weapon', name: 'Клинок Восхождения в Тени', description: 'АТК +55, КРИТ +25, СКР +8', goldCost: 10000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30 },
  { id: 'shadow_leggings', resultItemId: 'shadow_ascension_leggings', name: 'Поножи Восхождения в Тени', description: 'ЗАЩ +25, СКР +15, КРИТ +5', goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22 },
  { id: 'shadow_boots', resultItemId: 'shadow_ascension_boots', name: 'Ботинки Восхождения в Тени', description: 'СКР +18, ЗАЩ +12, КРИТ +8', goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21 },
  { id: 'shadow_necklace', resultItemId: 'shadow_ascension_necklace', name: 'Ожерелье Восхождения в Тени', description: 'АТК +15, КРИТ +18, СКР +5', goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22 },
  { id: 'shadow_ring', resultItemId: 'shadow_ascension_ring', name: 'Кольцо Восхождения в Тени', description: 'КРИТ +20, АТК +12', goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20 },
]

const LEGENDARY_SOLO: SetPieceCraft[] = [
  { id: 'solo_helmet', resultItemId: 'solo_leveling_helmet', name: 'Шлем Одиночки', description: 'ЗАЩ +30, HP +100, АТК +5', goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20 },
  { id: 'solo_chest', resultItemId: 'solo_leveling_chestplate', name: 'Нагрудник Одиночки', description: 'ЗАЩ +50, HP +180, АТК +8', goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25 },
  { id: 'solo_weapon', resultItemId: 'solo_leveling_weapon', name: 'Клинок Одиночки', description: 'АТК +60, КРИТ +15, СКР +10', goldCost: 10000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30 },
  { id: 'solo_leggings', resultItemId: 'solo_leveling_leggings', name: 'Поножи Одиночки', description: 'ЗАЩ +28, СКР +12, HP +60', goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22 },
  { id: 'solo_boots', resultItemId: 'solo_leveling_boots', name: 'Ботинки Одиночки', description: 'СКР +16, ЗАЩ +15, АТК +5', goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21 },
  { id: 'solo_necklace', resultItemId: 'solo_leveling_necklace', name: 'Ожерелье Одиночки', description: 'АТК +18, КРИТ +10, HP +50', goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22 },
  { id: 'solo_ring', resultItemId: 'solo_leveling_ring', name: 'Кольцо Одиночки', description: 'АТК +15, КРИТ +12, СКР +5', goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20 },
]

const LEGENDARY_PUNCH: SetPieceCraft[] = [
  { id: 'punch_helmet', resultItemId: 'one_punch_helmet', name: 'Плащ Ванпанчмена', description: 'ЗАЩ +15, АТК +20, КРИТ +10', goldCost: 5000, requiredProfession: 'blacksmith', requiredProfessionLevel: 20 },
  { id: 'punch_chest', resultItemId: 'one_punch_chestplate', name: 'Костюм Ванпанчмена', description: 'ЗАЩ +35, АТК +25, HP +120', goldCost: 8000, requiredProfession: 'blacksmith', requiredProfessionLevel: 25 },
  { id: 'punch_weapon', resultItemId: 'one_punch_weapon', name: 'Кулак справедливости', description: 'АТК +80, КРИТ +30, СКР +15', goldCost: 12000, requiredProfession: 'blacksmith', requiredProfessionLevel: 30 },
  { id: 'punch_leggings', resultItemId: 'one_punch_leggings', name: 'Штаны Ванпанчмена', description: 'ЗАЩ +20, СКР +20, АТК +10', goldCost: 6500, requiredProfession: 'blacksmith', requiredProfessionLevel: 22 },
  { id: 'punch_boots', resultItemId: 'one_punch_boots', name: 'Ботинки Ванпанчмена', description: 'СКР +25, АТК +15, КРИТ +8', goldCost: 5500, requiredProfession: 'blacksmith', requiredProfessionLevel: 21 },
  { id: 'punch_necklace', resultItemId: 'one_punch_necklace', name: 'Значок героя', description: 'АТК +30, КРИТ +15', goldCost: 6000, requiredProfession: 'jeweler', requiredProfessionLevel: 22 },
  { id: 'punch_ring', resultItemId: 'one_punch_ring', name: 'Перчатка Ванпанчмена', description: 'АТК +35, КРИТ +20', goldCost: 5000, requiredProfession: 'jeweler', requiredProfessionLevel: 20 },
]

const EPIC_ASSASSIN: SetPieceCraft[] = [
  { id: 'assassin_helmet', resultItemId: 'assassin_helmet', name: 'Капюшон Ассасина', description: 'АТК +8, КРИТ +10, СКРЫТ +6', goldCost: 2000, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'assassin_chest', resultItemId: 'assassin_chestplate', name: 'Плащ Ассасина', description: 'АТК +12, КРИТ +8, СКРЫТ +5', goldCost: 3000, requiredProfession: 'blacksmith', requiredProfessionLevel: 13 },
  { id: 'assassin_weapon', resultItemId: 'assassin_weapon', name: 'Клинок Ассасина', description: 'АТК +42, КРИТ +18, СКРЫТ +10', goldCost: 3800, requiredProfession: 'blacksmith', requiredProfessionLevel: 15 },
  { id: 'assassin_leggings', resultItemId: 'assassin_leggings', name: 'Поножи Ассасина', description: 'АТК +6, КРИТ +12, СКРЫТ +10', goldCost: 2600, requiredProfession: 'blacksmith', requiredProfessionLevel: 12 },
  { id: 'assassin_boots', resultItemId: 'assassin_boots', name: 'Сапоги Ассасина', description: 'АТК +8, КРИТ +8, СКРЫТ +12', goldCost: 2200, requiredProfession: 'blacksmith', requiredProfessionLevel: 11 },
  { id: 'assassin_necklace', resultItemId: 'assassin_necklace', name: 'Амулет тени', description: 'АТК +16, КРИТ +14, СКРЫТ +8', goldCost: 2400, requiredProfession: 'jeweler', requiredProfessionLevel: 12 },
  { id: 'assassin_ring', resultItemId: 'assassin_ring', name: 'Кольцо убийцы', description: 'АТК +12, КРИТ +16, СКРЫТ +6', goldCost: 2000, requiredProfession: 'jeweler', requiredProfessionLevel: 11 },
]

const MYTHIC_PENIVISE: SetPieceCraft[] = [
  { id: 'penivise_helmet', resultItemId: 'penivise_helmet', name: 'Маска Пенивайза', description: 'АТК +22, СКРЫТ +18, КРИТ +12', goldCost: 18000, requiredProfession: 'blacksmith', requiredProfessionLevel: 35 },
  { id: 'penivise_chest', resultItemId: 'penivise_chestplate', name: 'Мантия Пенивайза', description: 'АТК +28, СКРЫТ +14, HP +120', goldCost: 28000, requiredProfession: 'blacksmith', requiredProfessionLevel: 38 },
  { id: 'penivise_weapon', resultItemId: 'penivise_weapon', name: 'Клинок Пенивайза', description: 'АТК +95, КРИТ +28, СКРЫТ +22', goldCost: 45000, requiredProfession: 'blacksmith', requiredProfessionLevel: 40 },
  { id: 'penivise_leggings', resultItemId: 'penivise_leggings', name: 'Поножи Пенивайза', description: 'АТК +18, СКРЫТ +20, КРИТ +10', goldCost: 24000, requiredProfession: 'blacksmith', requiredProfessionLevel: 36 },
  { id: 'penivise_boots', resultItemId: 'penivise_boots', name: 'Сапоги Пенивайза', description: 'АТК +16, СКРЫТ +24, КРИТ +12', goldCost: 20000, requiredProfession: 'blacksmith', requiredProfessionLevel: 35 },
  { id: 'penivise_necklace', resultItemId: 'penivise_necklace', name: 'Око Пенивайза', description: 'АТК +32, КРИТ +20, СКРЫТ +16', goldCost: 22000, requiredProfession: 'jeweler', requiredProfessionLevel: 36 },
  { id: 'penivise_ring', resultItemId: 'penivise_ring', name: 'Печать Пенивайза', description: 'АТК +28, КРИТ +22, СКРЫТ +14', goldCost: 18000, requiredProfession: 'jeweler', requiredProfessionLevel: 35 },
]

function toMythicRecipes(setName: string, pieces: SetPieceCraft[]): CraftRecipe[] {
  return pieces.map((p) => ({
    id: `craft_mythic_${p.id}`,
    resultItemId: p.resultItemId,
    name: p.name,
    description: `Мифический сет «${setName}». ${p.description}`,
    resources: resourcesForPiece(p, 'mythic'),
    goldCost: p.goldCost,
    requiredProfession: p.requiredProfession,
    requiredProfessionLevel: p.requiredProfessionLevel,
    isSetCraft: true,
    setCraftRarity: 'mythic' as const,
  }))
}
export const EPIC_SET_CRAFT_RECIPES: CraftRecipe[] = [
  ...toEpicRecipes('Громобой', EPIC_STORM),
  ...toEpicRecipes('Кристальный Страж', EPIC_CRYSTAL),
  ...toEpicRecipes('Повелитель Зверей', EPIC_BEAST),
  ...toEpicRecipes('Ассасин', EPIC_ASSASSIN),
]

export const LEGENDARY_SET_CRAFT_RECIPES: CraftRecipe[] = [
  ...toLegendaryRecipes(LEGENDARY_SHADOW),
  ...toLegendaryRecipes(LEGENDARY_SOLO),
  ...toLegendaryRecipes(LEGENDARY_PUNCH),
]

export const MYTHIC_SET_CRAFT_RECIPES: CraftRecipe[] = [
  ...toMythicRecipes('Пенивайз', MYTHIC_PENIVISE),
]
