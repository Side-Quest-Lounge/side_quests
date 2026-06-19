# Design Spec — Activity-Based Friend-Matching App (working name TBD)

## Context

People aged 20–35 in Auckland — especially newcomers, working-holiday arrivals, and recent
movers — struggle to make friends: not enough events, and even at events there's no structure
for real conversation. Timeleft proved the model (dinner with 5 strangers, algorithm-matched →
~€18M ARR, 150k monthly participants, 200+ cities). Our wedge improves on it: **a shared
activity instead of a dinner** (a task to do together removes the stare-across-the-table
pressure) and **an explainable AI concierge** that matches, books, and hosts the group.

This is a hackathon submission (Track 1: monetizable B2C). It must use an AWS database
(**Aurora PostgreSQL + pgvector**) and deploy on **Vercel**. Judged on technological
craftsmanship, design, real-world impact, and originality.

**This is a from-scratch rebuild.** All existing files are discarded (see "Clean slate" below),
including the prior design system — we build a **new visual identity** and a **simple, literal
UX** (no metaphor).

## Product decisions (locked via brainstorming)

1. **Format:** One weekly **signature ritual** = the density floor (everyone funnels in).
   Optional opt-in later: an **agent-assigned rotating activity** ("surprise us").
2. **Audience:** Open 20–35; marketing leads with newcomers/WHV/recent-movers.
3. **Edge:** Activity > dinner (shared task kills the awkward-stare problem) + explainable AI concierge.
4. **Agent:** Full concierge + chat host — composes the group and explains its picks **plainly**,
   books venue/time, hosts the group chat (welcome, tailored icebreakers, nudges quiet members).
5. **UX:** **Simple & literal** — a straightforward "your group this week" flow. No orbit/pull/
   crystallize metaphor. Agent states its reasoning in plain language.
6. **Monetization:** Subscription (~$25/mo), Stripe **test-mode** paywall gating the confirmed seat.

## Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 App Router | One Vercel deploy; server routes for agent (stream + hide keys) |
| DB | Aurora PostgreSQL Serverless v2 + pgvector | Required AWS DB; relational core + semantic match |
| DB access | Drizzle ORM via **RDS Data API** (`aws-data-api/pg`) | HTTP, **no connection pooling** to manage |
| AI reasoning | Vercel AI SDK + **Claude** (latest id per `claude-api` skill) | Tool-calling concierge |
| Embeddings | **Bedrock Titan** `titan-embed-text-v2` (1024-dim) | All-in-AWS, IAM auth |
| Auth | **Clerk** | Vercel Marketplace, auto-wired env vars, hosted UI |
| Payments | **Stripe** Checkout (test mode) | Paywall demo + webhook |
| Chat | DB + short polling | No realtime infra for v1 |
| Design | **New visual identity (TBD)** | Use `frontend-design` skill at build time |

### Gotchas baked in
- Aurora must be a **real AWS resource** with the **Data API enabled** — Vercel Marketplace
  "Postgres" is Neon and would NOT satisfy the requirement.
- Embeddings generated on quiz submit + survey update, written to `profiles.embedding`.
- Submission needs an AWS-console screenshot of the Aurora resource + an architecture diagram.

## Architecture

```
Next.js (Vercel)
  ├─ App Router pages (new visual identity)
  ├─ Route Handlers / Server Actions
  │     ├─ /api/agent/*   Vercel AI SDK + Claude (tool-calling concierge + chat host)
  │     ├─ /api/match     weekly matching round (pgvector kNN + group constraints)
  │     └─ /api/stripe/*  Checkout + webhook (test mode)
  ├─ Auth: Clerk middleware
  └─ DB: Drizzle ORM via RDS Data API driver (HTTP, no pooling)
        └─ Aurora PostgreSQL Serverless v2 (Data API enabled) + pgvector
              └─ Bedrock Titan for embeddings (server-side, IAM)
```

Agent tools (Claude, via AI SDK tool calling): `searchCandidates` (pgvector kNN),
`composeGroup`, `explainPicks` (plain rationale), `bookVenue` (reads `venues`),
`postChatMessage` / `postIcebreakers`. Every tool call is logged to `agent_traces`.

