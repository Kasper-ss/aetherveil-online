import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'

const TUTORIAL_STEPS = [
  {
    title: 'Добро пожаловать в Aetherveil',
    text: 'Вы — бета-тестер, запертый в Башне. Поднимайтесь по этажам, побеждайте боссов и станьте сильнейшим игроком.',
    icon: '🏰',
  },
  {
    title: 'Основы боя',
    text: 'Бой полностью текстовый: нажимайте «Атака» и используйте навыки. В логе отображаются урон, криты и действия врага. Следите за полосками HP и энергии.',
    icon: '⚔️',
  },
  {
    title: 'Прогресс по Башне',
    text: 'На каждом этаже нужно убить определённое число мобов (этаж × 100), затем откроется босс. Этажи можно переигрывать для прокачки.',
    icon: '🗼',
  },
  {
    title: 'Готовы начать',
    text: 'Забирайте ежедневные награды, приглашайте друзей и вступайте в гильдию. Удачи, игрок!',
    icon: '✨',
  },
]

export function TutorialModal() {
  const show = useUIStore((s) => s.showTutorial)
  const setShow = useUIStore((s) => s.setShowTutorial)
  const completeTutorial = usePlayerStore((s) => s.completeTutorial)
  const [step, setStep] = useState(0)

  const data = TUTORIAL_STEPS[step]
  const isLast = step >= TUTORIAL_STEPS.length - 1

  function handleNext() {
    if (isLast) {
      completeTutorial()
      setShow(false)
    } else {
      setStep(step + 1)
    }
  }

  if (!show) return null

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) { setShow(false); completeTutorial() } }}>
      <DialogContent className="text-center">
        <DialogHeader>
          <div className="text-5xl mb-2">{data.icon}</div>
          <DialogTitle>{data.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-300 leading-relaxed">{data.text}</p>
        <div className="flex gap-1 justify-center mt-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === step ? 'bg-aether-cyan' : 'bg-aether-border'}`}
            />
          ))}
        </div>
        <Button onClick={handleNext} className="w-full mt-2">
          {isLast ? 'Начать приключение' : 'Далее'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
