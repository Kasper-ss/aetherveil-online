import { useLocaleStore } from '@/store/localeStore'
import { t, type TranslationKey } from '@/lib/i18n'

export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  return (key: TranslationKey) => t(key, locale)
}
