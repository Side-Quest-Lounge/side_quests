# Side Quest — Architecture

## Overview

Side Quest is a weekly activity-based friend-matching app for Auckland newcomers. An AI concierge matches users into groups of ~6 using pgvector semantic similarity, books a venue, and hosts the group chat.

## System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Next.js 15 App Router)              │
├─────────────────────────────────────────────────────────────────┤
│  Pages: landing · onboarding · quiz · finding · reveal · chat   │
│  API Routes:                                                    │
│    /api/match        pgvector kNN + buildGroups                 │
│    /api/agent/reveal Claude rationale + icebreakers + venue     │
│    /api/agent/host   welcome messages + icebreakers in chat     │
│    /api/stripe/*     Checkout + webhook                         │
│    /api/survey       post-event feedback → re-embed profile     │
│    /api/admin/*      read-only demo views                       │
├─────────────────────────────────────────────────────────────────┤
│  Clerk (auth)          Stripe (subscriptions, test mode)        │
└────────────┬───────────────────────────────┬────────────────────┘
             │ RDS Data API (HTTP)           │ Bedrock Titan
             ▼                               ▼
┌────────────────────────────┐    ┌──────────────────────────────┐
│ Aurora PostgreSQL Serverless│    │ amazon.titan-embed-text-v2  │
│ v2 + pgvector (1024-dim)   │    │ 1024-dim profile embeddings  │
│                            │    └──────────────────────────────┘
│ users · profiles · venues  │
│ events · groups · messages │
│ surveys · agent_traces     │
└────────────────────────────┘
             │
             ▼
┌────────────────────────────┐
│ Anthropic Claude (via       │
│ Vercel AI SDK) — concierge  │
│ rationale + icebreakers     │
└────────────────────────────┘
```

## Data flow (golden path)

1. **Onboarding** — Clerk sign-up → vibe quiz → Bedrock Titan embeds profile → `profiles.embedding`
2. **Matching** — pgvector cosine kNN finds 30 nearest candidates → `buildGroups` picks 6 → persist `groups` + `group_members`
3. **Reveal** — Claude generates plain-language rationale + 3 icebreakers; `bookVenue` picks venue; event updated
4. **Paywall** — Stripe Checkout → webhook sets `subscription_status = active`
5. **Chat** — agent host posts welcome + icebreakers; users poll messages every 3s
6. **Survey** — vibe score + open text → update `preferences` + re-embed for next match

## Key design decisions

| Concern | Choice |
|---------|--------|
| Database | Aurora PostgreSQL Serverless v2 with Data API (required AWS resource) |
| ORM access | Drizzle via `aws-data-api/pg` — no connection pooling |
| Matching | pgvector HNSW index, cosine distance, anchor user + top-5 by score |
| Embeddings | Bedrock Titan v2, 1024 dimensions |
| AI reasoning | Claude via Vercel AI SDK `generateObject` |
| Chat | DB-backed with 3s polling (no WebSocket infra) |

## Submission artifacts

- AWS console screenshot of Aurora cluster (Data API enabled)
- This architecture diagram
- Vercel deployment URL
- Note: Aurora PostgreSQL + Vercel Team ID
