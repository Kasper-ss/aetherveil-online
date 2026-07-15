import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePlayerStore } from '@/store/playerStore'
import { useCombatStore } from '@/store/combatStore'
import { PORTAL_INFO } from '@/data/portals'
import { hapticImpact, hapticSuccess } from '@/lib/telegram'
import type { PendingPortalState } from '@/types/game'

interface PortalModalProps {
  portal: PendingPortalState
  onClose: () => void
}

export function PortalModal({ portal, onClose }: PortalModalProps) {
  const navigate = useNavigate()
  const enterPortal = usePlayerStore((s) => s.enterPortal)
  const declinePortal = usePlayerStore((s) => s.declinePortal)
  const startPortalCombat = useCombatStore((s) => s.startPortalCombat)

  const info = PORTAL_INFO[portal.type]

  function handleEnter() {
    hapticImpact('medium')
    if (!enterPortal()) return
    if (!startPortalCombat()) {
      declinePortal()
      return
    }
    hapticSuccess()
    onClose()
    navigate('/combat')
  }

  function handleDecline() {
    declinePortal()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && handleDecline()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={portal.type === 'blue' ? 'text-blue-400' : 'text-red-400'}>
            {info.title}
          </DialogTitle>
          {info.subtitle && (
            <p className="text-sm text-amber-400 font-medium">{info.subtitle}</p>
          )}
        </DialogHeader>

        <div className="rounded-lg overflow-hidden border border-aether-border">
          <img
            src={info.image}
            alt={info.title}
            className="w-full h-40 object-cover"
          />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{info.description}</p>

        <div className="text-[10px] text-slate-500 text-center">
          Этаж {portal.floor} · {info.mobsRequired} мобов + босс · {portal.type === 'blue' ? 'средняя' : 'высокая'} сложность
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleDecline}>Пропустить</Button>
          <Button
            variant={portal.type === 'red' ? 'destructive' : 'default'}
            className={portal.type === 'blue' ? 'glow-cyan' : ''}
            onClick={handleEnter}
          >
            Войти
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
