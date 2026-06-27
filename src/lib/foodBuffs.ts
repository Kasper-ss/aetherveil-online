import type { EffectStat } from '@/types/game'
import { FOOD_BUFF_MAP } from '@/data/kitchenRecipes'

const STAT_LABELS_RU: Record<EffectStat, string> = {
  atk: 'Атаке',
  def: 'Защите',
  hp: 'HP',
  crit: 'Криту',
  speed: 'Скорости',
  all: 'всем характеристикам',
}

function formatDurationRu(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec >= 3600) {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
  }
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return s > 0 ? `${m} мин ${s} сек` : `${m} мин`
  }
  return `${totalSec} сек`
}

export function formatFoodBuffDescription(foodId: string): string {
  const buff = FOOD_BUFF_MAP[foodId]
  if (!buff) return ''
  const pct = Math.round((buff.mult - 1) * 100)
  const duration = formatDurationRu(buff.durationMs)
  const target = buff.stat === 'all'
    ? 'ко всем характеристикам'
    : `к ${STAT_LABELS_RU[buff.stat]}`
  return `+${pct}% ${target} на ${duration}`
}

export function formatFoodCombatLog(foodId: string, hpGain = 0): string {
  const buff = FOOD_BUFF_MAP[foodId]
  if (!buff) return 'Бафф еды применён'
  const desc = formatFoodBuffDescription(foodId)
  if (hpGain > 0 && buff.stat === 'hp') {
    return `🍖 ${buff.label}: ${desc} · восстановлено ${hpGain} HP`
  }
  return `🍖 ${buff.label}: ${desc}`
}
