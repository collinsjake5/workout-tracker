# Home Gym Workouts

Personal dumbbell + bodyweight workout tracker. Next.js frontend, Supabase (Postgres) for storage, deployed free on Vercel.

## Setup

### 1. Create the Supabase project

1. At [supabase.com](https://supabase.com), create a new project (free tier).
2. Open **SQL Editor** → **New query**, paste in the contents of `supabase/schema.sql`, and run it. This creates the `exercises` and `workout_logs` tables and seeds the 4-day plan (Push / Pull / Lower+Core / Full Upper).
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

### 2. Configure environment variables locally

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the values from step 1.

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New Project** → import the GitHub repo.
3. Add the same two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings (Environment Variables).
4. Deploy. Vercel gives you a permanent `https://<project>.vercel.app` URL — open it on your phone and use "Add to Home Screen" for an app-like icon.

Every push to `main` auto-redeploys.

## How it's structured

- `supabase/schema.sql` — table definitions + seed data for all exercises. Edit the plan by editing rows in the `exercises` table (via Supabase's Table Editor), no code changes needed.
- `app/page.tsx` — home screen, highlights today's day based on the schedule in `lib/types.ts`.
- `app/day/[dayKey]/page.tsx` — one day's exercises, with per-set weight/reps logging (upserts into `workout_logs`, so re-opening today just edits today's entry).
- `app/history/page.tsx` — past logged sessions, grouped by date.
- No login — the anon key + open Postgres row-level-security policies are scoped for single-user personal use. Don't put anything sensitive in here.

## Changing the workout plan

Edit rows directly in Supabase's Table Editor (`exercises` table): change `day_key`, `order_index`, `name`, `target_sets`, `target_reps`, or `cue`. The app always reads live from the DB.
