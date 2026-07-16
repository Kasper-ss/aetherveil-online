import type { Player, Stats, ItemRarity } from '@/types/game'
import { SET_DATA } from '@/data/items'
import { MAXIMIT_SET_BONUS, MAXIMIT_SET_ID } from '@/data/maximitSet'
import type { EffectiveStats } from '@/lib/playerStats'

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export interface SetBonusEffect {
  /** Percent bonus applied to computed ATK/DEF/CRIT before flat adds. */
  percent?: Partial<Record<'atk' | 'def' | 'crit', number>>
  flat?: Partial<Stats & { stealth: number }>
}

export interface ActiveSetBonus {
  id: string
  name: string
  description: string
  effect: SetBonusEffect
}

const RARITY_SET_BONUSES: Record<
  ItemRarity,
  { label: string; desc: string; effect: SetBonusEffect } | null
> = {
  common: null,
  rare: null,
  epic: {
    label: 'Эпический сет',
    desc: '7 эпических предметов: +8% ATK, +8% DEF, +5% CRIT',
    effect: { percent: { atk: 8, def: 8, crit: 5 } },
  },
  legendary: {
    label: 'Легендарный сет',
    desc: '7 легендарных предметов: +12% ATK, +12% DEF, +10% CRIT, +50 HP',
    effect: { percent: { atk: 12, def: 12, crit: 10 }, flat: { hp: 50, speed: 5 } },
  },
  mythic: {
    label: 'Мифический сет',
    desc: '7 мифических предметов: +20% ATK, +15% DEF, +15% CRIT, +100 HP, +10 SPD',
    effect: { percent: { atk: 20, def: 15, crit: 15 }, flat: { hp: 100, speed: 10 } },
  },
  divine: null,
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

function namedSetPieceStats(setId: string, isLucky: boolean): SetBonusEffect {
  if (isLucky) return { flat: { crit: 8, speed: 6, atk: 6, def: 4, hp: 30 } }
  switch (setId) {
    case 'assassin':
      return { flat: { atk: 14, crit: 20, stealth: 12, speed: 6 } }
    case 'penivise':
      return { flat: { atk: 28, crit: 18, stealth: 20, speed: 8, hp: 60 } }
    case MAXIMIT_SET_ID:
      return MAXIMIT_SET_BONUS.effect
    default:
      return { flat: { crit: 12, speed: 8, atk: 10, def: 6, hp: 40 } }
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
        effect: namedSetPieceStats(set.id, isLucky),
      })
    }
  }

  if ((bySetId[MAXIMIT_SET_ID] ?? 0) >= 7) {
    bonuses.push({
      id: MAXIMIT_SET_ID,
      name: MAXIMIT_SET_BONUS.name,
      description: MAXIMIT_SET_BONUS.description,
      effect: MAXIMIT_SET_BONUS.effect,
    })
  }

  for (const rarity of ['epic', 'legendary', 'mythic'] as ItemRarity[]) {
    const cfg = RARITY_SET_BONUSES[rarity]
    if (cfg && (byRarity[rarity] ?? 0) >= 7) {
      bonuses.push({ id: `rarity_${rarity}`, name: cfg.label, description: cfg.desc, effect: cfg.effect })
    }
  }

  return bonuses
}

export function applySetBonuses(player: Player, base: EffectiveStats): EffectiveStats {
  const bonuses = getActiveSetBonuses(player)
  let pctAtk = 0
  let pctDef = 0
  let pctCrit = 0
  const flat = { atk: 0, def: 0, hp: 0, crit: 0, speed: 0, stealth: 0 }

  for (const b of bonuses) {
    pctAtk += b.effect.percent?.atk ?? 0
    pctDef += b.effect.percent?.def ?? 0
    pctCrit += b.effect.percent?.crit ?? 0
    flat.atk += b.effect.flat?.atk ?? 0
    flat.def += b.effect.flat?.def ?? 0
    flat.hp += b.effect.flat?.hp ?? 0
    flat.crit += b.effect.flat?.crit ?? 0
    flat.speed += b.effect.flat?.speed ?? 0
    flat.stealth += b.effect.flat?.stealth ?? 0
  }

  return {
    ...base,
    atk: Math.floor(base.atk * (1 + pctAtk / 100)) + flat.atk,
    def: Math.floor(base.def * (1 + pctDef / 100)) + flat.def,
    hp: base.hp + flat.hp,
    crit: Math.floor(base.crit * (1 + pctCrit / 100)) + flat.crit,
    speed: base.speed + flat.speed,
    stealth: base.stealth + flat.stealth,
  }
}
