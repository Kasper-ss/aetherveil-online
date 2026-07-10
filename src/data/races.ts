import type { PlayerRace } from '@/types/game'

export interface RaceData {
  id: PlayerRace
  name: string
  nameRu: string
  icon: string
  description: string
  descriptionRu: string
  abilityNameRu: string
  abilityDescriptionRu: string
  passiveStats?: Partial<{ atk: number; def: number; crit: number; speed: number; hp: number }>
}

export const RACES: RaceData[] = [
  {
    id: 'human',
    name: 'Human',
    nameRu: 'Человек',
    icon: '🧑',
    description: 'Ambitious, adaptive and diplomatic.',
    descriptionRu: 'Самая универсальная раса. Амбициозные, адаптивные и дипломатичные.',
    abilityNameRu: 'Каждый за себя',
    abilityDescriptionRu: '+10% ко всем характеристикам на 10 секунд. +10% к репутации, бонус к духу.',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    nameRu: 'Дворф',
    icon: '🧔',
    description: 'Sturdy mountain warriors, masters of stone and ale.',
    descriptionRu: 'Крепкие горные воины, мастера камня и пива.',
    abilityNameRu: 'Каменная форма',
    abilityDescriptionRu: 'Снимает эффекты, иммунитет к яду/болезням/кровотечению, −30% урона. Шанс найти сокровище после боя.',
    passiveStats: { crit: 5 },
  },
  {
    id: 'night_elf',
    name: 'Night Elf',
    nameRu: 'Ночной эльф',
    icon: '🌙',
    description: 'Ancient guardians of nature.',
    descriptionRu: 'Древняя раса, защитники природы.',
    abilityNameRu: 'Тень / Облик медведя',
    abilityDescriptionRu: 'Невидимость в бою (уклонение +40%) или форма медведя (+25% ATK, +20% HP) на 8 сек.',
    passiveStats: { speed: 2 },
  },
  {
    id: 'orc',
    name: 'Orc',
    nameRu: 'Орк',
    icon: '💪',
    description: 'Fierce warriors, masters of melee DPS.',
    descriptionRu: 'Сильные воинственные воины. Одна из лучших рас для ДД.',
    abilityNameRu: 'Кровавое неистовство',
    abilityDescriptionRu: '+25% скорости атаки и каст-спида на 15 секунд. +5 ATK пассивно.',
    passiveStats: { atk: 5 },
  },
  {
    id: 'undead',
    name: 'Undead',
    nameRu: 'Нежить',
    icon: '💀',
    description: 'Cursed, freedom-loving undead.',
    descriptionRu: 'Проклятые, свободолюбивые мертвецы.',
    abilityNameRu: 'Воля Отрекшихся / Каннибализм',
    abilityDescriptionRu: 'Снимает страх/сон/подчинение. После убийства — выбор съесть труп (+HP). Сопротивление тьме.',
    passiveStats: { def: 3 },
  },
  {
    id: 'troll',
    name: 'Troll',
    nameRu: 'Тролль',
    icon: '🗿',
    description: 'Cunning jungle dwellers with fast regeneration.',
    descriptionRu: 'Хитрые регенерирующие жители джунглей.',
    abilityNameRu: 'Берсерк',
    abilityDescriptionRu: '+20% скорости атаки на 10 сек. Ускоренная регенерация HP. +5% крит с метательным оружием.',
    passiveStats: { crit: 5 },
  },
  {
    id: 'blood_elf',
    name: 'Blood Elf',
    nameRu: 'Эльф крови',
    icon: '🔮',
    description: 'Graceful arcane spellcasters.',
    descriptionRu: 'Грациозные магические аристократы.',
    abilityNameRu: 'Волшебный поток',
    abilityDescriptionRu: 'Восстанавливает ману/энергию + снижает ману врага. +5% крит заклинаний. Сопротивление магии.',
    passiveStats: { crit: 5 },
  },
]

export function getRaceData(raceId: PlayerRace): RaceData | undefined {
  return RACES.find((r) => r.id === raceId)
}
