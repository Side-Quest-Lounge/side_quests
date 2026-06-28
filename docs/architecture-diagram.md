# Side Quest — Architecture

## Overview

Side Quest is a weekly activity-based friend-matching app for Auckland newcomers. Users complete a vibe quiz, get embedded with Bedrock Titan, and are matched into parties of six via pgvector similarity. A template-based concierge reveals the group and venue; party chat is Aurora-backed with polling. Open quests (Explore) are a separate client-side social layer.

## System diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Vercel (Next.js 16 App Router)                       │
├──────────────────────────────────────────────────────────────────────────┤
│  Public pages: landing · sign-in/up · after-auth · onboarding · quiz   │
│  App shell: home · finding · group/[id] · chat · explore · quests ·    │
│             profile · survey/[id]                                        │
│  Admin: /admin (groups) · /admin/agents (traces)                         │
├──────────────────────────────────────────────────────────────────────────┤
│  API routes:                                                             │
│    /api/health              liveness (public)                            │
│    /api/profile             save quiz answers + Bedrock embed              │
│    /api/me/profile          read user + quiz answers                     │
│    /api/me/group            current matched group + reveal payload       │
│    /api/me/quests           past completed quests                        │
│    /api/me/confirm-seat     free seat when payments disabled             │
│    /api/match               pgvector kNN + buildGroups                   │
│    /api/agent/reveal        template rationale + icebreakers + venue     │
│    /api/agent/host          welcome + icebreakers in chat; canned nudge  │
│    /api/chat/[id]           GET poll / POST user messages (party chat)   │
│    /api/stripe/checkout     Stripe Checkout session                      │
│    /api/stripe/webhook      subscription_status = active (public)        │
│    /api/subscription        read subscription status                     │
│    /api/survey              post-event feedback → re-embed profile       │
│    /api/admin/groups        read-only group list                         │
│    /api/admin/traces        read-only agent_traces                       │
├──────────────────────────────────────────────────────────────────────────┤
│  Client-only (not Aurora):                                               │
│    Open quests — seed data + localStorage/sessionStorage                 │
│    Open quest chat — localStorage per quest (`sq_open_chat_*`)           │
├──────────────────────────────────────────────────────────────────────────┤
│  Clerk (auth) — all routes except landing, sign-in/up, health, webhook   │
└────────────┬───────────────────────────────┬─────────────────────────────┘
             │ RDS Data API (HTTP)           │ Bedrock Titan
             ▼                               ▼
┌────────────────────────────┐    ┌──────────────────────────────────────┐
│ Aurora PostgreSQL Serverless│    │ amazon.titan-embed-text-v2:0         │
│ v2 + pgvector (1024-dim)   │    │ 1024-dim profile embeddings          │
│                            │    └──────────────────────────────────────┘
│ users · profiles · venues  │
│ events · groups · messages │
│ surveys · agent_traces     │
└────────────────────────────┘
```

## Data flow (golden path)

1. **Onboarding** — Clerk sign-up → `/after-auth` → onboarding (name/bio) → vibe quiz → `POST /api/profile` → Bedrock Titan embeds → `profiles.embedding`
2. **Matching** — `/finding` → `POST /api/match` → pgvector cosine kNN (30 candidates) → `buildGroups` picks 6 → persist `groups` + `group_members`
3. **Reveal** — `POST /api/agent/reveal` → template rationale + 3 icebreakers; `bookVenue` picks venue; event updated → `/group/[id]`
4. **Seat** — Stripe Checkout (`/api/stripe/checkout` + webhook) **or**, when `NEXT_PUBLIC_PAYMENTS_DISABLED=1`, `POST /api/me/confirm-seat` sets `subscription_status = active`
5. **Party chat** — `/chat/[groupId]` → `POST /api/agent/host` posts welcome + icebreakers once → users poll `GET /api/chat/[id]` every 3s; user messages via `POST /api/chat/[id]`
6. **Survey** — vibe score + open text → `POST /api/survey` → update `preferences` + re-embed for next match
7. **Open quests** (parallel) — curated seed + user-created quests in browser storage; join → local welcome message → chat in localStorage (no server persistence)

## Key design decisions

| Concern | Choice |
|---------|--------|
| Auth | Clerk only (`@clerk/nextjs` middleware) |
| Database | Aurora PostgreSQL Serverless v2 with Data API (required AWS resource) |
| ORM access | Drizzle via `aws-data-api/pg` — no connection pooling |
| Matching | pgvector cosine distance (`<=>`), kNN top 30 → `buildGroups` (anchor + top 5) |
| Embeddings | Bedrock Titan v2 (`amazon.titan-embed-text-v2:0`), 1024 dimensions; optional deterministic fallback when throttled (`ALLOW_DETERMINISTIC_EMBEDDINGS=1`) |
| Concierge | Template copy + rule-based `bookVenue` / `pickStartTime` — no live LLM |
| Chat host | Stored agent messages via `/api/agent/host`; optional canned nudge action |
| Party chat | Aurora `messages` table, 3s polling (no WebSockets); GET/POST rate-limited in Aurora |
| Open quests | Client-side seed + localStorage — not Aurora-backed; capped creates per browser/day |
| Rate limits | Aurora `rate_limits` table — match, profile, chat, poll, survey, etc. |
| Payments | Stripe Checkout + webhook; `NEXT_PUBLIC_PAYMENTS_DISABLED=1` bypasses Stripe for demos |
| Seat gating | `subscription_status` on `users` gates full reveal, party chat, and hosting open quests |
