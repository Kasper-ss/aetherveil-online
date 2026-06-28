import type { ActiveEffect, EffectStat, Player } from '@/types/game'

export function pruneActiveEffects(effects: ActiveEffect[] | undefined): ActiveEffect[] {
  if (!effects?.length) return []
  const now = Date.now()
  return effects.filter((e) => new Date(e.until).getTime() > now)
}

export function getActiveEffects(player: Player): ActiveEffect[] {
  return pruneActiveEffects(player.activeEffects)
}

export function getEffectMultForStat(player: Player, stat: EffectStat): number {
  const effects = getActiveEffects(player)
  let mult = 1
  for (const e of effects) {
    if (e.stat !== stat && e.stat !== 'all') continue
    mult *= e.type === 'buff' ? e.mult : e.mult
  }
  return mult
}

export function addActiveEffect(
  effects: ActiveEffect[] | undefined,
  effect: Omit<ActiveEffect, 'until'> & { durationMs: number },
): ActiveEffect[] {
  const pruned = pruneActiveEffects(effects)
  const until = new Date(Date.now() + effect.durationMs).toISOString()
  const { durationMs: _, ...rest } = effect
  const existing = pruned.findIndex((e) => e.id === effect.id)
  const entry: ActiveEffect = { ...rest, until }
  if (existing >= 0) {
    const next = [...pruned]
    next[existing] = entry
    return next
  }
  return [...pruned, entry]
}

export function formatEffectRemaining(until: string): string {
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return ''
  const m = Math.ceil(ms / 60_000)
  if (m >= 60) return `${Math.floor(m / 60)}ч ${m % 60}м`
  return `${m}м`
}

export const EFFECT_PRESETS = {
  event_blessing: { id: 'event_blessing', label: 'Благословение этажа', type: 'buff' as const, stat: 'all' as const, mult: 1.1 },
  event_curse: { id: 'event_curse', label: 'Проклятие тени', type: 'debuff' as const, stat: 'all' as const, mult: 0.9 },
  potion_might: { id: 'potion_might', label: 'Зелье силы', type: 'buff' as const, stat: 'atk' as const, mult: 1.15 },
  food_feast: { id: 'food_feast', label: 'Сытный обед', type: 'buff' as const, stat: 'hp' as const, mult: 1.2 },
  boss_burn: { id: 'boss_burn', label: 'Поджог босса', type: 'debuff' as const, stat: 'all' as const, mult: 0.92 },
  boss_poison: { id: 'boss_poison', label: 'Отравление босса', type: 'debuff' as const, stat: 'hp' as const, mult: 0.88 },
  boss_atk_down: { id: 'boss_atk_down', label: 'Подавление атаки', type: 'debuff' as const, stat: 'atk' as const, mult: 0.72 },
  boss_def_down: { id: 'boss_def_down', label: 'Пробой брони', type: 'debuff' as const, stat: 'def' as const, mult: 0.72 },
  boss_rage: { id: 'boss_rage', label: 'Ярость босса', type: 'buff' as const, stat: 'atk' as const, mult: 1.25 },
} as const
