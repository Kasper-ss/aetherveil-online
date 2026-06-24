import { storageGet, storageSet } from './utils'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    query_id?: string
    auth_date?: number
    hash?: string
  }
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  platform: string
  version: string
  ready: () => void
  expand: () => void
  close: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText: (text: string) => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
  }
  BackButton: {
    isVisible: boolean
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
    show: () => void
    hide: () => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  openTelegramLink: (url: string) => void
  openLink: (url: string) => void
  openInvoice?: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending' | string) => void) => void
  shareToStory?: (params: { text?: string; widget_link?: { url: string; name?: string } }) => void
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp }
  }
}

/** Mock user for local development outside Telegram */
const DEV_MOCK_USER: TelegramUser = {
  id: 100000001,
  first_name: 'Kirito',
  username: 'dev_player',
  language_code: 'en',
}

export function getWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null
}

export function getTelegramUser(): TelegramUser {
  const webApp = getWebApp()
  const user = webApp?.initDataUnsafe?.user
  if (user) return user

  // Dev fallback
  return storageGet<TelegramUser>('dev_user', DEV_MOCK_USER)
}

export function isTelegramEnvironment(): boolean {
  return !!getWebApp()?.initDataUnsafe?.user
}

/**
 * Initialize Telegram WebApp — expand, fullscreen, theme sync.
 * Call once on app mount.
 */
export function initTelegramWebApp(): TelegramWebApp | null {
  const webApp = getWebApp()
  if (!webApp) {
    console.info('[Aetherveil] Running outside Telegram — using dev mock user')
    return null
  }

  webApp.ready()
  webApp.expand()

  // Request fullscreen on supported clients
  try {
    webApp.requestFullscreen?.()
  } catch {
    // not supported on this client
  }

  // Apply Telegram theme to CSS variables
  applyTelegramTheme(webApp)

  return webApp
}

function applyTelegramTheme(webApp: TelegramWebApp): void {
  const root = document.documentElement
  const tp = webApp.themeParams

  if (tp.bg_color) root.style.setProperty('--tg-bg', tp.bg_color)
  if (tp.text_color) root.style.setProperty('--tg-text', tp.text_color)
  if (tp.button_color) root.style.setProperty('--tg-button', tp.button_color)
  if (tp.button_text_color) root.style.setProperty('--tg-button-text', tp.button_text_color)
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  getWebApp()?.HapticFeedback?.impactOccurred(style)
}

export function hapticSuccess(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred('success')
}

export function hapticError(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred('error')
}

/**
 * Share invite link via Telegram.
 * Replace BOT_USERNAME with your actual bot username.
 */
export function shareInviteLink(referralCode: string): void {
  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'AetherveilBot'
  const url = `https://t.me/${botUsername}?start=ref_${referralCode}`
  const text = `⚔️ Join me in Aetherveil Online! Climb the Tower together!\n${url}`

  const webApp = getWebApp()
  if (webApp) {
    webApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    )
  } else if (navigator.share) {
    navigator.share({ title: 'Aetherveil Online', text, url })
  } else {
    navigator.clipboard?.writeText(url)
  }
}

/**
 * Validate initData on your backend:
 * POST /api/auth/validate { initData: webApp.initData }
 * Server verifies HMAC-SHA256 with BOT_TOKEN
 */
export function getInitData(): string {
  return getWebApp()?.initData ?? ''
}

export function saveDevUser(user: TelegramUser): void {
  storageSet('dev_user', user)
}
