import type { Player, Stats, ItemRarity } from '@/types/game'
import { SET_DATA } from '@/data/items'
import type { EffectiveStats } from '@/lib/playerStats'

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export interface ActiveSetBonus {
  id: string
  name: string
  description: string
  stats: Partial<Stats>
}

const RARITY_SET_BONUSES: Record<ItemRarity, Partial<Stats> & { label: string; desc: string } | null> = {
  common: null,
  rare: null,
  epic: {
    label: 'Эпический сет',
    desc: '7 эпических предметов: +8% ATK, +8% DEF, +5% CRIT',
    atk: 0, def: 0, hp: 0, crit: 5, speed: 3,
  },
  legendary: {
    label: 'Легендарный сет',
    desc: '7 легендарных предметов: +12% ATK, +12% DEF, +10% CRIT, +50 HP',
    atk: 8, def: 8, hp: 50, crit: 10, speed: 5,
  },
  mythic: {
    label: 'Мифический сет',
    desc: '7 мифических предметов: +20% ATK, +15% DEF, +15% CRIT, +100 HP, +10 SPD',
    atk: 15, def: 12, hp: 100, crit: 15, speed: 10,
  },
}

function countEquipped(player: Player) {
  const items = EQUIP_SLOTS.map((s) => player.equipped[s]).filter(Boolean)
  const byRarity: Record<string, number> = {}
  const bySetId: Record<string, number> = {}
  for (const item of items) {
    if (!item) continue
    byRarity[item.rarity] = (byRarity[item.rarity] ?? 0) + 1
    if (item.setId) bySetId[item.setId] = (bySetId[item.setId] ?? 0) + 1
  }
  return { total: items.length, byRarity, bySetId }
}

function namedSetPieceStats(setId: string, isLucky: boolean): Partial<Stats> {
  if (isLucky) return { crit: 8, speed: 6, atk: 6, def: 4, hp: 30 }
  switch (setId) {
    case 'assassin':
      return { atk: 14, crit: 20, stealth: 12, speed: 6 }
    case 'penivise':
      return { atk: 28, crit: 18, stealth: 20, speed: 8, hp: 60 }
    default:
      return { crit: 12, speed: 8, atk: 10, def: 6, hp: 40 }
  }
}

export function getActiveSetBonuses(player: Player): ActiveSetBonus[] {
  const { byRarity, bySetId } = countEquipped(player)
  const bonuses: ActiveSetBonus[] = []

  for (const set of SET_DATA) {
    const count = bySetId[set.id] ?? 0
    if (count >= 7) {
      const isLucky = set.id.startsWith('lucky_')
      bonuses.push({
        id: set.id,
        name: isLucky ? `Lucky «${'classLabel' in set ? (set as { classLabel: string }).classLabel : set.name}»` : `Сет «${set.name}»`,
        description: set.bonus,
        stats: namedSetPieceStats(set.id, isLucky),
      })
    }
  }

  for (const rarity of ['epic', 'legendary', 'mythic'] as ItemRarity[]) {
    const cfg = RARITY_SET_BONUSES[rarity]
    if (cfg && (byRarity[rarity] ?? 0) >= 7) {
      const { label, desc, ...stats } = cfg
      bonuses.push({ id: `rarity_${rarity}`, name: label, description: desc, stats })
    }
  }

  return bonuses
}

export function applySetBonuses(player: Player, base: EffectiveStats): EffectiveStats {
  const bonuses = getActiveSetBonuses(player)
  const extra = { atk: 0, def: 0, hp: 0, crit: 0, speed: 0, stealth: 0 }
  for (const b of bonuses) {
    extra.atk += b.stats.atk ?? 0
    extra.def += b.stats.def ?? 0
    extra.hp += b.stats.hp ?? 0
    extra.crit += b.stats.crit ?? 0
    extra.speed += b.stats.speed ?? 0
    extra.stealth += b.stats.stealth ?? 0
  }
  return {
    ...base,
    atk: base.atk + extra.atk,
    def: base.def + extra.def,
    hp: base.hp + extra.hp,
    crit: base.crit + extra.crit,
    speed: base.speed + extra.speed,
    stealth: base.stealth + extra.stealth,
  }
}
