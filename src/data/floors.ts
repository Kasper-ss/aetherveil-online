import type { FloorData, FloorEnemy } from '@/types/game'
import { getMobsRequiredForFloor } from '@/data/items'

export const MAX_FLOOR = 50

const PATTERNS: FloorEnemy['pattern'][] = ['aggressive', 'defensive', 'berserker']

const MOB_NAMES = [
  'Скелет-страж', 'Теневой сталкер', 'Кристальный голем', 'Пепельный дух', 'Эфирный фантом',
  'Ледяной элементаль', 'Огненный бес', 'Пещерный тролль', 'Ядовитый паук', 'Рунический страж',
  'Пустотный охотник', 'Штормовой рыцарь', 'Каменный колосс', 'Некромант', 'Древний страж',
  'Хаос-имп', 'Звёздный дрейк', 'Мрачный ликантроп', 'Астральный рыцарь', 'Разломный ужас',
]

const BOSS_TITLES = [
  'Повелитель теней', 'Хранитель этажа', 'Древний тиран', 'Повелитель стихий', 'Эфирный суверен',
  'Король бездны', 'Архонт разлома', 'Властелин шторма', 'Падший герой', 'Страж Башни',
]

const ZONE_NAMES: { from: number; name: string; desc: string; theme: string }[] = [
  { from: 1, name: 'Город Начала', desc: 'Стартовые зоны Башни.', theme: '#1a3a2a' },
  { from: 6, name: 'Кристальные глубины', desc: 'Светящиеся пещеры и руины.', theme: '#1a2a4a' },
  { from: 11, name: 'Лес Шёпотов', desc: 'Древние деревья скрывают хищников.', theme: '#1a3a1a' },
  { from: 16, name: 'Пепельные пустоши', desc: 'Выжженная земля и огненные элементали.', theme: '#3a1a1a' },
  { from: 21, name: 'Ледяные залы', desc: 'Морозные коридоры и ледяные стражи.', theme: '#1a2a3a' },
  { from: 26, name: 'Штормовой бастион', desc: 'Ветра и молнии на верхних ярусах.', theme: '#2a2a4a' },
  { from: 31, name: 'Трон пустоты', desc: 'Реальность истончается у разломов.', theme: '#2a1a3a' },
  { from: 36, name: 'Звёздный цитадель', desc: 'Космическая энергия пронизывает этажи.', theme: '#1a1a4a' },
  { from: 41, name: 'Эфирный шпиль', desc: 'Последние испытания перед вершиной.', theme: '#2a1a4a' },
  { from: 46, name: 'Вершина Эфира', desc: 'Финальные хранители Башни.', theme: '#3a1a5a' },
]

function zoneForFloor(floor: number) {
  let z = ZONE_NAMES[0]
  for (const entry of ZONE_NAMES) {
    if (floor >= entry.from) z = entry
  }
  return z
}

/** Difficulty multiplier — grows faster on higher floors */
export function getFloorDifficultyMult(floor: number): number {
  return 1 + (floor - 1) * 0.12 + Math.pow(floor, 1.35) * 0.075
}

/** Extra challenge from floor 3 — forces gear progression */
export function getFloorChallengeMult(floor: number): number {
  if (floor <= 2) return 1
  return 1 + (floor - 2) * 0.28 + Math.pow(floor - 2, 1.5) * 0.14
}

/** Reward scaling — higher floors yield more gold and EXP, especially bosses */
function getFloorRewardScale(floor: number): number {
  return 1 + (floor - 1) * 0.14 + Math.pow(floor, 1.2) * 0.055
}

export function makeEnemy(floor: number, name: string, pattern: FloorEnemy['pattern'], isBoss = false): FloorEnemy {
  const diff = getFloorDifficultyMult(floor)
  const challenge = getFloorChallengeMult(floor)
  const rewardScale = getFloorRewardScale(floor)
  const floorPower = floor >= 2 ? 1.5 : 1
  const bossMult = isBoss ? 5 : 1
  const statMult = challenge * (isBoss ? 1.35 : 1)
  const baseHp = Math.floor((200 + floor * 105) * diff * bossMult * floorPower * statMult)
  const baseAtk = Math.floor((8 + floor * 4) * diff * (isBoss ? 1.55 : 1) * floorPower * statMult)
  const baseDef = Math.floor((4 + floor * 2) * diff * (isBoss ? 2.2 : 1) * floorPower * statMult)
  const crit = isBoss ? Math.min(25, 8 + Math.floor(floor / 4)) : Math.min(15, 3 + Math.floor(floor / 6))
  const speed = isBoss ? Math.min(20, 6 + Math.floor(floor / 5)) : Math.min(18, 4 + Math.floor(floor / 4))
  const expBase = Math.floor((35 + floor * 28) * diff * rewardScale)
  const goldMin = Math.floor((14 + floor * 9) * diff * rewardScale)
  const goldMax = Math.floor((32 + floor * 18) * diff * rewardScale)

  return {
    id: `${floor}_${name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '_')}`,
    name,
    pattern,
    stats: { hp: baseHp, atk: baseAtk, def: baseDef, crit, speed },
    expReward: Math.floor(expBase * (isBoss ? 14 : 1)),
    goldReward: [
      Math.floor(goldMin * (isBoss ? 8 : 1)),
      Math.floor(goldMax * (isBoss ? 16 : 1)),
    ],
    lootTable: [],
    isBoss,
  }
}

