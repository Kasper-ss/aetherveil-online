import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { MissingCost } from '@/lib/craftCosts'

interface MissingResourcesModalProps {
  open: boolean
  onClose: () => void
  title: string
  missing: MissingCost[]
}

export function MissingResourcesModal({ open, onClose, title, missing }: MissingResourcesModalProps) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400">Не хватает ресурсов:</p>
        <ul className="space-y-2 my-3">
          {missing.map((m) => (
            <li key={m.key} className="flex items-center justify-between text-sm bg-aether-bg rounded-lg px-3 py-2">
              <span className="text-slate-300">{m.icon} {m.label}</span>
              <span className="text-red-400 font-mono">
                {m.have} / {m.need}
              </span>
            </li>
          ))}
        </ul>
        <Button className="w-full" variant="secondary" onClick={onClose}>Понятно</Button>
      </DialogContent>
    </Dialog>
  )
}
