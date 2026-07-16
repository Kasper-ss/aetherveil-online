import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initTelegramWebApp } from '@/lib/telegram'

function showBootError(message: string) {
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;background:#0a0a1a;color:#e2e8f0;font-family:system-ui,sans-serif;">
      <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
      <h1 style="font-size:18px;margin:0 0 8px;">Aetherveil Online</h1>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 16px;">${message}</p>
      <button type="button" onclick="location.reload()" style="padding:10px 16px;border:none;border-radius:8px;background:#00d4ff;color:#0a0a1a;font-weight:600;">Обновить</button>
    </div>
  `
}

try {
  initTelegramWebApp()
  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Root element not found')
  createRoot(rootEl).render(<App />)
} catch (error) {
  console.error('[Aetherveil] boot failed', error)
  showBootError(error instanceof Error ? error.message : 'Ошибка запуска приложения')
}
