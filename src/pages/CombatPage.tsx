import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LootScreen } from '@/pages/LootScreen'
import { useCombatStore } from '@/store/combatStore'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SKILLS } from '@/data/gameData'
import { useT } from '@/hooks/useT'
import type { SkillId, CombatLogEntry } from '@/types/game'
import { hapticImpact } from '@/lib/telegram'

const LOG_COLORS: Record<CombatLogEntry['type'], string> = {
  player: 'text-aether-cyan',
  enemy: 'text-red-400',
  crit: 'text-aether-gold font-bold',
  skill: 'text-aether-purple',
  heal: 'text-green-400',
  system: 'text-slate-400',
}

export function CombatPage() {
  const navigate = useNavigate()
  const t = useT()
  const combat = useCombatStore((s) => s.combat)
  const result = useCombatStore((s) => s.result)
  const showLootScreen = useCombatStore((s) => s.showLootScreen)
  const playerAttack = useCombatStore((s) => s.playerAttack)
  const playerSkill = useCombatStore((s) => s.playerSkill)
  const clearCombat = useCombatStore((s) => s.clearCombat)
  const player = usePlayerStore((s) => s.player)
  const logRef = useRef<HTMLDivElement>(null)

  useTelegramBackButton(() => {
    if (!useCombatStore.getState().isActive && !showLootScreen) {
      const isPvp = useCombatStore.getState().combat?.isPvp
      clearCombat()
      navigate(isPvp ? '/arena' : '/tower')
    }
  }, !useCombatStore.getState().isActive && !showLootScreen)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [combat?.combatLog.length])

  if (!combat) {
    navigate('/tower')
    return null
  }

  if (showLootScreen && result?.victory && !combat.isPvp) return <LootScreen />

  const energyPct = player ? (player.energy / player.maxEnergy) * 100 : 0
  const hpPct = (combat.playerHp / combat.playerMaxHp) * 100
  const enemyHpPct = (combat.enemyHp / combat.enemyMaxHp) * 100

  const skills = player?.skills ?? []

  function handleDefeatContinue() {
    const isPvp = combat?.isPvp
    clearCombat()
    navigate(isPvp ? '/arena' : '/tower')
  }

  function handlePvpVictoryContinue() {
    clearCombat()
    navigate('/arena')
  }

  return (
    <div className="h-full flex flex-col bg-aether-bg">
      {/* Header */}
      <div className="px-4 py-2 border-b border-aether-border bg-aether-surface/90 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-sm font-bold text-red-400">{combat.enemy.name}</h2>
            <p className="text-[10px] text-slate-500">
              {combat.isBoss ? `👑 ${t('combat.boss')}` : `Ход ${combat.turn}`}
              {combat.combo > 1 && <span className="text-aether-gold ml-2">{combat.combo}x комбо</span>}
            </p>
          </div>
        </div>

        {/* HP bars */}
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-aether-cyan">Ваше HP</span>
              <span>{combat.playerHp}/{combat.playerMaxHp}</span>
            </div>
            <Progress value={hpPct} indicatorClassName="bg-gradient-to-r from-red-600 to-red-400" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-red-400">HP врага</span>
              <span>{combat.enemyHp}/{combat.enemyMaxHp}</span>
            </div>
            <Progress value={enemyHpPct} indicatorClassName="bg-gradient-to-r from-purple-700 to-red-500" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-yellow-400">Энергия</span>
              <span>{player?.energy ?? 0}/{player?.maxEnergy ?? 100}</span>
            </div>
            <Progress value={energyPct} indicatorClassName="bg-gradient-to-r from-yellow-600 to-yellow-400" />
          </div>
        </div>
      </div>

      {/* Combat log */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
        {combat.combatLog.map((entry, i) => (
          <p key={i} className={`text-xs leading-relaxed ${LOG_COLORS[entry.type]}`}>
            {entry.text}
          </p>
        ))}
      </div>

      {/* Actions */}
      {useCombatStore.getState().isActive && (
        <div className="p-3 border-t border-aether-border space-y-2 shrink-0 bg-aether-surface/90">
          <Button className="w-full h-12 text-base" onClick={() => { hapticImpact('light'); playerAttack() }}>
            ⚔️ Атаковать
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {skills.map((sid) => {
              const skill = SKILLS[sid]
              const cd = combat.skillCooldowns[sid as SkillId] ?? 0
              return (
                <Button
                  key={sid}
                  variant="secondary"
                  size="sm"
                  disabled={cd > 0 || (player?.energy ?? 0) < skill.energyCost}
                  onClick={() => { hapticImpact('medium'); playerSkill(sid as SkillId) }}
                >
                  {skill.icon} {skill.nameRu}
                  {cd > 0 ? ` (${cd})` : ''}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {result && !result.victory && (
        <Dialog open onOpenChange={handleDefeatContinue}>
          <DialogContent className="text-center">
            <DialogHeader>
              <div className="text-5xl mb-2">💀</div>
              <DialogTitle className="text-aether-danger">{t('combat.defeat')}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-400">
              {combat?.isPvp ? 'Соперник оказался сильнее. Попробуйте снова!' : 'Вы потеряли часть золота. Тренируйтесь и попробуйте снова!'}
            </p>
            <Button onClick={handleDefeatContinue} className="w-full">{t('combat.continue')}</Button>
          </DialogContent>
        </Dialog>
      )}

      {result?.victory && combat?.isPvp && !showLootScreen && (
        <Dialog open onOpenChange={handlePvpVictoryContinue}>
          <DialogContent className="text-center">
            <DialogHeader>
              <div className="text-5xl mb-2">🏆</div>
              <DialogTitle className="text-aether-success">Победа в PvP!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-400">
              +{result.exp} опыта · +{result.gold} золота
            </p>
            <Button onClick={handlePvpVictoryContinue} className="w-full">{t('combat.continue')}</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
