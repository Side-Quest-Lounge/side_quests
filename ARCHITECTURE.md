# Timeleft — Architecture Plan

**Stack:** Vite + React (web) + Supabase (database/auth/storage/realtime/edge functions) + Resend (email) + Anthropic Claude (AI features).
**Timeline:** 4 weeks, 5 people.
**Deliverable:** Public web app. Mobile is a Capacitor wrap later, no rewrite.
**Status:** Greenfield. This document is the plan — no code, migrations, or functions exist yet. Week 1 lays the foundation; everything below is a target, not a description.

---

## 1. The Product, in One Picture

```
                    HOW DO YOU WANT TO MEET PEOPLE?
                                │
            ┌───────────────────┴────────────────────┐
            │                                        │
       SURPRISE ME                          PICK AN ACTIVITY
   "AI picks the group +                "Show me what's happening
    AI picks a fun activity"             in Auckland and let me
                                          join one"
            │                                        │
            ▼                                        ▼
   ┌────────────────┐                    ┌────────────────────────┐
   │ AI quiz +      │                    │ EXPLORE PAGE           │
   │ AI-generated   │                    │ • Hosted Timeleft       │
   │ novel activity │                    │   events                │
   │ (e.g. clay     │                    │ • Scraped Auckland      │
   │  workshop)     │                    │   events (Eventbrite,   │
   │                │                    │   Meetup, Facebook,     │
   │                │                    │   Instagram, Reddit)    │
   │                │                    │ • Partnered venue       │
   │                │                    │   events                │
   └────────┬───────┘                    └───────────┬────────────┘
            │                                        │
            └────────────────┬───────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   MATCHING ENGINE    │
                  │ Vector-based,        │
                  │ activity-aware,      │
                  │ no-repeat penalty    │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │ GROUP OF 4–6         │
                  │ Reveal 48h before    │
                  │ Group chat unlocked  │
                  │ Survey after         │
                  └──────────────────────┘
```

The Explore page also drives a **business loop**: scraped events show us which venues/organizers are active in Auckland, which becomes our outreach list for paid partnerships.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Web frontend | Vite + React 18 + TypeScript | Fast dev loop, easy Capacitor wrap later |
| Styling | Tailwind + shadcn/ui | Demo-quality UI without design debt |
| Routing/data | React Router + TanStack Query | Type-safe queries, optimistic updates |
| Auth | Supabase Auth (magic link + Google) | No password code, no Apple cert headaches |
| Database | Supabase Postgres + RLS | Browser talks to DB directly with row-level security |
| Realtime | Supabase Realtime | Live group chat, live admin dashboard |
| Storage | Supabase Storage | Avatars, group selfies |
| Serverless | Supabase Edge Functions (Deno) | Admin ops, AI calls, email — wherever secrets live |
| Email | Resend + React Email | Transactional reveals, day-of, survey, cancel emails |
| AI | Anthropic Claude (Sonnet 4.6 for quality, Haiku 4.5 for batch) | Activity suggestion, event scraping summarization |
| Hosting | Vercel (web) + Supabase Cloud (backend) | Both free-tier; auto-deploy from GitHub |
| Future mobile | Capacitor wrap of the same React app | iOS + Android in a weekend post-hackathon |

---

## 3. System Diagram

