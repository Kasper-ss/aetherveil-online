import { useUIStore } from '@/store/uiStore'
import { useT } from '@/hooks/useT'

export function LoadingScreen() {
  const isLoading = useUIStore((s) => s.isLoading)
  const message = useUIStore((s) => s.loadingMessage)
  const t = useT()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-aether-bg scanlines">
      {/* Animated tower logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 border-2 border-aether-cyan rounded-lg rotate-45 glow-cyan animate-pulse-glow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl -rotate-45">⚔️</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white text-glow mb-2">{t('app.title')}</h1>
      <p className="text-sm text-aether-cyan animate-pulse-glow mb-8">{message}</p>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-aether-card rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-aether-cyan to-aether-purple rounded-full animate-[loading_2s_ease-in-out_infinite]" 
          style={{ width: '60%', animation: 'loadingBar 2s ease-in-out infinite' }} 
        />
      </div>

      <p className="text-[10px] text-slate-600 mt-6">VRMMO Tower RPG · v0.1.0 MVP</p>

      <style>{`
        @keyframes loadingBar {
          0% { width: 10%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 10%; margin-left: 90%; }
        }
      `}</style>
    </div>
  )
}
