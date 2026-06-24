import { Languages } from 'lucide-react'
import { useLocaleStore } from '@/store/localeStore'
import { hapticImpact } from '@/lib/telegram'

export function LanguageSwitcher() {
  const locale = useLocaleStore((s) => s.locale)
  const toggleLocale = useLocaleStore((s) => s.toggleLocale)

  return (
    <button
      onClick={() => { toggleLocale(); hapticImpact('light') }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-aether-card border border-aether-border text-xs font-semibold text-aether-cyan active:scale-95 transition-transform"
      aria-label="Switch language"
    >
      <Languages className="h-3.5 w-3.5" />
      {locale.toUpperCase()}
    </button>
  )
}