```
   ┌──────────────────────────────────────────────────────────┐
   │                    Browser (web/)                        │
   │  Vite + React + Tailwind + shadcn/ui                     │
   │                                                          │
   │  Routes:                                                 │
   │   /                 landing                              │
   │   /sign-in          magic link / Google                  │
   │   /onboarding       profile + photo                      │
   │   /quiz             10-question vibe quiz                │
   │   /explore          activity & event feed (NEW)          │
   │   /surprise         opt into surprise matching (NEW)     │
   │   /events/:id       event detail + RSVP                  │
   │   /home             state-machine card                   │
   │   /reveal/:eventId  group reveal                         │
   │   /chat/:groupId    realtime group chat                  │
   │   /survey/:eventId  post-event survey                    │
   │   /profile          edit own profile                     │
   │   /admin/*          founder dashboard                    │
   └────────────────┬─────────────────────────────────────────┘
                    │
        supabase-js (anon key + user JWT, RLS-gated)
                    │
   ┌────────────────┴──────────────────────────────────────────┐
   │                     SUPABASE                              │
   │  ┌────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────┐  │
   │  │ Auth   │  │  Postgres    │  │Realtime │  │ Storage  │  │
   │  │ magic+ │  │  + RLS       │  │  (ws)   │  │ avatars  │  │
   │  │ Google │  │  + pg_cron   │  │         │  │  selfies │  │
   │  └────────┘  └──────────────┘  └─────────┘  └──────────┘  │
   │  ┌─────────────────────────────────────────────────────┐  │
   │  │  Edge Functions (Deno, service-role)                │  │
   │  │  • match              — deterministic matcher       │  │
   │  │  • suggest-activity   — AI picks novel activity     │  │
   │  │  • discover-events    — cron scraper (NEW)          │  │
   │  │  • send-reveals       — iron-rule idempotent emails │  │
   │  │  • cancel             — HMAC token, no-auth         │  │
   │  │  • resend-webhook     — delivery event ingest       │  │
   │  └─────────┬───────────────────────┬───────────────────┘  │
   └────────────┼───────────────────────┼──────────────────────┘
                │                       │
          ┌─────▼─────┐           ┌─────▼─────┐
          │  Resend   │           │ Anthropic │
          │  (email)  │           │  Claude   │
          └───────────┘           └───────────┘
                                        │
                                  + external sources:
                                    Eventbrite, Meetup,
                                    Facebook, Instagram,
                                    Reddit r/Auckland
```

The trust boundary: browser only ever holds the **anon key + user JWT**. Service role key, Resend API key, and Anthropic API key all live in Edge Function secrets.

---

## 4. Two Matching Paths

This is the new product shape. Both paths converge at the same matching engine; they only differ in what's set upfront.

### Path A — "Surprise Me"
- User opts in via `/surprise`
- They specify date availability (e.g., "any Thursday in May")
- AI ranks novel Auckland activities, picks one for their cohort
- Matched into a group of 4–6 by quiz-vector similarity
- The activity reveal is part of the surprise

**Required new pieces:**
- `surprise_signups` table (user_id, availability window)
- `suggest-activity` Edge Function (Claude picks from `activities` + `discovered_events`)
- Admin can approve the surprise event before it's locked in

### Path B — "Pick an Activity"
- User browses `/explore` page
- Activities + scraped events + hosted events all in one feed
- They RSVP to a specific event
- Matched with others who RSVP'd to **the same event**, filtered for vibe compatibility

**Required new pieces:**
- `activities` table (categories: trivia, axe-throwing, pottery, hiking, dinner)
- `discovered_events` table (the scraper output)
- `/explore` page UI with filters
- RSVP flow unchanged from the existing spec

### Same matching engine

Both paths feed the same `match` Edge Function. The function takes:
- An event ID (or a surprise cohort ID — internally still an event)
- All RSVPs for that event
- User quiz vectors
- History of past pairings

It produces groups of 4–6 maximizing pairwise compatibility minus repeat-pairing penalty. Pure deterministic function — lives in `shared/matching.ts` (to be built).

The only difference between paths is **how the event got created** (founder-hosted, AI-suggested-and-approved, or scraped-and-claimed). The matching is identical.

---

## 5. AI Event Discovery Agent

A cron-scheduled Edge Function that builds the Explore feed.

### What it does

