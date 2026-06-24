import { create } from 'zustand'
import { storageGet, storageSet } from '@/lib/utils'

export type Locale = 'ru' | 'en'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: storageGet<Locale>('locale', 'ru'),
  setLocale: (locale) => {
    storageSet('locale', locale)
    set({ locale })
  },
  toggleLocale: () => {
    const next = get().locale === 'ru' ? 'en' : 'ru'
    get().setLocale(next)
  },
}))
