import type { FloorEnemy, PendingPortalState, PortalType } from '@/types/game'
import { getFloorData } from '@/data/floors'
import { makeEnemy } from '@/data/floors'

export const PORTAL_SPAWN_CHANCE_MIN = 0.01
export const PORTAL_SPAWN_CHANCE_MAX = 0.05
export const BLUE_PORTAL_MOBS = 5
export const RED_PORTAL_MOBS = 10
export const PORTAL_ENERGY_COST = 5

export const PORTAL_INFO: Record<PortalType, {
  title: string
  subtitle?: string
  description: string
  image: string
  mobsRequired: number
}> = {
  blue: {
    title: 'Обнаружен Синий Портал!',
    description:
      'Стабильный разлом эфира открывает средний дополнительный уровень. ' +
      'Внутри — 5 усиленных стражей и событийный босс. Награда накапливается и выдаётся после финального боя.',
    image: '/portals/blue-portal.png',
    mobsRequired: BLUE_PORTAL_MOBS,
  },
  red: {
    title: 'Обнаружен Красный Портал!',
    subtitle: 'Уровень повышенной сложности. Готовы войти?',
    description:
      'Нестабильный разлом бездны — крайне опасная зона. ' +
      '10 элитных мобов и тяжёлый босс. Весь лут со всех противников будет показан только после убийства финального босса.',
    image: '/portals/red-portal.png',
    mobsRequired: RED_PORTAL_MOBS,
  },
}

const BLUE_MOB_NAMES = ['Эфирный страж', 'Страж разлома', 'Призрак портала', 'Хранитель синей бездны', 'Вестник эфира']
const RED_MOB_NAMES = ['Падший рыцарь', 'Демон разлома', 'Кровавый сталкер', 'Адский страж', 'Тень бездны', 'Инферно-охотник', 'Пепельный убийца', 'Разрушитель', 'Каратель', 'Вестник ада']
const BLUE_BOSS_NAMES = ['Страж Синего Портала', 'Хранитель Эфирного Разлома']
const RED_BOSS_NAMES = ['Архонт Красного Портала', 'Повелитель Бездны']

function scaleStats(
  stats: FloorEnemy['stats'],
  mult: { hp: number; atk: number; def: number; crit?: number; speed?: number },
): FloorEnemy['stats'] {
  return {
    hp: Math.floor(stats.hp * mult.hp),
    atk: Math.floor(stats.atk * mult.atk),
    def: Math.floor(stats.def * mult.def),
    crit: Math.min(40, Math.floor(stats.crit * (mult.crit ?? 1))),
    speed: Math.min(30, Math.floor(stats.speed * (mult.speed ?? 1))),
  }
}

export function rollPortalAfterVictory(opts: {
  floor: number
  isBoss: boolean
  isEpic?: boolean
  isMiniBoss?: boolean
  isPortal?: boolean
}): PendingPortalState | null {
  if (opts.isBoss || opts.isEpic || opts.isMiniBoss || opts.isPortal) return null
  const chance = PORTAL_SPAWN_CHANCE_MIN + Math.random() * (PORTAL_SPAWN_CHANCE_MAX - PORTAL_SPAWN_CHANCE_MIN)
  if (Math.random() >= chance) return null
  const type: PortalType = Math.random() < 0.28 ? 'red' : 'blue'
  return { type, floor: opts.floor }
}

export function buildPortalEnemy(
  floor: number,
  type: PortalType,
  isBoss: boolean,
  mobIndex: number,
): FloorEnemy {
  const floorData = getFloorData(floor)
  const base = floorData.enemies[mobIndex % floorData.enemies.length]

  if (isBoss) {
    const names = type === 'blue' ? BLUE_BOSS_NAMES : RED_BOSS_NAMES
    const boss = makeEnemy(floor, names[mobIndex % names.length], 'boss', true)
    const mult = type === 'blue'
      ? { hp: 2.1, atk: 1.55, def: 1.45, crit: 1.2, speed: 1.1 }
      : { hp: 3.4, atk: 1.85, def: 1.65, crit: 1.35, speed: 1.15 }
    return {
      ...boss,
      id: `portal_${type}_boss_${floor}`,
      name: type === 'blue' ? `🌀 ${boss.name}` : `🔥 ${boss.name}`,
      stats: scaleStats(boss.stats, mult),
      expReward: Math.floor(boss.expReward * (type === 'blue' ? 2.2 : 3.5)),
      goldReward: [
        Math.floor(boss.goldReward[0] * (type === 'blue' ? 2.5 : 4)),
        Math.floor(boss.goldReward[1] * (type === 'blue' ? 2.5 : 4)),
      ],
      isBoss: true,
    }
  }

  const names = type === 'blue' ? BLUE_MOB_NAMES : RED_MOB_NAMES
  const mob = makeEnemy(floor, names[mobIndex % names.length], base.pattern)
  const mult = type === 'blue'
    ? { hp: 1.45, atk: 1.25, def: 1.2, crit: 1.1, speed: 1.05 }
    : { hp: 1.95, atk: 1.55, def: 1.4, crit: 1.2, speed: 1.1 }

  return {
    ...mob,
    id: `portal_${type}_mob_${floor}_${mobIndex}`,
    name: type === 'blue' ? `💠 ${mob.name}` : `🩸 ${mob.name}`,
    stats: scaleStats(mob.stats, mult),
    expReward: Math.floor(mob.expReward * (type === 'blue' ? 1.35 : 1.75)),
    goldReward: [
      Math.floor(mob.goldReward[0] * (type === 'blue' ? 1.4 : 1.8)),
      Math.floor(mob.goldReward[1] * (type === 'blue' ? 1.4 : 1.8)),
    ],
  }
}

export function isPortalRunComplete(run: {
  mobsKilled: number
  mobsRequired: number
  bossDefeated: boolean
}): boolean {
  return run.mobsKilled >= run.mobsRequired && run.bossDefeated
}

export function getPortalFightLabel(
  type: PortalType,
  mobsKilled: number,
  mobsRequired: number,
  isBoss: boolean,
): string {
  if (isBoss) {
    return type === 'blue' ? 'Событийный босс портала' : 'Тяжёлый босс портала'
  }
  return `Моб портала · ${mobsKilled + 1}/${mobsRequired}`
}
