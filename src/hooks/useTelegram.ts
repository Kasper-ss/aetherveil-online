import { useEffect, useRef } from 'react'
import { initTelegramWebApp, getWebApp } from '@/lib/telegram'
import { usePlayerStore } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import { startBgm } from '@/lib/audio'
import { delay } from '@/lib/utils'
import { registerOnlinePlayer } from '@/lib/multiplayer'

export function useTelegramInit() {
  const initStarted = useRef(false)

  useEffect(() => {
    if (initStarted.current) return
    initStarted.current = true

    async function init() {
      const { loadPlayer } = usePlayerStore.getState()
      const { setLoading, setShowTutorial, setShowIdleReward } = useUIStore.getState()

      try {
        setLoading(true, 'Подключение к Aetherveil...')
        initTelegramWebApp()
        await delay(800)
        setLoading(true, 'Синхронизация нейроинтерфейса...')
        await delay(600)

        await loadPlayer()

        setLoading(true, 'Вход в Башню...')
        await delay(500)

        const player = usePlayerStore.getState().player
        if (player?.classSelected && !player.tutorialCompleted) {
          setShowTutorial(true)
        }
        if (usePlayerStore.getState().idleReward) {
          setShowIdleReward(true)
        }

        startBgm()
      } catch (error) {
        console.error('[Aetherveil] init failed', error)
      } finally {
        setLoading(false)
      }
    }

    init()
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
