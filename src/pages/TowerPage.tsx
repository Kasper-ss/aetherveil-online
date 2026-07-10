import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FloorEventModal, getEventExpAmount, getEventGoldAmount } from '@/components/FloorEventModal'
import { usePlayerStore, getMobsRequiredForFloor } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { getFloorData } from '@/data/gameData'
import { makeEpicEnemy, makeMiniBoss, MAX_MINI_BOSSES_PER_FLOOR, MINI_BOSS_SPAWN_CHANCE } from '@/data/floors'
import { pickFloorEvent, rollExploreType, type FloorEventChoice } from '@/data/floorEvents'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { getPlayerCurrentHp } from '@/lib/playerStats'
import { getActiveEffects, formatEffectRemaining } from '@/lib/activeEffects'
import { hapticImpact, hapticError, hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { randomInt } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import type { FloorEnemy } from '@/types/game'

export function TowerPage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const spendEnergy = usePlayerStore((s) => s.spendEnergy)
  const setFarmFloor = usePlayerStore((s) => s.setFarmFloor)
  const addGold = usePlayerStore((s) => s.addGold)
  const addExp = usePlayerStore((s) => s.addExp)
  const addResources = usePlayerStore((s) => s.addResources)
  const spendGold = usePlayerStore((s) => s.spendGold)
  const grantEffectPreset = usePlayerStore((s) => s.grantEffectPreset)
  const startCombat = useCombatStore((s) => s.startCombat)

  const [activeEvent, setActiveEvent] = useState<ReturnType<typeof pickFloorEvent>>(null)
  const [eventResult, setEventResult] = useState<string | null>(null)
  const [pendingCombat, setPendingCombat] = useState<{ enemy: FloorEnemy; floor: number } | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null
  if (!player.raceSelected || !player.classSelected) { navigate('/'); return null }

  const farmFloor = player.farmFloor
  const floor = getFloorData(farmFloor)
  const mobsRequired = getMobsRequiredForFloor(farmFloor)
  const mobsKilled = player.floorMobKills[farmFloor] ?? 0
  const mobPct = (mobsKilled / mobsRequired) * 100
  const miniBossKills = player.floorMiniBossKills?.[farmFloor] ?? 0
  const miniBossLeft = MAX_MINI_BOSSES_PER_FLOOR - miniBossKills
  const canBoss = mobsKilled >= mobsRequired
  const activeEffects = getActiveEffects(player)

  function beginCombat(enemy: FloorEnemy, floorNum: number, isBoss = false) {
    startCombat(enemy, floorNum, isBoss)
    navigate('/combat')
  }

  function startExplore() {
    if (getPlayerCurrentHp(player!) < 1) { hapticError(); return }
    if (!spendEnergy(5)) return
    hapticImpact('medium')
    playSfx('click')

    const baseEnemy = floor.enemies[randomInt(0, floor.enemies.length - 1)]
    const miniKills = player!.floorMiniBossKills?.[farmFloor] ?? 0
    if (miniKills < MAX_MINI_BOSSES_PER_FLOOR && Math.random() < MINI_BOSS_SPAWN_CHANCE) {
      beginCombat(makeMiniBoss(baseEnemy, farmFloor), farmFloor)
      return
    }

    const exploreType = rollExploreType()

    if (exploreType === 'event') {
      const ev = pickFloorEvent(farmFloor)
      if (ev) {
        setActiveEvent(ev)
        return
      }
    }

    const enemy = exploreType === 'epic' ? makeEpicEnemy(baseEnemy) : baseEnemy
    beginCombat(enemy, farmFloor)
  }

  function resolveEventChoice(choice: FloorEventChoice) {
    const outcome = choice.outcome
    setActiveEvent(null)
    hapticSuccess()

    switch (outcome.type) {
      case 'gold': {
        const amount = getEventGoldAmount(outcome, farmFloor)
        if (amount >= 0) addGold(amount)
        else spendGold(-amount)
        setEventResult(amount >= 0 ? `${outcome.message} (+${amount} 🪙)` : `${outcome.message} (${amount} 🪙)`)
        break
      }
      case 'exp': {
        const amount = getEventExpAmount(outcome, farmFloor)
        addExp(amount)
        setEventResult(`${outcome.message} (+${amount} EXP)`)
        break
      }
      case 'resources':
        addResources(outcome.resources)
        setEventResult(outcome.message)
        break
      case 'buff':
        grantEffectPreset(outcome.preset, outcome.durationMs)
        setEventResult(outcome.message)
        break
      case 'debuff':
        grantEffectPreset(outcome.preset, outcome.durationMs)
        setEventResult(outcome.message)
        break
      case 'combat': {
        const base = floor.enemies[randomInt(0, floor.enemies.length - 1)]
        const enemy = outcome.pattern
          ? { ...base, pattern: outcome.pattern }
          : base
        setPendingCombat({ enemy, floor: farmFloor })
        setEventResult(outcome.message)
        break
      }
      case 'nothing':
        setEventResult(outcome.message)
        break
    }
  }

  function startBoss() {
    if (!canBoss) return
    if (getPlayerCurrentHp(player!) < 1) { hapticError(); return }
    if (!spendEnergy(25)) return
    hapticImpact('heavy')
    playSfx('skill')
    beginCombat(floor.boss, farmFloor, true)
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Этаж {floor.floor}</h1>
          <p className="text-xs text-slate-400">{floor.name}</p>
        </div>
      </div>

      {activeEffects.length > 0 && (
        <div className="mx-4 mt-3 p-2 rounded-lg bg-aether-purple/10 border border-aether-purple/30">
          <p className="text-[10px] text-aether-purple font-medium mb-1">Активные эффекты:</p>
          {activeEffects.map((e) => (
            <p key={e.id} className="text-[10px] text-slate-400">
              {e.type === 'buff' ? '↑' : '↓'} {e.label} · {formatEffectRemaining(e.until)}
            </p>
          ))}
        </div>
      )}

      {player.highestFloor > 1 && (
        <div className="px-4 pt-3">
          <p className="text-xs text-slate-400 mb-2">Выбор этажа для фарма:</p>
          <select
            className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-white"
            value={farmFloor}
            onChange={(e) => setFarmFloor(Number(e.target.value))}
          >
            {Array.from({ length: player.highestFloor }, (_, i) => i + 1).map((f) => (
              <option key={f} value={f}>Этаж {f} — {getFloorData(f).name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="relative mx-4 mt-4 h-40 rounded-xl overflow-hidden border border-aether-border"
        style={{ background: `linear-gradient(180deg, ${floor.theme} 0%, #0a0a1a 100%)` }}
      >
        <Badge className="absolute top-3 left-3" variant="rare">Этаж {floor.floor}</Badge>
        <p className="absolute bottom-2 left-3 right-3 text-[10px] text-slate-400 text-center">{floor.description}</p>
      </div>

      <Card className="mx-4 mt-3">
        <CardContent className="p-4 pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">Убито мобов</span>
            <span className="text-aether-cyan font-mono">{mobsKilled}/{mobsRequired}</span>
          </div>
          <Progress value={mobPct} />
          {canBoss ? (
            <p className="text-xs text-aether-gold mt-2 text-center animate-pulse-glow">⚡ {t('tower.bossReady')}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Осталось: {mobsRequired - mobsKilled} мобов до босса
            </p>
          )}
          {miniBossLeft > 0 ? (
            <p className="text-xs text-purple-300 mt-2 text-center">
              👹 Мини-боссов осталось: {miniBossLeft}/{MAX_MINI_BOSSES_PER_FLOOR} · шанс ~{Math.round(MINI_BOSS_SPAWN_CHANCE * 100)}%
            </p>
          ) : (
            <p className="text-xs text-slate-600 mt-2 text-center">👹 Все мини-боссы этажа побеждены</p>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 mt-3">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Монстры этажа</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex gap-2 flex-wrap">
            {floor.enemies.map((e) => (
              <div key={e.id} className="flex items-center gap-2 bg-aether-bg rounded-lg px-3 py-2 text-xs">
                <span className="text-lg">👾</span>
                <div>
                  <div className="text-white font-medium">{e.name}</div>
                  <div className="text-slate-500">АТК {e.stats.atk} · HP {e.stats.hp}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            Шанс события ~22% · эпического моба ~12%
          </p>
        </CardContent>
      </Card>

      <div className="p-4 space-y-3">
        <Button className="w-full h-14" onClick={startExplore}>
          <Search className="h-5 w-5" />
          {t('tower.explore')} (−5 энергии)
        </Button>

        <Button variant={canBoss ? 'gold' : 'secondary'} className="w-full h-14" onClick={startBoss} disabled={!canBoss}>
          <Crown className="h-5 w-5" />
          {t('tower.boss')}: {floor.boss.name} (−25 энергии)
        </Button>

        <p className="text-[10px] text-slate-600 text-center">
          Этаж {farmFloor}: нужно {mobsRequired} убийств. HP сохраняется между боями и восстанавливается со временем.
        </p>
      </div>

      {activeEvent && (
        <FloorEventModal
          event={activeEvent}
          floor={farmFloor}
          onChoice={resolveEventChoice}
          onClose={() => setActiveEvent(null)}
        />
      )}

      <Dialog open={!!eventResult} onOpenChange={() => { setEventResult(null); setPendingCombat(null) }}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>Событие этажа</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">{eventResult}</p>
          {pendingCombat ? (
            <Button
              className="w-full mt-2"
              onClick={() => {
                beginCombat(pendingCombat.enemy, pendingCombat.floor)
                setEventResult(null)
                setPendingCombat(null)
              }}
            >
              В бой!
            </Button>
          ) : (
            <Button className="w-full mt-2" onClick={() => setEventResult(null)}>Понятно</Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
