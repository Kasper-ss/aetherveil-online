import { useSessionLock } from '@/hooks/useSessionLock'

export function SessionGuard() {
  const blocked = useSessionLock()
  if (!blocked) return null

  return (
    <div className="fixed inset-0 z-[100] bg-aether-bg/95 flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <p className="text-lg font-bold text-white">Игра уже открыта</p>
        <p className="text-sm text-slate-400">
          Закройте другую вкладку или окно Aetherveil, чтобы продолжить здесь. Это защищает от абьюза.
        </p>
      </div>
    </div>
  )
}
