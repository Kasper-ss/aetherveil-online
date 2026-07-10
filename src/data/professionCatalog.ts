import type { ProfessionId } from '@/types/game'

export type ProfessionCatalogType = 'gathering' | 'crafting'

export interface ProfessionSpecialization {
  id: string
  nameRu: string
  descriptionRu: string
  benefitsRu: string[]
}

export interface ProfessionCombo {
  professionName: string
  reasonRu: string
}

export interface ProfessionCatalogEntry {
  id: string
  nameRu: string
  nameEn: string
  icon: string
  type: ProfessionCatalogType
  typeLabelRu: string
  summaryRu: string
  descriptionRu: string
  passiveBonusRu: string | null
  activeAbilityRu: string | null
  mainBonusesRu: string[]
  specializations: ProfessionSpecialization[]
  combos: ProfessionCombo[]
  gameProfessionId?: ProfessionId
  compareNoteRu: string
}

export const PROFESSION_CATALOG: ProfessionCatalogEntry[] = [
  {
    id: 'herbalism',
    nameRu: 'Травничество',
    nameEn: 'Herbalism',
    icon: '🌿',
    type: 'gathering',
    typeLabelRu: 'Собирательская',
    summaryRu: 'Сбор трав и реагентов для алхимии и кухни.',
    descriptionRu:
      'Травники собирают редкие растения на этажах Башни и в полях Эфира. Ресурсы идут в алхимию, кухню и торговлю. Без травничества сложно поддерживать запас зелий и баффов.',
    passiveBonusRu: null,
    activeAbilityRu:
      '«Кровь Земли» (Blood of the Earth) — мгновенно восстанавливает ~5400 HP + небольшой % от максимального здоровья. Отличный экстренный хил в бою и на боссах.',
    mainBonusesRu: [
      'Доступ к редким травам высоких этажей',
      'Ускоренный сбор при высоком ранге',
      'Комбо с Алхимией для усиленных фласок',
    ],
    specializations: [],
    combos: [
      { professionName: 'Алхимия', reasonRu: 'Травы → зелья, фласки и эликсиры с бонусом к длительности.' },
      { professionName: 'Кузнечное дело', reasonRu: 'Редкие реагенты для трансмутаций в крафте.' },
    ],
    gameProfessionId: 'alchemist',
    compareNoteRu: 'Лучший выбор для поддержки и самохила. Слабее в прямом уроне, сильнее в выживаемости.',
  },
  {
    id: 'mining',
    nameRu: 'Горное дело',
    nameEn: 'Mining',
    icon: '⛏️',
    type: 'gathering',
    typeLabelRu: 'Собирательская',
    summaryRu: 'Добыча руды и металлов для кузницы и инженерии.',
    descriptionRu:
      'Шахтёры добывают железо, мифрил и редкие кристаллы. Основа экономики крафта брони и оружия. Пассивно усиливает выносливость персонажа.',
    passiveBonusRu: '+90 к Выносливости (Stamina) — больше HP и устойчивости в длительных боях.',
    activeAbilityRu: null,
    mainBonusesRu: [
      'Стабильный поток iron_ore и редких руд',
      'Бонус к энергии при длительной добыче',
      'Открывает рецепты кузницы высокого уровня',
    ],
    specializations: [],
    combos: [
      { professionName: 'Кузнечное дело', reasonRu: 'Руда → оружие, броня и сокеты.' },
      { professionName: 'Ювелирное дело', reasonRu: 'Самоцветы из шахт для огранки камней.' },
      { professionName: 'Инженерия', reasonRu: 'Металлы для механизмов и усилителей (будущий контент).' },
    ],
    gameProfessionId: 'blacksmith',
    compareNoteRu: 'Идеален для танков и ближнего боя: выносливость + лучшая броня через кузницу.',
  },
  {
    id: 'skinning',
    nameRu: 'Снятие шкур',
    nameEn: 'Skinning',
    icon: '🦌',
    type: 'gathering',
    typeLabelRu: 'Собирательская',
    summaryRu: 'Шкуры и материалы с побеждённых зверей.',
    descriptionRu:
      'Охотники за шкурой собирают hide и редкие трофеи после боёв. Усиливает критический урон — отлично для DPS-билдов.',
    passiveBonusRu: '+60 к рейтингу Критического удара (Crit Rating).',
    activeAbilityRu: null,
    mainBonusesRu: [
      'Дополнительные шкуры за убийства',
      'Шанс редких материалов с эпик-мобов',
      'Синергия с кожевничеством и кузней',
    ],
    specializations: [],
    combos: [
      { professionName: 'Кузнечное дело', reasonRu: 'Кожа для лёгкой брони и усилений.' },
      { professionName: 'Наложение чар', reasonRu: 'Материалы для чар на кольца и плащи.' },
    ],
    gameProfessionId: 'hunter',
    compareNoteRu: 'Лучший сборный выбор для фарма золота и крит-билдов. Требует активных боёв.',
  },
  {
    id: 'alchemy',
    nameRu: 'Алхимия',
    nameEn: 'Alchemy',
    icon: '⚗️',
    type: 'crafting',
    typeLabelRu: 'Крафтовая',
    summaryRu: 'Зелья, фласки, эликсиры и трансмутации.',
    descriptionRu:
      'Алхимики варят расходники для рейдов и боссов. В 3.3.5 — один из самых прибыльных крафтов за счёт фласок на весь рейд.',
    passiveBonusRu: null,
    activeAbilityRu: null,
    mainBonusesRu: [
      'Миксология — фласки действуют 2 часа вместо 1',
      'Усиление эффекта фласок/эликсиров/настоев на 20–80% (по рецепту)',
      'Крафт аксессуаров ~206 ilvl (высокоуровневые амулеты и кольца)',
      'Трансмутация редких материалов',
    ],
    specializations: [
      {
        id: 'potion_master',
        nameRu: 'Мастер зелий',
        descriptionRu: 'Фокус на боевых и лечебных зельях.',
        benefitsRu: ['+прочность зелий', 'Шанс дополнительного зелья при крафте', 'Сильнее мгновенный хил'],
      },
      {
        id: 'elixir_master',
        nameRu: 'Мастер настоев',
        descriptionRu: 'Долгие баффы на статы.',
        benefitsRu: ['Дольше действуют настои', 'Комбинированные эффекты на ATK/DEF', 'Экономия реагентов'],
      },
      {
        id: 'transmutation_master',
        nameRu: 'Мастер трансмутаций',
        descriptionRu: 'Превращение материалов в более ценные.',
        benefitsRu: ['Трансмутация эпических реагентов', 'CD на трансмутацию сокращён', 'Доступ к редким камням'],
      },
    ],
    combos: [
      { professionName: 'Травничество', reasonRu: 'Обязательная пара — бесплатные реагенты.' },
      { professionName: 'Наложение чар', reasonRu: 'Зелья + чары на кольца = максимум статов.' },
    ],
    gameProfessionId: 'alchemist',
    compareNoteRu: 'Must-have для рейдов и боссов. Слабее в крафте экипировки, сильнее в баффах.',
  },
  {
    id: 'blacksmithing',
    nameRu: 'Кузнечное дело',
    nameEn: 'Blacksmithing',
    icon: '🔨',
    type: 'crafting',
    typeLabelRu: 'Крафтовая',
    summaryRu: 'Оружие, броня и дополнительные гнёзда под камни.',
    descriptionRu:
      'Кузнецы создают лучшее физическое снаряжение и открывают дополнительные сокеты на наручах и перчатках — уникальный бонус профессии.',
    passiveBonusRu: null,
    activeAbilityRu: null,
    mainBonusesRu: [
      '+2 дополнительных сокета (наручи + перчатки) под любые камни',
      'Крафт оружия и латной брони высокого уровня',
      'Повышение редкости снаряжения (с 60 ур. и ранга кузницы)',
    ],
    specializations: [
      {
        id: 'weaponsmith',
        nameRu: 'Оружейник',
        descriptionRu: 'Специализация на оружии ближнего боя.',
        benefitsRu: ['Уникальные рецепты 1H/2H оружия', 'Бонус ATK на крафте', 'Снижение стоимости заточки'],
      },
      {
        id: 'armorsmith',
        nameRu: 'Бронник',
        descriptionRu: 'Латы и щиты.',
        benefitsRu: ['Рецепты нагрудников и поножей', 'Бонус DEF на крафте', 'Улучшенная прочность'],
      },
      {
        id: 'master_smith',
        nameRu: 'Мастер-кузнец',
        descriptionRu: 'Универсальная ветка для сетов.',
        benefitsRu: ['Доступ к сетовым рецептам', 'Шанс улучшить редкость при крафте', 'Скидка на ресурсы'],
      },
    ],
    combos: [
      { professionName: 'Горное дело', reasonRu: 'Руда без затрат на аукционе.' },
      { professionName: 'Ювелирное дело', reasonRu: 'Камни в сокеты кузнеца.' },
    ],
    gameProfessionId: 'blacksmith',
    compareNoteRu: 'Лучший крафт для воинов/рыцарей. Требует горное дело для эффективности.',
  },
  {
    id: 'jewelcrafting',
    nameRu: 'Ювелирное дело',
    nameEn: 'Jewelcrafting',
    icon: '💎',
    type: 'crafting',
    typeLabelRu: 'Крафтовая',
    summaryRu: 'Огранка камней и уникальные усиленные гнёзда.',
    descriptionRu:
      'Ювелиры создают аксессуары и три специальных усиленных камня только для владельца профессии — суммарно ~+50–60 статов (AP, SP, Stamina, Crit).',
    passiveBonusRu: null,
    activeAbilityRu: null,
    mainBonusesRu: [
      '3 специальных усиленных камня (только для ювелира): ~+50–60 суммарно к статам',
      'Крафт колец, ожерелий и редких самоцветов',
      'Просеивание руды за дополнительные осколки',
    ],
    specializations: [
      {
        id: 'gem_cutting',
        nameRu: 'Огранщик',
        descriptionRu: 'Максимальная ценность камней.',
        benefitsRu: ['+статы на огранённых камнях', 'Редкие мета-камни', 'Меньше отходов при огранке'],
      },
      {
        id: 'ring_mastery',
        nameRu: 'Мастер колец',
        descriptionRu: 'Аксессуары с уникальными статами.',
        benefitsRu: ['Рецепты колец 200+ ilvl', 'Двойной крафт аксессуаров', 'Бонус к криту на кольцах'],
      },
      {
        id: 'dragon_eye',
        nameRu: 'Драконьи очи',
        descriptionRu: 'Легендарные камни профессии.',
        benefitsRu: ['Усиленные Dragon\'s Eye камни', 'Совместимость с сокетами кузницы', 'Максимум Stamina/Crit'],
      },
    ],
    combos: [
      { professionName: 'Горное дело', reasonRu: 'Сырьё для огранки.' },
      { professionName: 'Кузнечное дело', reasonRu: 'Вставка камней в сокеты брони.' },
    ],
    gameProfessionId: 'jeweler',
    compareNoteRu: 'Максимум чистых статов. Идеален для мин-макс билдов на этажах 50+.',
  },
  {
    id: 'enchanting',
    nameRu: 'Наложение чар',
    nameEn: 'Enchanting',
    icon: '✨',
    type: 'crafting',
    typeLabelRu: 'Крафтовая',
    summaryRu: 'Чары на экипировку и разбор предметов.',
    descriptionRu:
      'Чародеи накладывают мощные чары, включая уникальные чары на кольца (+Stamina / AP / SP). Разбирают ненужный шмот на материалы для чар.',
    passiveBonusRu: null,
    activeAbilityRu: null,
    mainBonusesRu: [
      'Специальные чары на кольца: +Stamina / AP / SP (только для зачарователя)',
      'Разбор экипировки на материалы (dust/shard/essence)',
      'Чары на оружие и плащи выше стандартного уровня',
    ],
    specializations: [
      {
        id: 'ring_enchanter',
        nameRu: 'Чары на кольца',
        descriptionRu: 'Уникальные слоты кольец ×2.',
        benefitsRu: ['+Stamina на оба кольца', 'Или +AP/+SP для DPS', 'Сильнее стандартных чар'],
      },
      {
        id: 'weapon_enchanter',
        nameRu: 'Оружейные чары',
        descriptionRu: 'Максимальный урон оружия.',
        benefitsRu: ['Берсерк / Мастерство / Черная магия аналоги', 'Дольше длительность чар', 'Меньше материалов'],
      },
      {
        id: 'disenchanter',
        nameRu: 'Распылитель',
        descriptionRu: 'Эффективный разбор.',
        benefitsRu: ['Больше материалов с разбора', 'Шанс редкой пыли', 'Экономия на крафте чар'],
      },
    ],
    combos: [
      { professionName: 'Снятие шкур / Охота', reasonRu: 'Постоянный поток предметов на разбор.' },
      { professionName: 'Алхимия', reasonRu: 'Полный пакет баффов для рейда.' },
    ],
    gameProfessionId: 'sorcerer',
    compareNoteRu: 'Лучший выбор для магов и поддержки. Требует поток предметов на распыление.',
  },
]

export function getProfessionCatalogEntry(id: string): ProfessionCatalogEntry | undefined {
  return PROFESSION_CATALOG.find((p) => p.id === id)
}

export function getGatheringProfessions(): ProfessionCatalogEntry[] {
  return PROFESSION_CATALOG.filter((p) => p.type === 'gathering')
}

export function getCraftingProfessions(): ProfessionCatalogEntry[] {
  return PROFESSION_CATALOG.filter((p) => p.type === 'crafting')
}
