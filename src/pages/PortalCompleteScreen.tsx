import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCombatStore } from '@/store/combatStore'
import { usePlayerStore } from '@/store/playerStore'
import { PORTAL_INFO } from '@/data/portals'
import { RESOURCES } from '@/data/classes'
import { formatNumber } from '@/lib/utils'
import { getBoostedExp, getBoostedGold, hasRewardBoost } from '@/lib/playerBuffs'
import { formatItemStats } from '@/data/items'
import { formatItemClassRestriction } from '@/lib/classGear'
import { hapticSuccess } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import type { EquipSlot, ResourceId } from '@/types/game'

export function PortalCompleteScreen() {
  const navigate = useNavigate()
  const result = useCombatStore((s) => s.result)
  const claimPortalComplete = useCombatStore((s) => s.claimPortalComplete)
  const clearCombat = useCombatStore((s) => s.clearCombat)
  const player = usePlayerStore((s) => s.player)

  if (!result?.victory || !result.portalComplete || !player?.portalRun) return null

  const run = player.portalRun
  const info = PORTAL_INFO[run.type]
  const equipSlots: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet']
  const equipment = run.accumulatedLoot.filter((i) => equipSlots.includes(i.slot as EquipSlot))

  const displayExp = getBoostedExp(run.accumulatedExp, player)
  const displayGold = getBoostedGold(run.accumulatedGold, player)
  const showBoostNote = hasRewardBoost(player) && (displayExp > run.accumulatedExp || displayGold > run.accumulatedGold)

  function handleClaim() {
    claimPortalComplete()
    hapticSuccess()
    playSfx('loot')
    clearCombat()
    navigate('/tower')
  }

  return (
    <div className="h-full overflow-y-auto page-enter bg-gradient-to-b from-indigo-900/30 to-aether-bg">
      <div className="text-center pt-8 pb-4 px-4">
        <img src={info.image} alt="" className="w-32 h-32 object-cover rounded-xl mx-auto mb-3 border border-aether-border" />
        <h1 className="text-2xl font-bold text-aether-gold text-glow">
          {run.type === 'blue' ? 'Синий портал зачищен!' : 'Красный портал зачищен!'}
        </h1>
        <p className="text-sm text-aether-cyan mt-2">Этаж {run.floor}</p>
        <p className="text-xs text-slate-400 mt-1">
          Все награды с {run.mobsRequired} мобов и босса
        </p>
      </div>

      <div className="flex justify-center gap-8 px-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-aether-cyan">+{displayExp}</div>
          <div className="text-xs text-slate-400">EXP</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-aether-gold">+{formatNumber(displayGold)}</div>
          <div className="text-xs text-slate-400">Золото</div>
        </div>
      </div>
      {showBoostNote && (
        <p className="text-[10px] text-aether-cyan text-center px-4 mb-2">
          С учётом активных бонусов
        </p>
      )}

      {equipment.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-white mb-2">⚔️ Снаряжение</h2>
          <div className="space-y-2">
            {equipment.map((item) => (
              <Card key={item.instanceId}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{item.name}</div>
                    {formatItemClassRestriction(item) && (
                      <div className="text-[10px] text-amber-400/90">{formatItemClassRestriction(item)}</div>
                    )}
                    <div className="text-[10px] text-aether-cyan">{formatItemStats(item)}</div>
                  </div>
                  <Badge>{item.rarity}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {Object.keys(run.accumulatedResources).length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-white mb-2">📦 Ресурсы</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(run.accumulatedResources) as [ResourceId, number][]).map(([id, amt]) => (
              <span key={id} className="bg-aether-card px-2 py-1 rounded text-xs">
                {RESOURCES[id]?.icon}{amt}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-8">
        <Button className="w-full" size="lg" variant="gold" onClick={handleClaim}>
          Забрать награды портала
        </Button>
      </div>
    </div>
  )
}
