# Aetherveil Online

SAO-inspired VRMMO Tower RPG — Telegram Mini App MVP.

Climb the Tower, fight anime-style battles, join guilds, and compete on leaderboards. Built with React, Phaser 3, and Zustand.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS v4 + Radix UI (shadcn-style components)
- **Game Engine:** Phaser 3 (Canvas/WebGL combat)
- **State:** Zustand
- **Routing:** React Router v6
- **Telegram:** `@telegram-apps/sdk-react` + `Telegram.WebApp`
- **Backend (optional):** Supabase (PostgreSQL) — MVP uses localStorage mock

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start dev server
npm run dev
```

Open `http://localhost:5173` — works outside Telegram with a dev mock player.

## Telegram Bot Setup (BotFather)

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Create a new bot: `/newbot` → follow prompts → save the **bot token**.
3. Set the Mini App URL:
   ```
   /mybots → Select your bot → Bot Settings → Menu Button → Configure
   ```
   Or use:
   ```
   /setmenubutton
   ```
   Set URL to your deployed app (e.g. `https://your-app.vercel.app`).

4. Enable Mini App:
   ```
   /mybots → Bot Settings → Configure Mini App → Enable
   ```
   Set the Mini App URL to the same deployed URL.

5. Optional — set bot username in `.env`:
   ```
   VITE_BOT_USERNAME=YourBotUsername
   ```

## Local Development with Telegram (ngrok)

Telegram Mini Apps require HTTPS. Use ngrok to tunnel your local server:

```bash
# Terminal 1 — dev server
npm run dev

# Terminal 2 — ngrok tunnel
npx ngrok http 5173
```

Copy the `https://xxxx.ngrok.io` URL and set it as your bot's Mini App URL in BotFather.

## Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

`vercel.json` is included for SPA routing. Set environment variables in the Vercel dashboard.

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist
```

Add `_redirects` (already in `public/`) for SPA fallback.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `TELEGRAM_BOT_TOKEN` | Bot token (**server only**, required for Stars payments) |
| `TELEGRAM_WEBHOOK_SECRET` | Secret token for `/api/telegram/webhook` |
| `SUPABASE_URL` | Supabase project URL (payment storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `VITE_BOT_USERNAME` | Bot username for invite links |
| `VITE_STARS_DEV_MOCK` | `true` = mock Stars payments in browser dev mode |

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL schema from `src/lib/supabase.ts` and `supabase/star_payments.sql` in the SQL editor.
3. Add your URL, anon key, and **service role key** to `.env`.
4. Player data will sync automatically on save.

Without Supabase, the game uses **localStorage** — perfect for local dev and demos. Star payments use in-memory storage in dev (single process only).

## Telegram Stars Payments

Real payments via `createInvoiceLink` + `WebApp.openInvoice`:

1. Add `TELEGRAM_BOT_TOKEN` to `.env` (from BotFather).
2. Deploy to Vercel (or run `npm run dev` with ngrok for HTTPS).
3. Run `supabase/star_payments.sql` if using Supabase.
4. Set the bot webhook:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_APP.vercel.app/api/telegram/webhook&secret_token=YOUR_SECRET
   ```
5. Add `TELEGRAM_WEBHOOK_SECRET=YOUR_SECRET` to Vercel env vars.

Flow: client creates invoice → user pays in Telegram → webhook marks payment `paid` → client confirms via `/api/stars/fulfill` → rewards are granted.

For browser-only dev (outside Telegram): set `VITE_STARS_DEV_MOCK=true`.

## Project Structure

```
src/
├── assets/           # Sprites, images (anime-style)
├── components/
│   ├── ui/           # Buttons, cards, dialogs, progress bars
│   └── game/         # Phaser combat container + HUD
├── data/             # Game data (floors, items, skills, shop)
├── features/
│   └── combat/       # Phaser CombatScene
├── hooks/            # Telegram init, back button, energy regen
├── lib/              # Telegram SDK, Supabase, audio, utils
├── pages/            # All game screens
├── store/            # Zustand stores (player, combat, UI)
└── types/            # TypeScript interfaces
```

## Gameplay

- **Tower:** Explore floors, auto-farm idle rewards, defeat bosses to advance.
- **Combat:** Tap to attack, swipe to dodge, use skills with cooldowns. Phaser-powered animations.
- **Progression:** Level up, equip gear, earn gold/gems, unlock skills.
- **Social:** Guild system, party (up to 4), invite friends via Telegram share.
- **Economy:** Gold from farming, gems as premium currency, Telegram Stars donat-shop.
- **Offline:** Idle rewards capped at 8 hours when returning.

## Telegram Integration

- `Telegram.WebApp.expand()` + `requestFullscreen()` on launch
- Back button navigation on sub-pages
- Haptic feedback on actions
- Theme sync from Telegram theme params
- initData validation placeholder (send to backend with `TELEGRAM_BOT_TOKEN`)

## Monetization (Stubs)

Telegram Stars and TON integration points are in `src/pages/ShopPage.tsx`. Connect the [Telegram Bot Payments API](https://core.telegram.org/bots/payments) when ready.

## License

MIT
