import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePlayerStore } from '@/store/playerStore'
import { useTelegramBackButton } from '@/hooks/useTelegram'
import { useT } from '@/hooks/useT'
import { formatNumber } from '@/lib/utils'
import { hapticError, hapticSuccess } from '@/lib/telegram'
import {
  REAL_ESTATE_PROPERTIES,
  getPropertyById,
  getPropertySellPrice,
  isPropertyUnlockedForPlayer,
  isRealEstateUnlocked,
  PROPERTY_SELL_REFUND_RATE,
} from '@/data/realEstate'

export function RealEstatePage() {
  const navigate = useNavigate()
  const t = useT()
  const player = usePlayerStore((s) => s.player)
  const fetchPropertyStatus = usePlayerStore((s) => s.fetchPropertyStatus)
  const buyProperty = usePlayerStore((s) => s.buyProperty)
  const sellProperty = usePlayerStore((s) => s.sellProperty)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [slotCounts, setSlotCounts] = useState<Record<string, { owned: number; limit: number }>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useTelegramBackButton(() => navigate('/'), true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await fetchPropertyStatus()
    if (result) {
      setTotalPlayers(result.totalPlayers)
      const map: Record<string, { owned: number; limit: number }> = {}
      for (const slot of result.availability) {
        map[slot.propertyId] = { owned: slot.owned, limit: slot.limit }
      }
      setSlotCounts(map)
    }
    setLoading(false)
  }, [fetchPropertyStatus])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!player) return null

  if (!isRealEstateUnlocked(player)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-3">
        <Home className="h-10 w-10 text-slate-500" />
        <p className="text-sm text-slate-400">Недвижимость открывается с 5 этажа Башни.</p>
        <Button variant="outline" onClick={() => navigate('/')}>На главную</Button>
      </div>
    )
  }

  const ownedId = player.ownedPropertyId
  const owned = ownedId ? getPropertyById(ownedId) : undefined
  const sellRefund = owned
    ? getPropertySellPrice(player.propertyPurchasePrice ?? owned.goldCost)
    : 0

  async function handleBuy(propertyId: string) {
    setBusyId(propertyId)
    setMessage('')
    const result = await buyProperty(propertyId)
    setBusyId(null)
    if (result.ok) {
      hapticSuccess()
      setMessage('Дом успешно куплен!')
      await refresh()
    } else {
      hapticError()
      setMessage(result.error ?? 'Не удалось купить')
    }
  }

  async function handleSell() {
    setBusyId('sell')
    setMessage('')
    const result = await sellProperty()
    setBusyId(null)
    if (result.ok) {
      hapticSuccess()
      setMessage(`Дом продан. Возврат: ${formatNumber(result.refund ?? 0)} 🪙`)
      await refresh()
    } else {
      hapticError()
      setMessage(result.error ?? 'Не удалось продать')
    }
  }

  return (
    <div className="h-full overflow-y-auto page-enter pb-6">
      <div className="sticky top-0 z-10 bg-aether-dark/95 backdrop-blur border-b border-white/5 p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Home className="h-5 w-5 text-aether-gold" />
        <h1 className="text-lg font-bold text-white">{t('hub.realEstate')}</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card className="border-aether-gold/30 bg-aether-gold/5">
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="text-slate-300">
              Владейте одним домом — каждый даёт уникальный бонус. Новый тип открывается каждые 5 уровней.
            </p>
            <p className="text-xs text-slate-400">
              Слотов на дом: растут с числом игроков ({formatNumber(totalPlayers)} в игре).
              Продажа — {Math.round(PROPERTY_SELL_REFUND_RATE * 100)}% от цены покупки.
            </p>
            {message && (
              <p className="text-xs text-aether-cyan pt-1">{message}</p>
            )}
          </CardContent>
        </Card>

        {owned && (
          <Card className="border-aether-cyan/40">
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-3xl">{owned.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{owned.nameRu}</div>
                <div className="text-xs text-aether-cyan mt-0.5">{owned.bonusLabelRu}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={busyId === 'sell'}
                  onClick={() => void handleSell()}
                >
                  Продать дом ({formatNumber(sellRefund)} 🪙)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <p className="text-center text-sm text-slate-400 py-4">Загрузка слотов...</p>
        )}

        {REAL_ESTATE_PROPERTIES.map((property) => {
          const unlocked = isPropertyUnlockedForPlayer(player, property)
          const isOwned = ownedId === property.id
          const slot = slotCounts[property.id]
          const full = slot ? slot.owned >= slot.limit : false
          const canBuy = unlocked && !ownedId && !isOwned && !full && player.gold >= property.goldCost

          return (
            <Card
              key={property.id}
              className={isOwned ? 'border-aether-cyan/50' : unlocked ? '' : 'opacity-60'}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{property.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{property.nameRu}</span>
                      {!unlocked && (
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          Ур. {property.unlockLevel}
                        </span>
                      )}
                      {isOwned && (
                        <span className="text-[10px] bg-aether-cyan/20 text-aether-cyan px-2 py-0.5 rounded-full">
                          Ваш дом
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{property.descriptionRu}</p>
                    <p className="text-xs text-aether-gold mt-1">{property.bonusLabelRu}</p>
                    <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                      <span className="text-sm text-aether-gold">🪙 {formatNumber(property.goldCost)}</span>
                      {slot && (
                        <span className={`text-[10px] ${full ? 'text-red-400' : 'text-slate-400'}`}>
                          Слоты: {slot.owned}/{slot.limit}
                        </span>
                      )}
                    </div>
                    {!isOwned && unlocked && !ownedId && (
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        variant={canBuy ? 'default' : 'secondary'}
                        disabled={!canBuy || busyId === property.id}
                        onClick={() => void handleBuy(property.id)}
                      >
                        {full ? 'Все слоты заняты' : player.gold < property.goldCost ? 'Мало золота' : 'Купить'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
