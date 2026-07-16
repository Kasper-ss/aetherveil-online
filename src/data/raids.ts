import type { FloorEnemy, Item, ResourceId } from '@/types/game'
import { makeEnemy } from '@/data/floors'
import { getFloorData } from '@/data/floors'
import { generateVictoryLoot, generateCombatResources } from '@/data/gameData'
import { createItemInstance } from '@/data/items'
import { rollRaidExclusiveItemId } from '@/data/raidExclusiveGear'
import { rollJewelLoot } from '@/lib/jewelResources'

export const RAID_MOBS_REQUIRED = 50
export const RAID_DEATH_COOLDOWN_MS = 60 * 60 * 1000
export const RAID_MOB_ENERGY = 12
export const RAID_BOSS_ENERGY = 25

export interface RaidDefinition {
  id: string
  floor: number
  index: 0 | 1
  nameRu: string
  descriptionRu: string
}

const RAID_NAMES: [string, string][] = [
  ['Штурм глубин', 'Осада теней'],
  ['Узы хаоса', 'Крепость бездны'],
]

export function getRaidId(floor: number, index: 0 | 1): string {
  return `raid_${floor}_${index}`
}

export function getRaidsForFloor(floor: number): RaidDefinition[] {
  const floorData = getFloorData(floor)
  return ([0, 1] as const).map((index) => ({
    id: getRaidId(floor, index),
    floor,
    index,
    nameRu: `${floorData.name}: ${RAID_NAMES[index][0]}`,
    descriptionRu: `Элитный рейд этажа ${floor}. 50 мобов и босс. Усиленные враги и лучший лут — готовьтесь заранее.`,
  }))
}

export function buildRaidEnemy(floor: number, raidIndex: number, isBoss: boolean): FloorEnemy {
  const mobNames = ['Страж рейда', 'Избранник тьмы', 'Каратель этажа', 'Поглотитель эфира']
  const bossNames = [`Хранитель рейда`, `Вестник бездны`]
  const name = isBoss ? bossNames[raidIndex] : mobNames[Math.floor(Math.random() * mobNames.length)]
  const base = makeEnemy(floor, name, isBoss ? 'boss' : 'aggressive', isBoss)
  const tierMult = 1 + raidIndex * 0.12 + floor * 0.015
  const mult = isBoss ? 2.35 * tierMult : 1.5 * tierMult

  return {
    ...base,
    id: `raid_${floor}_${raidIndex}_${isBoss ? 'boss' : 'mob'}_${Date.now()}`,
    name: isBoss ? `👑 ${name}` : `⚔️ ${name}`,
    isBoss,
    stats: {
      hp: Math.floor(base.stats.hp * mult),
      atk: Math.floor(base.stats.atk * mult),
      def: Math.floor(base.stats.def * mult),
      crit: Math.min(40, base.stats.crit + (isBoss ? 7 : 3)),
      speed: Math.min(32, base.stats.speed + (isBoss ? 5 : 2)),
    },
    expReward: Math.floor(base.expReward * (isBoss ? 3.5 : 1.25)),
    goldReward: [
      Math.floor(base.goldReward[0] * (isBoss ? 5 : 1.6)),
      Math.floor(base.goldReward[1] * (isBoss ? 6 : 1.9)),
    ],
  }
}

export function generateRaidResources(
  floor: number,
  isBoss: boolean,
  rareLootMult = 1,
): Partial<Record<ResourceId, number>> {
  const base = generateCombatResources(floor, isBoss, false, isBoss, rareLootMult)
  const mult = isBoss ? 2.8 : 1.7
  const res: Partial<Record<ResourceId, number>> = {}
  for (const [k, v] of Object.entries(base)) {
    if (v) res[k as ResourceId] = Math.max(1, Math.floor(v * mult))
  }
  Object.assign(res, rollJewelLoot(isBoss ? 0.4 : 0.1, isBoss ? 2 : 1, isBoss))
  if (isBoss) {
    res.upgrade_core = (res.upgrade_core ?? 0) + 2 + Math.floor(floor / 4)
    if (floor >= 5) res.star_shard = (res.star_shard ?? 0) + 1 + Math.floor(floor / 8)
    if (floor >= 10) res.mithril_ore = (res.mithril_ore ?? 0) + 1
  }
  return res
}

export function generateRaidLoot(
  floor: number,
  isBoss: boolean,
  lootMult = 1,
): Item[] {
  const loot = generateVictoryLoot(floor, isBoss, 2.4 * lootMult, false, isBoss)
  const exclusiveId = rollRaidExclusiveItemId(floor, isBoss, lootMult)
  if (exclusiveId) {
    const exclusive = createItemInstance(exclusiveId)
    if (exclusive) loot.push(exclusive)
  }
  return loot
}

export function getRaidCompletionBonus(floor: number): { gold: number; gems: number } {
  return {
    gold: 200 + floor * 80,
    gems: floor >= 20 ? 3 : floor >= 10 ? 2 : 1,
  }
}
