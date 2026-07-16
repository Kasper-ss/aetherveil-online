import { create } from 'zustand'

interface UIState {
  isLoading: boolean
  loadingMessage: string
  telegramAuthError: string | null
  showTutorial: boolean
  showDailyReward: boolean
  setShowDailyReward: (show: boolean) => void
  showIdleReward: boolean
  showPetReward: boolean
  showStatDistribution: boolean
  activeModal: string | null

  setLoading: (loading: boolean, message?: string) => void
  setTelegramAuthError: (message: string | null) => void
  setShowTutorial: (show: boolean) => void
  setShowIdleReward: (show: boolean) => void
  setShowPetReward: (show: boolean) => void
  setShowStatDistribution: (show: boolean) => void
  setActiveModal: (modal: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: true,
  loadingMessage: 'Подключение к Aetherveil...',
  telegramAuthError: null,
  showTutorial: false,
  showDailyReward: false,
  showIdleReward: false,
  showPetReward: false,
  showStatDistribution: false,
  activeModal: null,

  setLoading: (loading, message = 'Подключение к Aetherveil...') =>
    set({ isLoading: loading, loadingMessage: message }),
  setTelegramAuthError: (message) => set({ telegramAuthError: message }),
  setShowTutorial: (show) => set({ showTutorial: show }),
  setShowDailyReward: (show) => set({ showDailyReward: show }),
  setShowIdleReward: (show) => set({ showIdleReward: show }),
  setShowPetReward: (show) => set({ showPetReward: show }),
  setShowStatDistribution: (show) => set({ showStatDistribution: show }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}))
