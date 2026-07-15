import type { PlayerClass } from '@/types/game'
import type { EquipSlot } from '@/data/items'

const PIECES: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon']

const PIECE_NAMES_RU: Record<EquipSlot, string> = {
  helmet: 'Шлем',
  chestplate: 'Нагрудник',
  leggings: 'Поножи',
  boots: 'Ботинки',
  necklace: 'Ожерелье',
  ring: 'Кольцо',
  weapon: 'Оружие',
  pet: 'Питомец',
}

/** Lightweight class metadata — kept here to avoid circular imports with classes/items. */
export const CLASS_META: Array<{ id: PlayerClass; nameRu: string; icon: string }> = [
  { id: 'warrior', nameRu: 'Воин', icon: '⚔️' },
  { id: 'paladin', nameRu: 'Паладин', icon: '🛡️' },
  { id: 'hunter', nameRu: 'Охотник', icon: '🏹' },
  { id: 'rogue', nameRu: 'Разбойник', icon: '🗡️' },
  { id: 'priest', nameRu: 'Жрец', icon: '✝️' },
  { id: 'shaman', nameRu: 'Шаман', icon: '⚡' },
  { id: 'mage', nameRu: 'Маг', icon: '🔮' },
  { id: 'warlock', nameRu: 'Чернокнижник', icon: '👿' },
  { id: 'druid', nameRu: 'Друид', icon: '🐻' },
  { id: 'monk', nameRu: 'Монах', icon: '🥋' },
]

export const CLASS_NAME_RU: Record<PlayerClass, string> = Object.fromEntries(
  CLASS_META.map((c) => [c.id, c.nameRu]),
) as Record<PlayerClass, string>

const SET_THEMES: Record<PlayerClass, [string, string, string]> = {
  warrior: ['Страж', 'Берсерк', 'Защитник'],
  paladin: ['Паладин', 'Святой рыцарь', 'Щитоносец'],
  hunter: ['Охотник', 'Следопыт', 'Меткий стрелок'],
  rogue: ['Разбойник', 'Тень', 'Убийца'],
  priest: ['Жрец', 'Целитель', 'Светоч'],
  shaman: ['Шаман', 'Тотемник', 'Дух ветра'],
  mage: ['Маг', 'Чародей', 'Арканист'],
  warlock: ['Колдун', 'Повелитель тьмы', 'Демонолог'],
  druid: ['Друид', 'Хранитель рощи', 'Звероликий'],
  monk: ['Монах', 'Адепт', 'Мастер кулака'],
}

const THEME_GENITIVE: Record<string, string> = {
  'Страж': 'Стража',
  'Берсерк': 'Берсерка',
  'Защитник': 'Защитника',
  'Паладин': 'Паладина',
  'Святой рыцарь': 'Святого рыцаря',
  'Щитоносец': 'Щитоносца',
  'Охотник': 'Охотника',
  'Следопыт': 'Следопыта',
  'Меткий стрелок': 'Меткого стрелка',
  'Разбойник': 'Разбойника',
  'Тень': 'Тени',
  'Убийца': 'Убийцы',
  'Жрец': 'Жреца',
  'Целитель': 'Целителя',
  'Светоч': 'Светоча',
  'Шаман': 'Шамана',
  'Тотемник': 'Тотемника',
  'Дух ветра': 'Духа ветра',
  'Маг': 'Мага',
  'Чародей': 'Чародея',
  'Арканист': 'Арканиста',
  'Колдун': 'Колдуна',
  'Повелитель тьмы': 'Повелителя тьмы',
  'Демонолог': 'Демонолога',
  'Друид': 'Друида',
  'Хранитель рощи': 'Хранителя рощи',
  'Звероликий': 'Звероликого',
  'Монах': 'Монаха',
  'Адепт': 'Адепта',
  'Мастер кулака': 'Мастера кулака',
}

function themeGenitive(theme: string): string {
  return THEME_GENITIVE[theme] ?? `${theme}а`
}

function pieceName(slot: EquipSlot, theme: string): string {
  return `${PIECE_NAMES_RU[slot]} ${themeGenitive(theme)}`
}

function pieceStats(slot: EquipSlot, themeIndex: number): Partial<import('@/types/game').Stats> {
  const t = themeIndex + 1
  switch (slot) {
    case 'helmet': return { def: 3 + t, hp: 10 + t * 4 }
    case 'chestplate': return { def: 5 + t, hp: 18 + t * 6 }
    case 'leggings': return { def: 3 + t, speed: 1 + t }
    case 'boots': return { speed: 2 + t, def: 2 + t }
    case 'necklace': return { atk: 2 + t, crit: 2 + t }
    case 'ring': return { crit: 3 + t, atk: 1 + t }
    case 'weapon': return { atk: 6 + t * 3, crit: 2 + t }
    default: return {}
  }
}

export interface ClassSetDef {
  id: string
  classId: PlayerClass
  name: string
  bonus: string
  pieces: Array<{ slot: EquipSlot; name: string; icon: string; stats: Partial<import('@/types/game').Stats> }>
}

export const CLASS_COMMON_SETS: ClassSetDef[] = CLASS_META.flatMap((cls) => {
  const themes = SET_THEMES[cls.id]
  return themes.map((theme, themeIndex) => {
    const setId = `class_${cls.id}_${themeIndex + 1}`
    return {
      id: setId,
      classId: cls.id,
      name: theme,
      bonus: `Сет «${theme}» (${cls.nameRu}): +${4 + themeIndex}% к основным статам при полной экипировке`,
      pieces: PIECES.map((slot) => ({
        slot,
        name: pieceName(slot, theme),
        icon: cls.icon,
        stats: pieceStats(slot, themeIndex),
      })),
    }
  })
})

export const SET_CLASS_MAP: Record<string, PlayerClass> = {
  shadow_ascension: 'rogue',
  solo_leveling: 'mage',
  one_punch: 'monk',
  telegram_hero: 'hunter',
  storm_breaker: 'warrior',
  crystal_guard: 'paladin',
  beast_master: 'hunter',
  assassin: 'rogue',
  penivise: 'warlock',
  ...Object.fromEntries(CLASS_COMMON_SETS.map((s) => [s.id, s.classId])),
}
