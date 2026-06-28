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
import { getScaledSkill } from '@/data/playerSkills'
import { useT } from '@/hooks/useT'
import type { SkillId, CombatLogEntry } from '@/types/game'
import { hapticImpact } from '@/lib/telegram'
import { groupConsumableStacks, isHpPotion, isEnergyDrink, CONSUMABLE_EFFECTS, type ConsumableId } from '@/lib/consumables'
import { FOOD_BUFF_MAP } from '@/data/kitchenRecipes'
import { formatFoodBuffDescription } from '@/lib/foodBuffs'
import { hasDeathDebuff } from '@/lib/playerStats'
import { CombatEffectsPanel } from '@/components/ui/CombatEffectsPanel'
import { getMaxMana, getPlayerCurrentMana, usesMana } from '@/lib/mana'

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
  const useConsumableInCombat = useCombatStore((s) => s.useConsumableInCombat)
  const eatFoodInCombat = useCombatStore((s) => s.eatFoodInCombat)
  const fleeCombat = useCombatStore((s) => s.fleeCombat)
  const clearCombat = useCombatStore((s) => s.clearCombat)
  const player = usePlayerStore((s) => s.player)
  const logRef = useRef<HTMLDivElement>(null)

  useTelegramBackButton(() => {
    if (!useCombatStore.getState().isActive && !showLootScreen) {
      clearCombat()
      navigate('/tower')
    }
  }, !useCombatStore.getState().isActive && !showLootScreen)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [combat?.combatLog.length])

  if (!combat) {
    navigate('/tower')
    return null
  }

  if (showLootScreen && result?.victory) return <LootScreen />

  const energyPct = player ? (player.energy / player.maxEnergy) * 100 : 0
  const manaMax = player && usesMana(player) ? getMaxMana(player) : 0
  const manaCurrent = player && usesMana(player) ? getPlayerCurrentMana(player) : 0
  const manaPct = manaMax > 0 ? (manaCurrent / manaMax) * 100 : 0
  const hpPct = (combat.playerHp / combat.playerMaxHp) * 100
  const enemyHpPct = (combat.enemyHp / combat.enemyMaxHp) * 100

  const skills = player?.skills ?? []
  const potionStacks = player ? groupConsumableStacks(player.inventory).filter((s) => isHpPotion(s.itemId)) : []
  const hpPotionOrder: ConsumableId[] = ['hp_potion_legendary', 'hp_potion_epic', 'hp_potion_rare', 'hp_potion']
  const sortedHpPotions = [...potionStacks].sort(
    (a, b) => hpPotionOrder.indexOf(a.itemId) - hpPotionOrder.indexOf(b.itemId),
  )
  const energyStacks = player
    ? groupConsumableStacks(player.inventory).filter((s) => isEnergyDrink(s.itemId))
    : []
  const foodStacks = player
    ? Object.entries(
        player.inventory
          .filter((i) => FOOD_BUFF_MAP[i.id])
          .reduce<Record<string, { name: string; icon: string; count: number }>>((acc, item) => {
            const cur = acc[item.id]
            if (cur) cur.count++
            else acc[item.id] = { name: item.name, icon: item.icon, count: 1 }
            return acc
          }, {}),
      )
    : []

  function handleFlee() {
    hapticImpact('light')
    fleeCombat()
  }

  function handleFledContinue() {
    clearCombat()
    navigate('/tower')
  }

  function handleDefeatContinue() {
    clearCombat()
    navigate('/tower')
  }

  return (
    <div className="h-full flex flex-col bg-aether-bg">
      {/* Header */}
      <div className="px-4 py-2 border-b border-aether-border bg-aether-surface/90 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-sm font-bold text-red-400">{combat.enemy.name}</h2>
            <p className="text-[10px] text-slate-500">
              {combat.isBoss ? `👑 ${t('combat.boss')}` : combat.isEpic ? '⚡ Эпический моб' : `Ход ${combat.turn}`}
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
          {manaMax > 0 && (
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-purple-400">Мана</span>
                <span>{manaCurrent}/{manaMax}</span>
              </div>
              <Progress value={manaPct} indicatorClassName="bg-gradient-to-r from-purple-700 to-purple-400" />
            </div>
          )}
        </div>
      </div>

      {player && <CombatEffectsPanel player={player} />}

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
          <div className="flex gap-2">
            <Button className="flex-1 h-12 text-base" onClick={() => { hapticImpact('light'); playerAttack() }}>
              ⚔️ Атаковать
            </Button>
            {!combat.isBoss && (
              <Button variant="outline" className="h-12 px-3" onClick={handleFlee}>
                🏃
              </Button>
            )}
          </div>
          {sortedHpPotions.length > 0 && sortedHpPotions.map((stack) => {
            const pct = Math.round((CONSUMABLE_EFFECTS[stack.itemId]?.healPercent ?? 0.5) * 100)
            return (
              <Button
                key={stack.itemId}
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={combat.playerHp >= combat.playerMaxHp}
                onClick={() => { hapticImpact('light'); useConsumableInCombat(stack.itemId) }}
              >
                {stack.icon} {stack.name} ×{stack.count} (+{pct}% HP)
              </Button>
            )
          })}
          {energyStacks.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {energyStacks.map((stack) => {
                const energy = CONSUMABLE_EFFECTS[stack.itemId]?.energy ?? 0
                const atMax = (player?.energy ?? 0) >= (player?.maxEnergy ?? 100)
                return (
                  <Button
                    key={stack.itemId}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    disabled={atMax}
                    onClick={() => { hapticImpact('light'); useConsumableInCombat(stack.itemId) }}
                  >
                    {stack.icon} ×{stack.count} (+{energy}⚡)
                  </Button>
                )
              })}
            </div>
          )}
          {foodStacks.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {foodStacks.map(([itemId, stack]) => (
                <Button
                  key={itemId}
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-0 py-2 px-1.5 whitespace-normal flex flex-col items-center justify-center gap-0.5"
                  onClick={() => { hapticImpact('light'); eatFoodInCombat(itemId) }}
                >
                  <span className="text-[11px] font-medium leading-tight text-center w-full truncate">
                    {stack.icon} {stack.name}
                    <span className="text-slate-400 font-normal"> ×{stack.count}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-normal leading-tight text-center w-full line-clamp-2">
                    {formatFoodBuffDescription(itemId)}
                  </span>
                </Button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {skills.map((sid) => {
              const skill = SKILLS[sid]
              const skillLevel = player?.skillLevels[sid] ?? 1
              const scaled = getScaledSkill(skill, skillLevel)
              const cd = combat.skillCooldowns[sid as SkillId] ?? 0
              const manaCost = scaled.energyCost
              const lacksResource = player?.classId === 'mage'
                ? manaCurrent < manaCost
                : (player?.energy ?? 0) < manaCost
              return (
                <Button
                  key={sid}
                  variant="secondary"
                  size="sm"
                  disabled={cd > 0 || lacksResource}
                  onClick={() => { hapticImpact('medium'); playerSkill(sid as SkillId) }}
                >
                  {skill.icon} {skill.nameRu}
                  {player?.classId === 'mage' ? ` (${manaCost}🔮)` : ''}
                  {cd > 0 ? ` (${cd})` : ''}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {result && !result.victory && result.fled && (
        <Dialog open onOpenChange={handleFledContinue}>
          <DialogContent className="text-center">
            <DialogHeader>
              <DialogTitle>Вы сбежали</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-400">Бой прерван. Награды не получены.</p>
            <Button onClick={handleFledContinue} className="w-full">{t('combat.continue')}</Button>
          </DialogContent>
        </Dialog>
      )}

      {result && !result.victory && !result.fled && (
        <Dialog open onOpenChange={handleDefeatContinue}>
          <DialogContent className="text-center">
            <DialogHeader>
              <div className="text-5xl mb-2">💀</div>
              <DialogTitle className="text-aether-danger">{t('combat.defeat')}</DialogTitle>
            </DialogHeader>
            {result.killedBy && (
              <p className="text-sm text-red-400 font-medium">Вас убил {result.killedBy}</p>
            )}
            <p className="text-sm text-slate-400">
              Вы воскресли с полным HP. Все характеристики снижены на 30% на 30 минут.
            </p>
            {player && hasDeathDebuff(player) && (
              <p className="text-xs text-amber-500">Дебафф смерти активен (−30% к статам)</p>
            )}
            <Button onClick={handleDefeatContinue} className="w-full">{t('combat.continue')}</Button>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
