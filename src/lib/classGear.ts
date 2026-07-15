import type { Item, Player, PlayerClass } from '@/types/game'
import { getClassData } from '@/data/classes'

export function getItemClassLabel(classId?: PlayerClass): string | null {
  if (!classId) return null
  return getClassData(classId).nameRu
}

export function canPlayerEquipItem(
  item: Item,
  player: Pick<Player, 'classId' | 'secondaryClassId'>,
): { ok: true } | { ok: false; className: string } {
  if (!item.requiredClass) return { ok: true }
  if (item.requiredClass === player.classId || item.requiredClass === player.secondaryClassId) {
    return { ok: true }
  }
  return { ok: false, className: getClassData(item.requiredClass).nameRu }
}

export function formatItemClassRestriction(item: Item): string | null {
  const label = getItemClassLabel(item.requiredClass)
  if (!label) return null
  return `Только для ${label}`
}
