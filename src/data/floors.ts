import type { FloorData, FloorEnemy } from '@/types/game'

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
  return 1 + (floor - 1) * 0.1 + Math.pow(floor, 1.3) * 0.06
}

export function makeEnemy(floor: number, name: string, pattern: FloorEnemy['pattern'], isBoss = false): FloorEnemy {
  const diff = getFloorDifficultyMult(floor)
  const mult = isBoss ? 5 : 1
  const baseHp = Math.floor((180 + floor * 90) * diff * mult)
  const baseAtk = Math.floor((6 + floor * 3) * diff * (isBoss ? 1.4 : 1))
  const baseDef = Math.floor((4 + floor * 2) * diff * (isBoss ? 2 : 1))
  const crit = isBoss ? Math.min(25, 8 + Math.floor(floor / 4)) : Math.min(15, 3 + Math.floor(floor / 6))
  const speed = isBoss ? Math.min(20, 6 + Math.floor(floor / 5)) : Math.min(18, 4 + Math.floor(floor / 4))
  const expBase = Math.floor((25 + floor * 20) * diff)
  const goldMin = Math.floor((8 + floor * 5) * diff)
  const goldMax = Math.floor((20 + floor * 12) * diff)

  return {
    id: `${floor}_${name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '_')}`,
    name,
    pattern,
    stats: { hp: baseHp, atk: baseAtk, def: baseDef, crit, speed },
    expReward: Math.floor(expBase * (isBoss ? 8 : 1)),
    goldReward: [
      Math.floor(goldMin * (isBoss ? 5 : 1)),
      Math.floor(goldMax * (isBoss ? 8 : 1)),
    ],
    lootTable: [],
    isBoss,
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
    mobsRequired: floor * 100,
    idleGoldPerHour: idleGold,
    idleExpPerHour: idleExp,
  }
}

export const FLOORS: FloorData[] = Array.from({ length: MAX_FLOOR }, (_, i) => buildFloor(i + 1))

export function getFloorData(floor: number): FloorData {
  const clamped = Math.max(1, Math.min(MAX_FLOOR, floor))
  return FLOORS[clamped - 1]
}
