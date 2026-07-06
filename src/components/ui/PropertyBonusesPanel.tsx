import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getActivePropertyInfo } from '@/lib/propertyBonuses'
import type { Player } from '@/types/game'

interface PropertyBonusesPanelProps {
  player: Player
  onOpenRealEstate?: () => void
  compact?: boolean
}

export function PropertyBonusesPanel({ player, onOpenRealEstate, compact }: PropertyBonusesPanelProps) {
  const info = getActivePropertyInfo(player)

  if (!info) {
    return (
      <Card className={compact ? '' : 'mx-4 mt-3'}>
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-sm text-slate-400">Нет активного дома</p>
          <p className="text-[10px] text-slate-500">Купите недвижимость — бонусы действуют постоянно, пока дом в собственности.</p>
          {onOpenRealEstate && (
            <Button size="sm" variant="outline" onClick={onOpenRealEstate}>
              Открыть недвижимость
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-aether-gold/30 bg-aether-gold/5 ${compact ? '' : 'mx-4 mt-3'}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{info.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{info.nameRu}</p>
            <p className="text-xs text-aether-cyan mt-0.5">{info.bonusLabelRu}</p>
          </div>
        </div>
        <div className="space-y-1 pt-1 border-t border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Активные бонусы</p>
          {info.detailLines.map((line) => (
            <p key={line} className="text-[11px] text-slate-300">↑ {line}</p>
          ))}
        </div>
        {onOpenRealEstate && (
          <Button size="sm" variant="outline" className="w-full mt-1" onClick={onOpenRealEstate}>
            Управление недвижимостью
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
