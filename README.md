# invite-pool

A tiny open-source app for sharing invite codes with friends (todo-list style).

## Features

- Invite list with statuses: `available` / `claimed` / `used`
- Claim flow with ownership checks
- Mark-as-used and release actions
- Audit log table for traceability
- Vercel + Supabase friendly

## Stack

- Next.js (App Router)
- Supabase (Postgres)
- TypeScript

## Quick start

```bash
npm install
cp .env.example .env.local
# fill env vars
npm run dev
```

Open http://localhost:3000

## Supabase setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Fill `.env.local`:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
CLAIM_TTL_MINUTES=30
```

## API

- `GET /api/invites`
- `POST /api/claim` body: `{ id, actor }`
- `POST /api/use` body: `{ id, actor }`
- `POST /api/release` body: `{ id, actor }`

## Deploy (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set env vars in Vercel Project Settings
4. Deploy

## Notes

- This is an MVP intentionally kept simple.
- Uses service-role key on server route handlers only.
- For production hardening: add auth (Supabase Auth), RLS, and rate limits.
