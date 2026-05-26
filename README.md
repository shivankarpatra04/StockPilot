# StockPilot AI — Setup Guide

## Quick Start

```bash
# 1. Navigate into the project
cd stockpilot-temp

# 2. Copy the environment file and fill in your values
cp .env.local.example .env.local

# 3. Push database schema (after setting DATABASE_URL)
npx prisma db push

# 4. Start the dev server
npm run dev
```

## Environment Variables

| Variable | Where to Get |
|---|---|
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above |
| `DATABASE_URL` | Supabase → Project → Settings → Database → URI |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |

## Features (what's working)

- ✅ **Landing page** — hero with glassmorphism widget, features grid, pricing, footer
- ✅ **Sign in / Register** — auto-creates account on first login
- ✅ **Dashboard** — market stats, watchlist snapshot, AI briefing, opportunities
- ✅ **Stock Comparison** — live Yahoo Finance data, AI scores, bar chart, Claude verdict
- ✅ **All API routes** — `/api/stock/quote`, `/api/ai-score`, `/api/claude/*`, `/api/watchlist`
- ✅ **TypeScript** — zero type errors (`tsc --noEmit` passes)
- ✅ **Prisma** — schema + client generated

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars in Vercel dashboard
4. Deploy

## Notes

- Without a `DATABASE_URL`, auth and watchlist features won't work, but the landing page and stock comparison will still function
- Without an `ANTHROPIC_API_KEY`, AI briefing and comparison verdict show a graceful fallback message
- Yahoo Finance data requires no API key (public endpoints)
