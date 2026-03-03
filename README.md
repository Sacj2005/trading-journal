# IBKR Trading Journal

A multi-user trading journal web app powered by **Next.js**, **Supabase**, and **Google OAuth**.

## Features
- IBKR Flex Query CSV import with FIFO trade matching
- P&L in USD and GBP with full analytics dashboard
- Market data import (1min/5min candles) for MAE/MFE correlation
- Trade tagging (10 presets + custom tags)
- Trade notes
- AI-powered insights (Claude)
- Daily/weekly breakdowns
- Audit log (persisted)
- Multi-user with Google Sign-In
- Row Level Security — each user only sees their own data

## Setup

### 1. Clone and install
```bash
git clone https://github.com/sacj2005/trading-journal.git
cd trading-journal
npm install
```

### 2. Environment variables
Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Netlify
- Push to GitHub
- Connect repo in Netlify dashboard
- Add environment variables in Netlify → Site Settings → Environment Variables
- Deploy

## Tech Stack
- Next.js 15 (App Router)
- Supabase (Postgres + Auth + RLS)
- Google OAuth
- Tailwind CSS v4
- TypeScript
