import type { ResourceId } from '@/types/game'

const ELEMENT_IDS: ResourceId[] = ['element_water', 'element_fire', 'element_air', 'element_earth']

/** Small chance element particle drops from raids / bosses. */
export function rollElementParticles(isBoss: boolean, lootMult = 1): Partial<Record<ResourceId, number>> {
  const res: Partial<Record<ResourceId, number>> = {}
  const chance = (isBoss ? 0.22 : 0.06) * lootMult
  if (Math.random() >= chance) return res
  const id = ELEMENT_IDS[Math.floor(Math.random() * ELEMENT_IDS.length)]
  res[id] = isBoss ? 1 + Math.floor(Math.random() * 2) : 1
  return res
}