/** Epic variant — stronger mob, better loot */
export function makeEpicEnemy(base: FloorEnemy): FloorEnemy {
  return {
    ...base,
    id: `${base.id}_epic`,
    name: `★ ${base.name}`,
    isEpic: true,
    stats: {
      hp: Math.floor(base.stats.hp * 1.85),
      atk: Math.floor(base.stats.atk * 1.5),
      def: Math.floor(base.stats.def * 1.35),
      crit: Math.min(30, base.stats.crit + 5),
      speed: Math.min(25, base.stats.speed + 3),
    },
    expReward: Math.floor(base.expReward * 1.4),
    goldReward: [
      Math.floor(base.goldReward[0] * 1.5),
      Math.floor(base.goldReward[1] * 1.5),
    ],
  }
}

export const MAX_MINI_BOSSES_PER_FLOOR = 3
export const MINI_BOSS_SPAWN_CHANCE = 0.09

const MINI_BOSS_PREFIXES = ['Страж', 'Избранник', 'Аватар', 'Вестник', 'Падший']

/** Mini-boss — rarer than epic, boosted loot, up to 3 per floor lifetime */
export function makeMiniBoss(base: FloorEnemy, floor: number): FloorEnemy {
  const prefix = MINI_BOSS_PREFIXES[floor % MINI_BOSS_PREFIXES.length]
  return {
    ...base,
    id: `${base.id}_mini`,
    name: `👹 ${prefix} ${base.name}`,
    isMiniBoss: true,
    stats: {
      hp: Math.floor(base.stats.hp * 2.4),
      atk: Math.floor(base.stats.atk * 1.4),
      def: Math.floor(base.stats.def * 1.5),
      crit: Math.min(28, base.stats.crit + 4),
      speed: Math.min(22, base.stats.speed + 2),
    },
    expReward: Math.floor(base.expReward * 1.75),
    goldReward: [
      Math.floor(base.goldReward[0] * 1.8),
      Math.floor(base.goldReward[1] * 1.8),
    ],
  }
}

function mobName(floor: number, index: number): string {
  const base = MOB_NAMES[(floor * 3 + index) % MOB_NAMES.length]
  if (floor <= 5) return base
  return `${base} ${floor}-го яруса`
}

function bossName(floor: number): string {
  const title = BOSS_TITLES[(floor - 1) % BOSS_TITLES.length]
  if (floor <= 5) {
    const legacy = ['Иллфанг — Повелитель кобольдов', 'Кристальный страж', 'Древний треант', 'Инферно-дрейк', 'Эфирный страж']
    return legacy[floor - 1] ?? `${title} (этаж ${floor})`
  }
  return `${title} — этаж ${floor}`
}

function buildFloor(floor: number): FloorData {
  const zone = zoneForFloor(floor)
  const legacyMobs: Record<number, Array<[string, FloorEnemy['pattern']]>> = {
    1: [['Френбор', 'aggressive'], ['Непент', 'defensive'], ['Кобольд', 'aggressive']],
    2: [['Кристальная летучая мышь', 'aggressive'], ['Пещерная слизь', 'defensive'], ['Каменный голем', 'berserker']],
    3: [['Теневой волк', 'aggressive'], ['Древень', 'defensive'], ['Ядовитый спрайт', 'berserker']],
    4: [['Огненный дух', 'aggressive'], ['Пепельный пёс', 'berserker'], ['Магмовый краб', 'defensive']],
    5: [['Эфирный рыцарь', 'defensive'], ['Сталкер пустоты', 'aggressive'], ['Фантом разлома', 'berserker']],
  }
  const enemies = floor <= 5
    ? legacyMobs[floor].map(([name, pattern]) => makeEnemy(floor, name, pattern))
    : PATTERNS.map((pattern, i) => makeEnemy(floor, mobName(floor, i), pattern))
  const idleGold = Math.floor(40 + floor * 12 + Math.pow(floor, 1.2) * 8)
  const idleExp = Math.floor(25 + floor * 8 + Math.pow(floor, 1.15) * 5)

  return {
    floor,
    name: floor <= 5
      ? ['Город Начала', 'Кристальные пещеры', 'Лес Шёпотов', 'Пепельные пустоши', 'Эфирный шпиль'][floor - 1]
      : `${zone.name} · ${floor}`,
    description: floor <= 5
      ? [
          'Стартовый этаж. Луга и слабые монстры.',
          'Светящиеся пещеры под Башней.',
          'Древние деревья скрывают хищников.',
          'Выжженная земля и огненные элементали.',
          'Первый серьёзный рубеж. Только сильные пройдут.',
        ][floor - 1]
      : `${zone.desc} Сложность растёт с каждым этажом.`,
    theme: zone.theme,
    enemies,
    boss: makeEnemy(floor, bossName(floor), 'boss', true),
    mobsRequired: getMobsRequiredForFloor(floor),
    idleGoldPerHour: idleGold,
    idleExpPerHour: idleExp,
  }
}

export const FLOORS: FloorData[] = Array.from({ length: MAX_FLOOR }, (_, i) => buildFloor(i + 1))

export function getFloorData(floor: number): FloorData {
  const clamped = Math.max(1, Math.min(MAX_FLOOR, floor))
  return FLOORS[clamped - 1]
}
