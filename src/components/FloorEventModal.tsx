import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { FloorEvent, FloorEventChoice, FloorEventOutcome } from '@/data/floorEvents'
import { randomInt } from '@/lib/utils'

interface FloorEventModalProps {
  event: FloorEvent
  floor: number
  onChoice: (choice: FloorEventChoice) => void
  onClose: () => void
}

export function FloorEventModal({ event, onChoice, onClose }: FloorEventModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-aether-cyan">{event.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-300 leading-relaxed">{event.story}</p>
        <div className="space-y-2 mt-3">
          {event.choices.map((choice) => (
            <Button
              key={choice.label}
              variant="secondary"
              className="w-full h-auto py-3 text-left whitespace-normal"
              onClick={() => onChoice(choice)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function formatEventOutcomeMessage(outcome: FloorEventOutcome, floor: number): string {
  if (outcome.type === 'gold') {
    const amount = randomInt(outcome.min, outcome.max)
    return amount >= 0
      ? `${outcome.message} (+${amount} золота)`
      : `${outcome.message} (${amount} золота)`
  }
  if (outcome.type === 'exp') {
    const amount = randomInt(outcome.min, Math.max(outcome.min, outcome.max + floor * 2))
    return `${outcome.message} (+${amount} опыта)`
  }
  return outcome.message
}

export function getEventGoldAmount(outcome: Extract<FloorEventOutcome, { type: 'gold' }>, floor: number): number {
  const max = outcome.max < 0 ? outcome.max : outcome.max + floor * 2
  const min = outcome.min < 0 ? outcome.min : outcome.min + floor
  return randomInt(min, max)
}

export function getEventExpAmount(outcome: Extract<FloorEventOutcome, { type: 'exp' }>, floor: number): number {
  return randomInt(outcome.min + floor, outcome.max + floor * 3)
}
