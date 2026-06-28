# Side Quest

Weekly friend matching for people new to a city — one curated activity, a party of six, icebreakers before you meet.

---

## What it does

1. **Vibe quiz** → profile embedding (Bedrock Titan → Aurora pgvector)
2. **Matching** → party of six for this week’s activity
3. **Group reveal** → venue, rationale, icebreakers
4. **Party chat** → concierge welcome + messages in Aurora
5. **Explore** → optional open quests (client-side for the demo)
6. **Survey** → feedback improves next week’s match

---

## Try the app

**Demo (no account):** set `NEXT_PUBLIC_DEMO_MODE=1` and `NEXT_PUBLIC_PAYMENTS_DISABLED=1`, then **Sign in** → **Explore demo as guest →**.

**Full flow:** sign up with Clerk → onboarding + quiz → **Finding** → group reveal → confirm seat → home, chat, explore.

---

## Run locally

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Fill in Aurora, Clerk, and AWS credentials in `.env.local`. Use `npm run check:aws` and `npm run seed:local` if Bedrock is rate-limited.

---

## Stack

Next.js 16 · React 19 · Vercel · Clerk · **Amazon Aurora PostgreSQL Serverless v2** (RDS Data API, pgvector) · Bedrock Titan embeddings · Stripe (optional)

UI patterns: [design-guidelines.md](design-guidelines.md)
