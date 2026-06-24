/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_BOT_USERNAME: string
  readonly VITE_STARS_ENABLED: string
  readonly VITE_STARS_DEV_MOCK: string
  readonly VITE_TON_MERCHANT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {}
