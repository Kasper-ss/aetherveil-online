import type { CraftRecipe, PlayerClass } from '@/types/game'
import type { EquipSlot } from '@/data/items'
import { buildLuckyCraftResources, LUCKY_GOLD_COST } from '@/data/craftResources'

const PIECE_LUCK_DESC = '+4% золото, +4% опыт, +3% добыча за каждую вещь'
const FULL_LUCK_DESC = `Полный сет: ещё +15% золото, +15% опыт, +10% добыча. ${PIECE_LUCK_DESC}`

interface LuckyPiece {
  slot: EquipSlot
  name: string
  icon: string
  stats: Partial<import('@/types/game').Stats>
}

interface LuckySetDef {
  id: string
  classId: PlayerClass
  name: string
  classLabel: string
  bonus: string
  pieces: LuckyPiece[]
}

function buildPieces(prefix: string, icon: string, weaponName: string, weaponStats: Partial<import('@/types/game').Stats>): LuckyPiece[] {
  return [
    { slot: 'helmet', name: `${prefix} — Шлем удачи`, icon, stats: { def: 22, hp: 70, crit: 6 } },
    { slot: 'chestplate', name: `${prefix} — Кираса удачи`, icon, stats: { def: 38, hp: 130, atk: 6 } },
    { slot: 'leggings', name: `${prefix} — Поножи удачи`, icon, stats: { def: 20, speed: 10, hp: 50 } },
    { slot: 'boots', name: `${prefix} — Сапоги удачи`, icon, stats: { speed: 14, def: 14, crit: 5 } },
    { slot: 'necklace', name: `${prefix} — Амулет удачи`, icon, stats: { atk: 12, crit: 10, hp: 40 } },
    { slot: 'ring', name: `${prefix} — Кольцо удачи`, icon, stats: { crit: 14, atk: 10 } },
    { slot: 'weapon', name: weaponName, icon, stats: weaponStats },
  ]
}

export const LUCKY_SETS: LuckySetDef[] = [
  {
    id: 'lucky_warrior',
    classId: 'warrior',
    name: 'Lucky · Воин',
    classLabel: 'Воин',
    bonus: FULL_LUCK_DESC,
    pieces: buildPieces('Воин', '🍀', 'Клинок фортуны', { atk: 48, crit: 18, hp: 30 }),
  },
  {
    id: 'lucky_archer',
    classId: 'hunter',
    name: 'Lucky · Лучник',
    classLabel: 'Лучник',
    bonus: FULL_LUCK_DESC,
    pieces: buildPieces('Лучник', '🎯', 'Лук джекпота', { atk: 44, crit: 22, speed: 10 }),
  },
  {
    id: 'lucky_mage',
    classId: 'mage',
    name: 'Lucky · Маг',
    classLabel: 'Маг',
    bonus: FULL_LUCK_DESC,
    pieces: buildPieces('Маг', '✨', 'Посох изумрудной удачи', { atk: 52, crit: 16, speed: 8 }),
  },
  {
    id: 'lucky_summoner',
    classId: 'priest',
    name: 'Lucky · Призыватель',
    classLabel: 'Призыватель',
    bonus: FULL_LUCK_DESC,
    pieces: buildPieces('Призыватель', '👻', 'Жезл счастливого духа', { atk: 40, hp: 60, crit: 12 }),
  },
  {
    id: 'lucky_assassin',
    classId: 'rogue',
    name: 'Lucky · Убийца',
    classLabel: 'Убийца',
    bonus: FULL_LUCK_DESC,
    pieces: buildPieces('Убийца', '🎰', 'Кинжал семёрки', { atk: 50, crit: 26, speed: 14 }),
  },
  {
    id: 'lucky_knight',
    classId: 'paladin',
    name: 'Lucky · Рыцарь',
    classLabel: 'Рыцарь',
    bonus: FULL_LUCK_DESC,
    pieces: buildPieces('Рыцарь', '🛡️', 'Меч хранителя удачи', { atk: 42, def: 10, hp: 80 }),
  },
]

function craftPiece(set: LuckySetDef, piece: LuckyPiece): CraftRecipe {
  const prof = piece.slot === 'necklace' || piece.slot === 'ring' ? 'jeweler' as const : 'blacksmith' as const
  const statDesc = Object.entries(piece.stats).map(([k, v]) => {
    const labels: Record<string, string> = { atk: 'АТК', def: 'ЗАЩ', hp: 'HP', crit: 'КРИТ', speed: 'СКР' }
    return `${labels[k] ?? k} +${v}`
  }).join(', ')

  return {
    id: `craft_lucky_${set.id}_${piece.slot}`,
    resultItemId: `${set.id}_${piece.slot}`,
    name: piece.name,
    description: `Lucky-сет «${set.classLabel}». ${statDesc}. ${PIECE_LUCK_DESC}`,
    resources: buildLuckyCraftResources(),
    goldCost: LUCKY_GOLD_COST,
    requiredProfession: prof,
    requiredProfessionLevel: 35,
    requiredClass: set.classId,
    isSetCraft: true,
    setCraftRarity: 'lucky',
  }
}

export const LUCKY_SET_CRAFT_RECIPES: CraftRecipe[] = LUCKY_SETS.flatMap((set) =>
  set.pieces.map((piece) => craftPiece(set, piece)),
)
