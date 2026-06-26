import { create } from 'zustand'

interface UIState {
  isLoading: boolean
  loadingMessage: string
  showTutorial: boolean
  showDailyReward: boolean
  setShowDailyReward: (show: boolean) => void
  showIdleReward: boolean
  showPetReward: boolean
  showStatDistribution: boolean
  activeModal: string | null

  setLoading: (loading: boolean, message?: string) => void
  setShowTutorial: (show: boolean) => void
  setShowIdleReward: (show: boolean) => void
  setShowPetReward: (show: boolean) => void
  setShowStatDistribution: (show: boolean) => void
  setActiveModal: (modal: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: true,
  loadingMessage: 'Подключение к Aetherveil...',
  showTutorial: false,
  showDailyReward: false,
  showIdleReward: false,
  showPetReward: false,
  showStatDistribution: false,
  activeModal: null,

  setLoading: (loading, message = 'Подключение к Aetherveil...') =>
    set({ isLoading: loading, loadingMessage: message }),
  setShowTutorial: (show) => set({ showTutorial: show }),
  setShowDailyReward: (show) => set({ showDailyReward: show }),
  setShowIdleReward: (show) => set({ showIdleReward: show }),
  setShowPetReward: (show) => set({ showPetReward: show }),
  setShowStatDistribution: (show) => set({ showStatDistribution: show }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}))
