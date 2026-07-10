import type { ResourceId, SocketGemId } from '@/types/game'
import { SOCKET_GEMS } from '@/data/socketGems'

export const JEWEL_RESOURCE_IDS = SOCKET_GEMS.map((g) => `jewel_${g.id}` as ResourceId)

export function jewelResourceId(gemId: SocketGemId): ResourceId {
  return `jewel_${gemId}` as ResourceId
}

export function parseJewelResourceId(resourceId: ResourceId): SocketGemId | null {
  if (!resourceId.startsWith('jewel_')) return null
  const gem = resourceId.slice(6) as SocketGemId
  return SOCKET_GEMS.some((g) => g.id === gem) ? gem : null
}

export function rollRandomJewelResource(opts?: { rareOnly?: boolean }): ResourceId {
  const pool = opts?.rareOnly
    ? SOCKET_GEMS.filter((g) => ['jade', 'garnet', 'diamond', 'opal', 'amethyst'].includes(g.id))
    : SOCKET_GEMS
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return jewelResourceId(pick.id)
}

export function rollJewelLoot(chance: number, amount = 1, rareOnly = false): Partial<Record<ResourceId, number>> {
  if (Math.random() > chance) return {}
  const id = rollRandomJewelResource({ rareOnly })
  return { [id]: amount }
}