## Data model (Aurora PostgreSQL + pgvector)

- `users` — id (Clerk id), name, bio, city, joined_at, is_newcomer, subscription_status
- `profiles` — user_id, quiz answers (jsonb), `embedding vector(1024)` (pgvector hnsw index)
- `preferences` — user_id, likes[], dislikes[] (lightweight tuning signals)
- `venues` — id, name, activity_type, address, capacity, slots
- `events` — id, week_of, format (signature|rotating), activity, venue_id, starts_at, status
- `groups` — id, event_id, status (forming|matched|confirmed|completed), agent_rationale
- `group_members` — group_id, user_id, match_score
- `messages` — id, group_id, author (user_id | 'agent'), body, created_at
- `surveys` — id, group_id, user_id, vibe_score, open_text  → re-tunes `profiles.embedding`/`preferences`
- `agent_traces` — id, user_id, tool, args, result, at  (surfaced in `/admin/agents`)

Relational core + pgvector semantic matching is the "deliberate data model" story for judges.

## Golden path (the demo / 3-min video arc)

1. Landing → sign up (Clerk) as a newcomer.
2. Onboarding + vibe quiz → AI route generates the Titan **profile embedding**.
3. "**Finding your group this week**" state (matching pending).
4. Trigger matching round → group forms (pgvector kNN + constraints, size ~6).
5. **Paywall:** Stripe Checkout (test) to confirm the seat → `subscription_status` active.
6. **Match reveal:** your group this week — members, the agent's **plain rationale**, tailored
   icebreakers, venue + time (agent booked).
7. **Group chat:** agent host posts welcome + icebreakers, nudges a quiet member.
8. **Post-event survey** → updates the agent; visibly shifts the next match.
9. **Admin:** matching-round view + `/admin/agents` tool-call trace — proves agent + DB.

## Clean slate (what to delete, what to keep)

- **Delete:** `web/` (Vite SPA), `prototype/` (unrelated sales-training ADK code),
  `design-system/`, `ARCHITECTURE.md`, `.DS_Store`.
- **Keep:** git history, `hackathon_info.md`.
- **Create:** fresh Next.js app at repo root (or `app/`), new design identity, new schema/migrations.

## Build order (high level — `writing-plans` will detail steps)

1. Scaffold Next.js + Clerk + Drizzle (Data API) + Aurora schema/migrations + pgvector.
2. New visual identity + core pages (landing, onboarding, quiz, finding, reveal, chat, survey).
3. Embeddings on quiz submit (Titan) → `profiles.embedding`.
4. Matching round (`/api/match`) + synthetic-user seeding (~30–50 Auckland profiles) so a solo
   demoer forms a real group — essential to avoid the cold-start demo trap.
5. Agent concierge + chat host (Claude tool calling) + `agent_traces`.
6. Stripe test-mode subscription paywall + webhook.
7. Post-event survey → embedding/preference update loop.
8. Admin views; deploy to Vercel; capture AWS screenshot + architecture diagram.

## Scope discipline (hackathon)
- **Must-have:** golden path 1–9 end-to-end with real DB + real agent + seeded users.
- **Nice-to-have (cut if needed):** rotating-activity opt-in, realtime chat (polling is fine),
  multi-city, social login beyond email.
- **Open item (non-blocking):** product name + the new visual identity direction.

## Verification
- `npm run dev`; walk the full golden path locally against Aurora (or local Postgres+pgvector for dev).
- Matching: run the round with seeded users; assert a ~6-person group forms with non-empty
  rationale + match scores; confirm rows in `groups`/`group_members`.
- Agent: confirm tool calls land in `agent_traces`; icebreakers/messages appear in chat.
- Stripe: test-card checkout flips `subscription_status` to active via webhook.
- Survey: submit → confirm `profiles.embedding`/`preferences` change and the next match differs.
- Deploy to Vercel; capture AWS-console screenshot of the Aurora resource + architecture diagram.
