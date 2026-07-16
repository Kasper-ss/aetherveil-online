export type GameEventKind =
  | 'blood_moon'
  | 'legendary_hunt'
  | 'dark_portal'
  | 'shadow_invasion'
  | 'secret_floor'

export type GameEventTier = 'weekly' | 'rare' | 'legendary'

export interface GameEventDefinition {
  kind: GameEventKind
  title: string
  icon: string
  description: string
  buffs: string[]
  durationDays: number
  tier: GameEventTier
  /** Сложный данж — особое оформление в UI */
  isHardDungeon?: boolean
  lootMult?: number
  bossLootMult?: number
  goldMult?: number
}

export const GAME_EVENT_DEFINITIONS: Record<GameEventKind, GameEventDefinition> = {
  blood_moon: {
    kind: 'blood_moon',
    title: 'Кровавая Луна',
    icon: '🌕',
    description: 'Кровавый свет освещает башню. Мобы и боссы оставляют больше добычи.',
    buffs: ['+50% дроп с мобов', '+50% дроп с боссов'],
    durationDays: 7,
    tier: 'weekly',
    lootMult: 1.5,
    bossLootMult: 1.5,
  },
  legendary_hunt: {
    kind: 'legendary_hunt',
    title: 'Охота на Легендарных Монстров',
    icon: '🐉',
    description: 'Появляются особо сильные мобы с уникальным лутом.',
    buffs: ['+30% шанс легендарного моба', 'Уникальный лут с охоты'],
    durationDays: 3,
    tier: 'weekly',
    lootMult: 1.2,
  },
  dark_portal: {
    kind: 'dark_portal',
    title: 'Тёмный Портал',
    icon: '🌀',
    description: 'Открывается сложный данж для всех игроков. Экстремальная сложность и уникальные награды.',
    buffs: ['Доступ к Тёмному Порталу', 'Уникальные награды данжа', 'Повышенная сложность'],
    durationDays: 2,
    tier: 'weekly',
    isHardDungeon: true,
  },
  shadow_invasion: {
    kind: 'shadow_invasion',
    title: 'Вторжение Теней',
    icon: '👁',
    description: 'Глобальное событие — волны теней атакуют башню. Золото за победы растёт.',
    buffs: ['+35% золото за победы', 'Волны усиленных мобов', 'Глобальный рейтинг активности'],
    durationDays: 2,
    tier: 'rare',
    goldMult: 1.35,
    lootMult: 1.15,
  },
  secret_floor: {
    kind: 'secret_floor',
    title: 'Секретный Этаж',
    icon: '🔮',
    description: 'Раз в месяц открывается скрытый этаж башни с уникальной экипировкой.',
    buffs: ['Доступ к секретному этажу', 'Уникальный лут', 'Повышенный шанс редких предметов'],
    durationDays: 3,
    tier: 'legendary',
    lootMult: 1.4,
  },
}

export const TIER_LABELS: Record<GameEventTier, string> = {
  weekly: 'Еженедельное',
  rare: 'Редкое',
  legendary: 'Очень редкое',
}
