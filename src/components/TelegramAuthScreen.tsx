import { useUIStore } from '@/store/uiStore'
import { getWebApp } from '@/lib/telegram'

export function TelegramAuthScreen() {
  const error = useUIStore((s) => s.telegramAuthError)
  if (!error) return null

  const webApp = getWebApp()

  return (
    <div className="fixed inset-0 z-[110] bg-aether-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-3">📱</div>
      <h2 className="text-lg font-bold text-white mb-2">Не удалось войти в аккаунт</h2>
      <p className="text-sm text-slate-400 mb-4 max-w-sm">{error}</p>
      <ul className="text-xs text-slate-500 text-left max-w-sm space-y-2 mb-6">
        <li>• Закройте игру полностью (смахните вверх в Telegram).</li>
        <li>• Откройте бота и нажмите кнопку «⚔️ Играть» (не ссылку в чате).</li>
        <li>• Или используйте кнопку меню ☰ внизу чата с ботом.</li>
      </ul>
      <button
        type="button"
        className="px-4 py-2 rounded-lg bg-aether-cyan text-aether-bg font-medium"
        onClick={() => {
          if (webApp) webApp.close()
          else window.location.reload()
        }}
      >
        Закрыть и попробовать снова
      </button>
    </div>
  )
}