1. Runs every 6 hours on `pg_cron`
2. Hits a small set of Auckland event sources:
   - Eventbrite API (free, structured)
   - Meetup API
   - r/Auckland RSS / new posts
   - Facebook Events (graph API for public events)
   - Instagram public posts via hashtag search (#aucklandevents)
3. For each scraped item, calls Claude (Haiku 4.5) to:
   - Extract structured fields (title, date, venue, category)
   - Classify activity type (trivia, sports, food, arts, etc.)
   - Score "friend-friendly" potential (group-shaped activity, not a concert)
   - Generate a one-line description in our voice
4. Writes to `discovered_events` table with `status = 'unreviewed'`
5. Founder reviews in admin → marks as `featured` (shows in Explore) or `partner_target` (outreach list)

### Why this matters strategically

The Explore feed is a **growth engine**:
- Users see real Auckland activity, not just our 1–2 hosted events
- We learn which venues/organizers are active → outreach list
- Partnered events get prominent placement → revenue path

### What it doesn't do

- It does **not** create real events users can RSVP to automatically. Every Explore item is read-only until a founder converts it (either by hosting a Timeleft cohort at that event, or by partnering with the organizer).
- It does **not** scrape gated content, bypass logins, or violate any site's TOS. Public APIs and public RSS only.

---

## 6. Database Schema

Nothing is migrated yet. The full schema below ships in the Week 1 foundation migration.

### Core tables
`users` · `quiz_responses` · `events` · `rsvps` · `groups` · `group_members` · `email_sends` · `device_tokens` · `survey_responses` · `user_reports`

These follow the standard shape (uuid PKs, `created_at` timestamps, FKs with `on delete cascade` where appropriate, RLS default-deny). Schemas are sketched in the lane-A handoff doc and finalized in Week 1.

### Product-specific tables

```sql
-- Activity catalog: pub trivia, axe throwing, pottery, hike, dinner, ...
create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  vibe_tags    text[] not null default '{}',   -- e.g. ['chill','indoor','creative']
  created_at   timestamptz not null default now()
);

-- `events` carries an activity FK and a source tag from day one
-- (folded into the initial events migration; no alter needed)
--   activity_id uuid references public.activities(id),
--   source      text not null default 'hosted'
--               check (source in ('hosted', 'ai_suggested', 'partner', 'scraped'))

-- Group chat
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index messages_group_id_idx on public.messages(group_id, created_at);

-- Surprise-me signups (Path A)
create table public.surprise_signups (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  available_from    timestamptz not null,
  available_until   timestamptz not null,
  matched_event_id  uuid references public.events(id) on delete set null,
  status            text not null default 'pending'
                    check (status in ('pending', 'matched', 'cancelled')),
  created_at        timestamptz not null default now()
);

-- Discovered events from the scraper agent
create table public.discovered_events (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,                  -- 'eventbrite', 'meetup', 'reddit', ...
  source_url      text not null unique,
  title           text not null,
  description     text,
  starts_at       timestamptz,
  venue_name      text,
  venue_address   text,
  activity_id     uuid references public.activities(id),
  friend_score    int,                            -- Claude's 1-10 group-friendliness
  raw_payload     jsonb not null,                 -- original API/scrape payload
  status          text not null default 'unreviewed'
                  check (status in ('unreviewed','featured','partner_target','archived')),
  created_at      timestamptz not null default now()
);
create index discovered_events_status_idx on public.discovered_events(status);
create index discovered_events_starts_at_idx on public.discovered_events(starts_at);

-- Partnership pipeline
create table public.partnerships (
  id                uuid primary key default gen_random_uuid(),
  organizer_name    text not null,
  contact_email     text,
  source_event_id   uuid references public.discovered_events(id),
  status            text not null default 'lead'
                    check (status in ('lead','contacted','negotiating','active','dead')),
  notes             text,
  created_at        timestamptz not null default now()
);
```

Every table gets RLS policies in the same migration. Default-deny stance from day one.

---

## 7. Edge Functions (full list)

All seven functions are net-new. None exist yet.

| Function | Job |
|---|---|
| `match` | Deterministic cosine matching for a given event's RSVPs |
| `send-reveals` | Idempotent, per-recipient reveal emails (iron rule) |
| `cancel` | Verify HMAC token, drop user from group, return HTML |
| `resend-webhook` | Update `email_sends.status` on Resend events |
| `send-pushes` | Web Push delivery for reveal/day-of/survey |
| `suggest-activity` | Claude picks a novel activity for a surprise cohort |
| `discover-events` | Cron job: scrape Auckland sources, classify with Claude, write to `discovered_events` |

Every Edge Function lives in `supabase/functions/<name>/index.ts` and is deployed with `supabase functions deploy <name>`.

---

## 8. Frontend Page Map

### Public

| Route | Purpose |
|---|---|
| `/` | Landing + pitch + signup |
| `/sign-in` | Magic link + Google |

### Authed

| Route | Purpose | Lane |
|---|---|---|
| `/onboarding` | Name, photo, hobbies, bio | A |
| `/quiz` | 10-question vibe quiz | C |
| `/home` | State-machine card (what's next for this user) | B |
| `/explore` | Activity catalog + scraped events, filter by vibe / date | B |
| `/surprise` | Opt into AI matching, pick availability window | C |
| `/events/:id` | Event detail, venue, RSVP button | B |
| `/reveal/:eventId` | Group photos, bios (unlocks 48h before) | C |
| `/chat/:groupId` | Realtime group chat | D |
| `/survey/:eventId` | 2-question post-event form | D |
| `/profile` | Edit own info | A |

### Admin

| Route | Purpose | Lane |
|---|---|---|
| `/admin` | Dashboard: pending review, reports | E |
| `/admin/events/:id` | RSVPs, run match, send reveals, attendance | E |
| `/admin/discovered` | Scraped events feed, mark `featured` or `partner_target` | E |
| `/admin/partnerships` | Outreach pipeline (lead → contacted → active) | E |

---

## 9. Five-Person Lane Assignment (4 weeks)

Each lane gets a clean folder boundary so no two people edit the same file.

| # | Lane | Owns | Demo moment |
|---|---|---|---|
| **A** | **Foundation & Onboarding** | Auth (magic link + Google), profile, photo upload, navigation shell, landing page, deployment pipeline, generated types | "Sign in → onboard → land on home" |
| **B** | **Activities, Explore & RSVP** | Activity catalog, `/explore` page (with discovered events feed), event detail, RSVP flow, home state-machine card | "Browse Explore → RSVP → see card on home" |
| **C** | **Quiz, Matching & Reveal** | Quiz UI, quiz storage, `match` Edge Function, `shared/matching.ts`, `/surprise` opt-in flow, reveal page | "Admin clicks Run match → group appears on reveal page" |
| **D** | **Chat, Survey & Cancel** | `messages` table + RLS, realtime chat UI, post-event survey, cancel link from email | "Group members chat live; user gets survey post-event" |
| **E** | **Admin, Discovery Agent & Email** | All `/admin/*` pages, `discover-events` Edge Function + Claude pipeline, `suggest-activity` for Path A, `send-reveals` + Resend templates, partnership pipeline | "Founder reviews scraped events → features them → users see them on Explore" |

### Week-by-week

**Week 1 — Foundation & contracts**
- Everyone aligned on schema additions, type definitions, page routes
- Lane A: auth, types generated, deployed to Vercel, everyone can sign in
- Lanes B–E: scaffold their pages with mock data using fixtures from `shared/mocks/`
- End-of-week milestone: every page renders something, even if fake

**Week 2 — Vertical slices in parallel**
- Each lane builds their own slice end-to-end against fixtures
- Mid-week sync: cross-lane interfaces (e.g., Lane B emits an RSVP, Lane E consumes it for admin view)
- Discovery agent runs in dev mode, populating `discovered_events` with sample data

**Week 3 — Integration**
- Mocks come off, real wiring goes in
- Daily end-to-end runs as a group: sign up → quiz → Explore → RSVP → admin match → reveal → chat → survey
- Bug bash: every bug filed, assigned, fixed before adding new work

**Week 4 — Polish + AI features come online + rehearsal**
- Discovery agent calls real Claude API on real Auckland sources
- Surprise-me flow works end-to-end with `suggest-activity`
- Demo dry-runs at +0, +24h, +44h from final demo
- Seed DB with realistic-looking fake users + a featured Explore feed for the live demo

---

## 10. Matching Algorithm Detail

Specified here; implemented in `shared/matching.ts` by Lane C, Week 1. Pure function — no DB, no I/O — so it can be unit-tested against fixtures before any RSVPs exist. Lanes B and E stub against its type signature on day one.

### Type signature

```ts
type User = { id: string; vector: number[] };
type Group = { userIds: string[] };

function matchGroups(
  eligibleUsers: User[],
  history: Set<string>,        // keys: "userA|userB" with userA < userB lexically
  opts?: { sizeMin?: number; sizeMax?: number }  // defaults: 4, 6
): Group[];
```

### Algorithm

1. **`pairScore(a, b)`** = `cosineSimilarity(a.vector, b.vector) − (history.has(key(a,b)) ? 0.5 : 0)`
2. **Greedy seed-and-grow**, while `remaining.length >= sizeMin`:
   - Seed: pick the pair with the highest `pairScore` from `remaining`.
   - Grow: repeatedly add the user with the highest *mean* `pairScore` against the current group, until size reaches `sizeMax`.
   - Remove that group from `remaining`.
3. Return all formed groups. Leftover users (< `sizeMin`) are dropped and surfaced to the admin.

### Properties

- **Deterministic** — same input, same output. Critical for tests and for re-running match safely.
- **O(n²)** — fine at hackathon scale (≤ 50 RSVPs per event).
- **No persistence** — caller loads `history` from the DB (`group_members ⨝ groups ⨝ events` where `events.starts_at < now()`) and passes it in.

### Test plan (`shared/matching.test.ts`)

- Two perfectly-aligned users + four random → those two land in the same group.
- History penalty splits a previously-paired duo when an equally-good alternative exists.
- 7 users, sizeMin=4, sizeMax=6 → one group of 6, one leftover (correctly dropped).
- Stable output across 100 shuffles of the input array.

---

## 11. Email Flow (Resend + iron rule)

`supabase/functions/send-reveals/` (Lane E, Week 2). Required behavior:

1. Admin clicks "Send reveals"
2. For each `(group, user)` pair:
   - Insert `email_sends` row, status `pending`
   - Call Resend
   - Update row to `sent` (or `failed` with error)
3. **Only when every row succeeds**, set `events.reveal_sent_at = now()`
4. Re-invocation skips `sent` rows, retries `failed`

Ships with a regression test at `tests/send-reveals.test.ts` covering: partial-failure resume, double-invocation idempotency, and Resend 4xx vs 5xx handling.

---

## 12. Trust & Safety

- Founder reviews every signup (`users.status = 'pending_review'` → `'approved'`)
- Report button on member cards inserts `user_reports`, emails founder
- No automated bans in V1; manual handling at <50 users
- All AI-suggested activities (Path A) and discovered events (Explore) gated through admin review before going live to users
- Scraper respects robots.txt and uses public APIs only; no credential-based scraping

---

## 13. Future Mobile Path

Out of scope for this month. After hackathon:
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init` + `npx cap add ios` + `npx cap add android`
3. `npm run build && npx cap sync`
4. Open in Xcode / Android Studio → ship

The same React app runs inside a native WebView. Native plugins (push, camera) drop in when needed. Estimated effort post-hackathon: 2–3 days for iOS + Android wraps. No rewrite.

---

## 14. Repo Layout Reference

```
.
.                                 ← target layout; nothing scaffolded yet
├── web/                          ← Vite + React app
│   ├── src/
│   │   ├── pages/                ← route entry points
│   │   ├── components/           ← shadcn primitives + feature components
│   │   ├── hooks/                ← all data access (useEvents, useChat, ...)
│   │   └── lib/                  ← supabase client, auth, helpers
│   └── package.json
├── supabase/
│   ├── migrations/               ← SQL files
│   ├── functions/                ← Edge Functions (Deno)
│   │   ├── match/
│   │   ├── send-reveals/
│   │   ├── cancel/
│   │   ├── resend-webhook/
│   │   ├── send-pushes/
│   │   ├── suggest-activity/
│   │   └── discover-events/
│   └── seed.sql
├── shared/                       ← runtime-agnostic TS
│   ├── matching.ts               ← THE algorithm
│   ├── signed-token.ts           ← HMAC for cancel links
│   └── types/                    ← DB types, API types
├── emails/                       ← React Email templates
├── tests/                        ← Vitest (matching, send-reveals iron-rule)
├── README.md
└── ARCHITECTURE.md               ← this file
```

---

## 15. The North Star

Build a website where:
- A user can sign up, take a quiz, and meet 4–5 strangers at a real Auckland event in under 3 minutes of effort
- A founder can run the entire event lifecycle from one admin page
- The Explore feed makes Auckland's social scene legible and creates a partnership funnel
- The AI features (surprise matching, discovered events) make Timeleft feel *alive*, not just a form

If the demo can show all four, we win.
