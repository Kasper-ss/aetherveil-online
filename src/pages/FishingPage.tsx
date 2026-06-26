import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { hapticSuccess, hapticError } from '@/lib/telegram'
import { FISH_TABLE, FISHING_ENERGY_COST, RARITY_FISH_COLORS } from '@/data/fishing'
import { playerHasTool } from '@/data/tools'
import { RARITY_LABELS_RU } from '@/data/items'

export function FishingPage() {
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.player)
  const performFishing = usePlayerStore((s) => s.performFishing)
  const [lastCatch, setLastCatch] = useState<string | null>(null)

  useTelegramBackButton(() => navigate('/'), true)

  if (!player) return null

  const hasRod = playerHasTool(player, 'fishing_rod')
  const baitCount = player.inventory.filter((i) => i.id === 'fishing_bait').length

  function handleFish() {
    const result = performFishing()
    if (result.ok) {
      hapticSuccess()
      if (result.junk) setLastCatch('Пойман мусор...')
      else setLastCatch(`Поймана: ${result.fishName}!`)
    } else {
      hapticError()
      setLastCatch('Нужны удочка, наживка и энергия.')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter">
      <div className="flex items-center gap-3 p-4 border-b border-aether-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Рыбалка</h1>
      </div>

      <div className="p-4 space-y-3">
        <Card>
          <CardContent className="p-3 text-xs space-y-1">
            <div className="text-slate-400">Поймано рыбы: <span className="text-white">{player.fishCaughtTotal ?? 0}</span></div>
            <div className="text-slate-400">Наживка: <span className="text-white">×{baitCount}</span></div>
            <div className="text-slate-400">Стоимость заброса: ⚡{FISHING_ENERGY_COST} + 1 наживка</div>
            {!hasRod && <div className="text-red-400">Купите удочку в магазине</div>}
          </CardContent>
        </Card>

        {lastCatch && <p className="text-sm text-center text-aether-cyan">{lastCatch}</p>}

        <Button className="w-full" size="lg" onClick={handleFish} disabled={!hasRod || baitCount < 1}>
          Забросить удочку
        </Button>

        <h2 className="text-sm font-semibold text-white pt-2">Справочник рыбы (15 видов)</h2>
        <div className="space-y-1.5 max-h-[45vh] overflow-y-auto">
          {FISH_TABLE.map((fish) => (
            <Card key={fish.id}>
              <CardContent className="p-2 flex items-center justify-between">
                <span className={`text-xs ${RARITY_FISH_COLORS[fish.rarity]}`}>{fish.nameRu}</span>
                <Badge variant={fish.rarity} className="text-[8px]">{RARITY_LABELS_RU[fish.rarity]}</Badge>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="p-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">Мусор</span>
              <Badge className="text-[8px]">common</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
