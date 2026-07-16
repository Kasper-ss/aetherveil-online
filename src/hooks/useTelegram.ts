import { useEffect } from 'react'
import { initTelegramWebApp, getWebApp, preloadBotUsername } from '@/lib/telegram'
import { usePlayerStore } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import { startBgm } from '@/lib/audio'
import { registerOnlinePlayer } from '@/lib/multiplayer'

export function useTelegramInit() {
  useEffect(() => {
    let cancelled = false

    async function init() {
      const { loadPlayer } = usePlayerStore.getState()
      const { setLoading, setTelegramAuthError, setShowTutorial, setShowIdleReward, setShowPetReward } =
        useUIStore.getState()

      try {
        setTelegramAuthError(null)
        setLoading(true, 'Подключение к Aetherveil...')
        initTelegramWebApp()
        preloadBotUsername()
        setLoading(true, 'Синхронизация нейроинтерфейса...')
        await loadPlayer()

        if (cancelled) return

        setLoading(true, 'Вход в Башню...')

        const player = usePlayerStore.getState().player
        if (player?.classSelected && !player.tutorialCompleted) {
          setShowTutorial(true)
        }
        if (usePlayerStore.getState().idleReward) {
          setShowIdleReward(true)
        } else if (usePlayerStore.getState().petReward) {
          setShowPetReward(true)
        }

        startBgm()
      } catch (error) {
        console.error('[Aetherveil] init failed', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])
}

export function useTelegramBackButton(onBack: () => void, visible = true) {
  useEffect(() => {
    const webApp = getWebApp()
    if (!webApp) return

    if (visible) {
      webApp.BackButton.show()
      webApp.BackButton.onClick(onBack)
    } else {
      webApp.BackButton.hide()
    }

    return () => {
      webApp.BackButton.offClick(onBack)
      webApp.BackButton.hide()
    }
  }, [onBack, visible])
}

export function useOnlineHeartbeat() {
  useEffect(() => {
    const tick = () => {
      const player = usePlayerStore.getState().player
      if (player) registerOnlinePlayer(player)
      void usePlayerStore.getState().syncPlayerState()
    }
    tick()
    const interval = setInterval(tick, 15_000)
    return () => clearInterval(interval)
  }, [])
}

export function useEnergyRegen() {
  const tryRegenVitals = usePlayerStore((s) => s.tryRegenVitals)

  useEffect(() => {
    const interval = setInterval(tryRegenVitals, 1000)
    return () => clearInterval(interval)
  }, [tryRegenVitals])
}
