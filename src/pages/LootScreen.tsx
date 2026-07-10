import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCombatStore } from '@/store/combatStore'
import { usePlayerStore } from '@/store/playerStore'
import { SecretCaveModal } from '@/components/SecretCaveModal'
import { getCannibalizeHeal } from '@/lib/racialAbilities'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/localeStore'
import { RESOURCES } from '@/data/classes'
import { formatNumber } from '@/lib/utils'
import { hapticSuccess, hapticImpact } from '@/lib/telegram'
import { playSfx } from '@/lib/audio'
import { getBoostedExp, getBoostedGold, hasRewardBoost } from '@/lib/playerBuffs'
import { formatItemStats } from '@/data/items'
import type { EquipSlot, ResourceId } from '@/types/game'

export function LootScreen() {
  const navigate = useNavigate()
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const result = useCombatStore((s) => s.result)
  const claimLoot = useCombatStore((s) => s.claimLoot)
  const clearCombat = useCombatStore((s) => s.clearCombat)
  const player = usePlayerStore((s) => s.player)
  const resolveCannibalize = usePlayerStore((s) => s.resolveCannibalize)
  const clearSecretCave = usePlayerStore((s) => s.clearSecretCave)
  const [caveDismissed, setCaveDismissed] = useState(false)

  const showCave = player?.pendingSecretCave && !caveDismissed

  if (!result?.victory) return null

  const displayExp = player ? getBoostedExp(result.exp, player) : result.exp
  const displayGold = player ? getBoostedGold(result.gold, player) : result.gold
  const showBoostNote = player && hasRewardBoost(player) && (displayExp > result.exp || displayGold > result.gold)

  const equipSlots: EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet']
  const equipment = result.loot.filter((i) => equipSlots.includes(i.slot as EquipSlot))
  const consumables = result.loot.filter((i) => i.slot === 'consumable')

  function handleClaim() {
    claimLoot()
    hapticSuccess()
    playSfx('loot')
    clearCombat()
    navigate('/tower')
  }

  return (
    <div className="h-full overflow-y-auto page-enter bg-gradient-to-b from-aether-purple/20 to-aether-bg">
      <div className="text-center pt-8 pb-4">
        <div className="text-6xl mb-3 animate-pulse-glow">🏆</div>
        <h1 className="text-2xl font-bold text-aether-gold text-glow">{t('loot.title')}</h1>
        <p className="text-sm text-aether-cyan mt-1">{t('combat.victory')}</p>
      </div>

      {/* EXP & Gold */}
      <div className="flex justify-center gap-8 px-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-aether-cyan">+{displayExp}</div>
          <div className="text-xs text-slate-400">{t('loot.exp')}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-aether-gold">+{formatNumber(displayGold)}</div>
          <div className="text-xs text-slate-400">{t('loot.gold')}</div>
        </div>
        {result.comboMax > 1 && (
          <div className="text-center">
            <div className="text-3xl font-bold text-aether-purple">{result.comboMax}x</div>
            <div className="text-xs text-slate-400">Combo</div>
          </div>
        )}
      </div>
      {showBoostNote && (
        <p className="text-[10px] text-aether-cyan text-center px-4 mb-2">
          С учётом активных бонусов (карты судьбы и др.)
        </p>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            ⚔️ {t('loot.equipment')}
          </h2>
          <div className="space-y-2">
            {equipment.map((item, i) => (
              <Card key={`eq_${i}`} className="glow-cyan">
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.description}</div>
                    <div className="text-[10px] text-aether-cyan mt-1">{formatItemStats(item)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Consumables from loot */}
      {consumables.length > 0 && (
        <div className="px-4 mb-4">
          <div className="space-y-2">
            {consumables.map((item, i) => (
              <Card key={`con_${i}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm text-white">{item.name}</span>
                  <Badge variant={item.rarity}>{item.rarity}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      {result.resources && Object.keys(result.resources).length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            📦 {t('loot.resources')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(result.resources) as [ResourceId, number][]).map(([id, amount]) => {
              if (!amount) return null
              const res = RESOURCES[id]
              return (
                <Card key={id}>
                  <CardContent className="p-2 text-center">
                    <div className="text-2xl">{res.icon}</div>
                    <div className="text-xs text-white mt-1">
                      {locale === 'ru' ? res.nameRu : res.name}
                    </div>
                    <div className="text-sm font-bold text-aether-gold">+{amount}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {player?.pendingCannibalize && (
        <Card className="mx-4 mb-4 border-purple-500/40">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-white">💀 Каннибализм — съесть труп?</p>
            <p className="text-[10px] text-slate-400">Восстановит ~{getCannibalizeHeal(player)} HP</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="default" onClick={() => resolveCannibalize(true)}>Съесть</Button>
              <Button variant="outline" onClick={() => resolveCannibalize(false)}>Отказаться</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 pb-8">
        <Button
          className="w-full h-14 text-base glow-cyan"
          onClick={() => { hapticImpact('medium'); handleClaim() }}
        >
          {t('loot.claim')}
        </Button>
      </div>

      {showCave && player.pendingSecretCave && (
        <SecretCaveModal
          cave={player.pendingSecretCave}
          onClose={() => {
            setCaveDismissed(true)
            clearSecretCave()
          }}
        />
      )}
    </div>
  )
}
