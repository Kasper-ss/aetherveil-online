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
  safeAreaInset?: { top: number; bottom: number; left: number; right: number }
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number }
  ready: () => void
  expand: () => void
  close: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  disableVerticalSwipes?: () => void
  onEvent?: (eventType: string, callback: (data?: unknown) => void) => void
  offEvent?: (eventType: string, callback: (data?: unknown) => void) => void
  showAlert?: (message: string, callback?: () => void) => void
  showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void
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

type AlertEntry = { message: string; onClose?: () => void }

const alertQueue: AlertEntry[] = []
let alertShowing = false
let popupListenerBound = false

function bindPopupClosedListener(webApp: TelegramWebApp): void {
  if (popupListenerBound) return
  popupListenerBound = true
  webApp.onEvent?.('popupClosed', () => {
    if (!alertShowing) return
    alertShowing = false
    window.setTimeout(drainAlertQueue, 50)
  })
}

function drainAlertQueue(): void {
  if (alertShowing) return
  const next = alertQueue.shift()
  if (!next) return

  const webApp = getWebApp()
  if (!webApp?.showAlert) {
    alert(next.message)
    next.onClose?.()
    drainAlertQueue()
    return
  }

  alertShowing = true
  try {
    webApp.showAlert(next.message, () => {
      alertShowing = false
      next.onClose?.()
      drainAlertQueue()
    })
  } catch (error) {
    console.warn('[telegram] showAlert failed, retrying', error)
    alertShowing = false
    alertQueue.unshift(next)
    window.setTimeout(drainAlertQueue, 400)
  }
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
  const webApp = getWebApp()
  if (!webApp) return false
  return !!(webApp.initDataUnsafe?.user || (webApp.initData && webApp.initData.length > 10))
}

/**
 * Initialize Telegram WebApp — expand, safe areas, theme sync.
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

  // Не используем requestFullscreen — на iOS контент уезжает под шапку Telegram
  try {
    webApp.setHeaderColor?.('#0a0a1a')
    webApp.setBackgroundColor?.('#0a0a1a')
    webApp.disableVerticalSwipes?.()
  } catch {
    // not supported on this client
  }

  applyTelegramTheme(webApp)
  applyTelegramViewport(webApp)
  bindPopupClosedListener(webApp)

  return webApp
}

function applyTelegramViewport(webApp: TelegramWebApp) {
  const root = document.documentElement

  function update() {
    const safe = webApp.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 }
    let content = webApp.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 }

    // Старые клиенты Telegram не отдают contentSafeAreaInset — запас под шапку «Закрыть»
    if (content.top <= 0 && (webApp.platform === 'ios' || webApp.platform === 'android')) {
      content = { ...content, top: 52 }
    }

    const insetTop = safe.top + content.top
    const insetBottom = safe.bottom + content.bottom

    root.style.setProperty('--app-inset-top', `${insetTop}px`)
    root.style.setProperty('--app-inset-bottom', `${insetBottom}px`)
    root.style.setProperty('--app-inset-left', `${safe.left + content.left}px`)
    root.style.setProperty('--app-inset-right', `${safe.right + content.right}px`)

    const vh = webApp.viewportStableHeight || webApp.viewportHeight
    if (vh > 0) {
      root.style.setProperty('--tg-viewport-stable-height', `${vh}px`)
    }
  }

  update()
  webApp.onEvent?.('viewportChanged', update)
  webApp.onEvent?.('safeAreaChanged', update)
  webApp.onEvent?.('contentSafeAreaChanged', update)
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

/** alert() часто не виден в WebView Telegram — используем showAlert с очередью (один popup за раз) */
export function showTelegramAlert(message: string, onClose?: () => void): void {
  alertQueue.push({ message, onClose })
  drainAlertQueue()
}

/**
 * Share invite link via Telegram.
 */
let cachedBotUsername: string | null = null

export async function resolveBotUsername(): Promise<string> {
  if (cachedBotUsername) return cachedBotUsername
  const fromEnv = import.meta.env.VITE_BOT_USERNAME as string | undefined
  if (fromEnv) {
    cachedBotUsername = fromEnv.replace(/^@/, '')
    return cachedBotUsername
  }
  try {
    const res = await fetch('/api/telegram/bot-info')
    if (res.ok) {
      const data = await res.json() as { username?: string }
      if (data.username) {
        cachedBotUsername = data.username.replace(/^@/, '')
        return cachedBotUsername
      }
    }
  } catch (error) {
    console.warn('[telegram] bot-info failed', error)
  }
  return 'AetherveilBot'
}

export function preloadBotUsername(): void {
  void resolveBotUsername()
}

async function openShareLink(url: string, text: string): Promise<void> {
  const webApp = getWebApp()
  if (webApp) {
    webApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    )
  } else if (navigator.share) {
    await navigator.share({ title: 'Aetherveil Online', text, url })
  } else {
    await navigator.clipboard?.writeText(url)
  }
}

export async function shareInviteLink(referralCode: string): Promise<void> {
  const botUsername = await resolveBotUsername()
  const url = `https://t.me/${botUsername}?start=ref_${referralCode}`
  const text = `⚔️ Присоединяйся ко мне в Aetherveil Online! За регистрацию я получу награду, а ты — старт в башне.\n${url}`
  await openShareLink(url, text)
}

export async function shareGuildInviteLink(referralCode: string): Promise<void> {
  const botUsername = await resolveBotUsername()
  const url = `https://t.me/${botUsername}?start=guild_${referralCode}`
  const text = `🏰 Вступай в нашу гильдию в Aetherveil Online!\n${url}`
  await openShareLink(url, text)
}

export function openTelegramChannel(url: string): void {
  const webApp = getWebApp()
  if (webApp) {
    webApp.openTelegramLink(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Validate initData on your backend:
 * POST /api/auth/validate { initData: webApp.initData }
 * Server verifies HMAC-SHA256 with BOT_TOKEN
 */
export function getInitData(): string {
  return getWebApp()?.initData ?? ''
}

/** Deep-link start param from Telegram (e.g. ref_AV...) */
export function getTelegramStartParam(): string | null {
  const webApp = getWebApp()
  const unsafe = webApp?.initDataUnsafe as { start_param?: string } | undefined
  if (unsafe?.start_param) return unsafe.start_param
  try {
    return new URL(window.location.href).searchParams.get('tgWebAppStartParam')
  } catch {
    return null
  }
}

export function saveDevUser(user: TelegramUser): void {
  storageSet('dev_user', user)
}
