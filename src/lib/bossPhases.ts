import type { CombatState } from '@/types/game'
import { createEnemyCombatState } from '@/lib/enemyCombat'

export const BOSS_PHASE2_MIN_FLOOR = 5

export function shouldUseBossPhases(combat: CombatState): boolean {
  if (!combat.isBoss) return false
  if (combat.isWorldBoss) return true
  return combat.floor >= BOSS_PHASE2_MIN_FLOOR
}

export function tryBeginBossPhase2(combat: CombatState): CombatState | null {
  if (!shouldUseBossPhases(combat) || combat.bossPhase === 2) return null

  const phase2MaxHp = Math.floor(combat.enemyMaxHp * (combat.isWorldBoss ? 0.65 : 0.55))
  const mult = combat.isWorldBoss ? 1.45 : 1.35

  const buffedEnemy = {
    ...combat.enemy,
    stats: {
      ...combat.enemy.stats,
      atk: Math.floor(combat.enemy.stats.atk * mult),
      def: Math.floor(combat.enemy.stats.def * (mult - 0.1)),
      crit: Math.min(40, combat.enemy.stats.crit + 6),
      speed: Math.min(30, combat.enemy.stats.speed + 4),
    },
  }

  const logs = [
    ...combat.combatLog,
    {
      text: combat.isWorldBoss
        ? '🌌 Архонт пробуждает бездну — вторая фаза!'
        : `👑 ${combat.enemy.name} переходит во 2-ю фазу!`,
      type: 'system' as const,
    },
    {
      text: '⚠️ Усиленные способности: дебаффы на вас, баффы на боссе!',
      type: 'system' as const,
    },
  ]

  return {
    ...combat,
    bossPhase: 2,
    enemy: buffedEnemy,
    enemyHp: phase2MaxHp,
    enemyMaxHp: phase2MaxHp,
    enemyCombat: {
      ...createEnemyCombatState(),
      enraged: true,
      shieldRemaining: Math.floor(phase2MaxHp * (combat.isWorldBoss ? 0.2 : 0.12)),
    },
    combatLog: logs.slice(-30),
  }
}

export function handleBossDefeated(
  get: () => { combat: CombatState | null; endCombat: (v: boolean) => void },
  set: (partial: { combat: CombatState }) => void,
  combat: CombatState,
  logs: import('@/types/game').CombatLogEntry[],
  patch: Partial<CombatState>,
): boolean {
  const merged = { ...combat, ...patch, combatLog: logs }
  const phase2 = tryBeginBossPhase2(merged)
  if (phase2) {
    set({ combat: phase2 })
    return true
  }
  logs.push({ text: `✅ ${combat.enemy.name} повержен!`, type: 'system' })
  set({ combat: { ...merged, enemyHp: 0, combatLog: logs } })
  get().endCombat(true)
  return true
}
