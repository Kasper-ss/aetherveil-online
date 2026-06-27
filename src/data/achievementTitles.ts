export interface AchievementTitle {
  id: string
  label: string
  colorClass: string
}

export const ACHIEVEMENT_TITLES: Record<string, AchievementTitle> = {
  tower_climber: { id: 'tower_climber', label: 'Покоритель башни', colorClass: 'text-blue-400' },
  duelist: { id: 'duelist', label: 'Дуэлянт', colorClass: 'text-red-400' },
  veteran: { id: 'veteran', label: 'Ветеран', colorClass: 'text-slate-300' },
  master_fisher: { id: 'master_fisher', label: 'Рыбак-мастер', colorClass: 'text-cyan-400' },
  lucky_one: { id: 'lucky_one', label: 'Везунчик', colorClass: 'text-aether-gold' },
  master_smith: { id: 'master_smith', label: 'Мастер кузни', colorClass: 'text-orange-400' },
  alchemist_sage: { id: 'alchemist_sage', label: 'Мудрый алхимик', colorClass: 'text-green-400' },
  keeper_ancient_traditions: { id: 'keeper_ancient_traditions', label: 'Хранитель Древних Традиций', colorClass: 'text-amber-400' },
}

export function getTitleLabel(titleId?: string): string | null {
  if (!titleId) return null
  return ACHIEVEMENT_TITLES[titleId]?.label ?? null
}

export function getTitleColorClass(titleId?: string): string {
  if (!titleId) return 'text-aether-cyan'
  return ACHIEVEMENT_TITLES[titleId]?.colorClass ?? 'text-aether-cyan'
}
