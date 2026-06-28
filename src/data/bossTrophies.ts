import { getFloorData } from '@/data/gameData'
import { getEnemyAbilities } from '@/lib/enemyCombat'

export interface BossTrophy {
  id: string
  floor: number
  bossName: string
  icon: string
  loreRu: string
  abilitiesRu: string
  funFactRu: string
}

const FLOOR_LORE: Partial<Record<number, { lore: string; funFact: string }>> = {
  1: {
    lore: 'Иллфанг когда-то был капитаном стражи Города Начала, пока не заключил союз с кобольдами под Башней.',
    funFact: 'Его шлем сделан из переплавленной вывески таверны «Последний кубок».',
  },
  2: {
    lore: 'Кристальный страж — оживший голем, высеченный алхимиками для охраны жил маны.',
    funFact: 'При ударе из него сыплются осколки, которые коллекционеры носят как амулеты.',
  },
  3: {
    lore: 'Древний треант помнит лес до появления Башни и считает всех героев временными гостями.',
    funFact: 'Его кора содержит споры, вызывающие сонливость у неосторожных исследователей.',
  },
  4: {
    lore: 'Инферно-дрейк — последний потомок драконов Пепельных пустошей, питающийся углём и обидой.',
    funFact: 'Температура его чешуи достаточна, чтобы поджарить мясо без костра.',
  },
  5: {
    lore: 'Эфирный страж охраняет порог между обычными этажами и настоящими испытаниями Башни.',
    funFact: 'С этажа 5 боссы получают вторую фазу — он первый, кто научил систему этому трюку.',
  },
  10: {
    lore: 'На десятом этаже сходятся потоки эфира — босс здесь впитывает энергию всего яруса.',
    funFact: 'Некоторые гильдии устраивают пикники после победы, хотя запах серы остаётся неделями.',
  },
  25: {
    lore: 'Хранитель 25-го яруса — последний страж перед зоной, где рождаются мировые угрозы.',
    funFact: 'Именно после его падения открывается доступ к Мировому Боссу.',
  },
  50: {
    lore: 'Вершинный суверен — легендарный страж финала Башни, слившийся с самим Эфиром.',
    funFact: 'Говорят, его трофей светится в темноте, если держать его рядом с кристаллами маны.',
  },
}

function trophyIcon(floor: number): string {
  if (floor <= 5) return '👑'
  if (floor <= 15) return '🏆'
  if (floor <= 30) return '💀'
  if (floor <= 45) return '⭐'
  return '🌟'
}

export function getBossTrophy(floor: number): BossTrophy {
  const data = getFloorData(floor)
  const boss = data.boss
  const abilities = getEnemyAbilities(boss, floor)
  const custom = FLOOR_LORE[floor]
  const abilitiesRu = abilities.length > 0
    ? abilities.map((a) => a.nameRu).join(', ')
    : 'Мощные удары и усиление при низком HP'
  const phaseNote = floor >= 5 ? ' Во 2-й фазе накладывает дебаффы и усиливает себя.' : ''

  return {
    id: `trophy_floor_${floor}`,
    floor,
    bossName: boss.name,
    icon: trophyIcon(floor),
    loreRu: custom?.lore ?? `${boss.name} правит ${data.name}. Этот страж давно удерживает ${floor}-й этаж Башни от захватчиков.`,
    abilitiesRu: `${abilitiesRu}.${phaseNote}`,
    funFactRu: custom?.funFact ?? `Трофей с ${floor}-го этажа — редкость среди охотников за славой. Менее 1% новичков доходят сюда в первый месяц.`,
  }
}

export const BOSS_TROPHY_FLOORS = Array.from({ length: 50 }, (_, i) => i + 1)

export const WORLD_BOSS_TROPHY: BossTrophy = {
  id: 'trophy_world_boss',
  floor: 0,
  bossName: 'Архонт Эфирной Бездны',
  icon: '🌌',
  loreRu: 'Древнее существо, спящее в разломе между мирами. Пробуждается лишь когда герой достигает 25-го этажа и набирает достаточно силы, чтобы бросить вызов.',
  abilitiesRu: 'Двухфазный бой: вторая фаза с поджогом, ядом, снижением атаки/защиты и мощными щитами. Сложность растёт с вашим этажом.',
  funFactRu: 'Перепрохождение доступно раз в неделю — Архонт уходит восстанавливать силы в пустоте.',
}

export function getAllTrophies(): BossTrophy[] {
  return [...BOSS_TROPHY_FLOORS.map(getBossTrophy), WORLD_BOSS_TROPHY]
}

export function hasBossTrophy(player: { bossTrophies?: string[] }, trophyId: string): boolean {
  return (player.bossTrophies ?? []).includes(trophyId)
}
