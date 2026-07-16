import type { ResourceId, EnemyPattern } from '@/types/game'
import { randomInt } from '@/lib/utils'

export type FloorEventOutcome =
  | { type: 'gold'; min: number; max: number; message: string }
  | { type: 'exp'; min: number; max: number; message: string }
  | { type: 'resources'; resources: Partial<Record<ResourceId, number>>; message: string }
  | { type: 'combat'; message: string; pattern?: EnemyPattern }
  | { type: 'buff'; preset: 'event_blessing'; durationMs: number; message: string }
  | { type: 'debuff'; preset: 'event_curse'; durationMs: number; message: string }
  | { type: 'nothing'; message: string }

export interface FloorEventChoice {
  label: string
  outcome: FloorEventOutcome
}

export interface FloorEvent {
  id: string
  floorMin: number
  floorMax: number
  title: string
  story: string
  choices: FloorEventChoice[]
}

const EVENTS: FloorEvent[] = [
  {
    id: 'wounded_traveler',
    floorMin: 1, floorMax: 10,
    title: 'Раненый путник',
    story: 'У стены Башни сидит путник с перевязанной рукой. «Помоги мне добраться до лагеря — или обыщи мой мешок, если спешишь.»',
    choices: [
      { label: 'Помочь', outcome: { type: 'exp', min: 30, max: 80, message: 'Путник благодарит вас опытом.' } },
      { label: 'Обыскать мешок', outcome: { type: 'gold', min: 40, max: 120, message: 'В мешке оказалось немного золота.' } },
      { label: 'Пройти мимо', outcome: { type: 'nothing', message: 'Вы решаете не задерживаться.' } },
    ],
  },
  {
    id: 'glowing_chest',
    floorMin: 1, floorMax: 20,
    title: 'Светящийся сундук',
    story: 'Между колоннами стоит сундук, испускающий слабое эфирное свечение. Открыть или оставить?',
    choices: [
      { label: 'Открыть', outcome: { type: 'resources', resources: { meat: 3, hide: 2 }, message: 'Внутри — припасы с побеждённых мобов.' } },
      { label: 'Осмотреть осторожно', outcome: { type: 'gold', min: 20, max: 60, message: 'Ловушки не сработали — только монеты.' } },
      { label: 'Уйти', outcome: { type: 'nothing', message: 'Лучше не рисковать неизвестным.' } },
    ],
  },
  {
    id: 'crystal_shrine',
    floorMin: 6, floorMax: 20,
    title: 'Кристальный алтарь',
    story: 'Кристаллы этажа слабо гудят. Можно коснуться алтаря, разбить кристалл или уйти.',
    choices: [
      { label: 'Коснуться алтаря', outcome: { type: 'buff', preset: 'event_blessing', durationMs: 20 * 60_000, message: 'Эфир наполняет вас силой (+10% ко всем статам, 20 мин).' } },
      { label: 'Разбить кристалл', outcome: { type: 'resources', resources: { aether_dust: 1, gem_shard: 2 }, message: 'Осколки рассыпаются в вашу сумку.' } },
      { label: 'Уйти', outcome: { type: 'nothing', message: 'Алтарь остаётся нетронутым.' } },
    ],
  },
  {
    id: 'whispering_forest',
    floorMin: 11, floorMax: 25,
    title: 'Шёпот в лесу',
    story: 'Деревья шепчут на незнакомом языке. Следовать за голосом, рубить заросли или отступить?',
    choices: [
      { label: 'Следовать за голосом', outcome: { type: 'combat', pattern: 'berserker', message: 'Из тени выскакивает разъярённый монстр!' } },
      { label: 'Рубить заросли', outcome: { type: 'resources', resources: { herb: 4, hide: 3 }, message: 'Под корнями — ресурсы и шкура.' } },
      { label: 'Отступить', outcome: { type: 'debuff', preset: 'event_curse', durationMs: 15 * 60_000, message: 'Шёпот преследует вас (−10% ко всем статам, 15 мин).' } },
    ],
  },
  {
    id: 'ash_merchant',
    floorMin: 16, floorMax: 30,
    title: 'Торговец из пепла',
    story: 'Фигура в пепельном плаще предлагает обмен: мясо на золото или секрет прохода.',
    choices: [
      { label: 'Купить провизию', outcome: { type: 'resources', resources: { meat: 5, hide: 3 }, message: 'Торговец отдаёт свежие трофеи.' } },
      { label: 'Заплатить за проход', outcome: { type: 'gold', min: -80, max: -30, message: 'Вы платите за короткий путь (потеря золота).' } },
      { label: 'Отказаться', outcome: { type: 'nothing', message: 'Торговец растворяется в пепле.' } },
    ],
  },
  {
    id: 'ice_prison',
    floorMin: 21, floorMax: 35,
    title: 'Ледяная клетка',
    story: 'Во льду застыл страж прошлого. Разбить лёд, оставить или попытаться освободить?',
    choices: [
      { label: 'Разбить лёд', outcome: { type: 'combat', pattern: 'defensive', message: 'Страж оживает и атакует!' } },
      { label: 'Освободить', outcome: { type: 'exp', min: 50, max: 150, message: 'Страж благодарит знаниями боя.' } },
      { label: 'Уйти', outcome: { type: 'nothing', message: 'Лёд скрипит, но вы не задерживаетесь.' } },
    ],
  },
  {
    id: 'storm_altar',
    floorMin: 26, floorMax: 40,
    title: 'Алтарь шторма',
    story: 'Молнии бьют в каменный алтарь. Можно принять вызов, собрать осколки или обойти.',
    choices: [
      { label: 'Принять вызов', outcome: { type: 'combat', pattern: 'aggressive', message: 'Штормовой элементаль спускается с небес!' } },
      { label: 'Собрать осколки', outcome: { type: 'resources', resources: { star_shard: 1, aether_dust: 1 }, message: 'Редкие осколки попадают в инвентарь.' } },
      { label: 'Обойти', outcome: { type: 'buff', preset: 'event_blessing', durationMs: 30 * 60_000, message: 'Вы находите тихую тропу (+10% статов, 30 мин).' } },
    ],
  },
  {
    id: 'void_rift',
    floorMin: 31, floorMax: 45,
    title: 'Разлом пустоты',
    story: 'Трещина в реальности пульсирует тёмным светом. Заглянуть внутрь, запечатать или бежать?',
    choices: [
      { label: 'Заглянуть', outcome: { type: 'debuff', preset: 'event_curse', durationMs: 20 * 60_000, message: 'Пустота касается разума (−10% статов, 20 мин).' } },
      { label: 'Запечатать', outcome: { type: 'exp', min: 80, max: 200, message: 'Ритуал запечатывания приносит опыт.' } },
      { label: 'Бежать', outcome: { type: 'combat', pattern: 'berserker', message: 'Из разлома выползает ужас!' } },
    ],
  },
  {
    id: 'star_garden',
    floorMin: 36, floorMax: 50,
    title: 'Звёздный сад',
    story: 'Светящиеся цветы растут среди руин. Сорвать, подождать или охранять?',
    choices: [
      { label: 'Сорвать цветы', outcome: { type: 'resources', resources: { herb: 6, aether_dust: 2 }, message: 'Цветы превращаются в редкие ресурсы.' } },
      { label: 'Подождать', outcome: { type: 'gold', min: 100, max: 300, message: 'Проходящий паломник оставляет подношение.' } },
      { label: 'Охранять', outcome: { type: 'buff', preset: 'event_blessing', durationMs: 45 * 60_000, message: 'Сад благословляет защитника (+10% статов, 45 мин).' } },
    ],
  },
  {
    id: 'aether_gate',
    floorMin: 41, floorMax: 50,
    title: 'Врата Эфира',
    story: 'У врат стоит призрак хранителя. Сразиться, отдать дань или пройти испытание.',
    choices: [
      { label: 'Сразиться', outcome: { type: 'combat', pattern: 'aggressive', message: 'Хранитель принимает вызов!' } },
      { label: 'Отдать дань', outcome: { type: 'gold', min: -150, max: -60, message: 'Вы жертвуете золото вратам.' } },
      { label: 'Испытание', outcome: { type: 'exp', min: 120, max: 300, message: 'Испытание завершено — огромный прирост опыта.' } },
    ],
  },
]

export function pickFloorEvent(floor: number): FloorEvent | null {
  const pool = EVENTS.filter((e) => floor >= e.floorMin && floor <= e.floorMax)
  if (pool.length === 0) return null
  return pool[randomInt(0, pool.length - 1)]
}

export const FLOOR_EVENT_CHANCE = 0.22
export const EPIC_MOB_CHANCE = 0.12
export const LEGENDARY_HUNT_MOB_CHANCE = 0.08

export function rollExploreType(legendaryHuntBonus = 0): 'event' | 'epic' | 'legendary' | 'normal' {
  const roll = Math.random()
  if (roll < FLOOR_EVENT_CHANCE) return 'event'
  const legendaryChance = LEGENDARY_HUNT_MOB_CHANCE + legendaryHuntBonus
  if (roll < FLOOR_EVENT_CHANCE + legendaryChance) return 'legendary'
  if (roll < FLOOR_EVENT_CHANCE + legendaryChance + EPIC_MOB_CHANCE) return 'epic'
  return 'normal'
}
