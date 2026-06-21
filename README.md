# Side Quest

Weekly activity-based friend matching for Auckland newcomers. An AI concierge matches you into a small group, books the activity, and hosts the chat.

## Stack

- **Next.js 15** (App Router) on Vercel
- **Aurora PostgreSQL Serverless v2** + pgvector via RDS Data API
- **Clerk** auth · **Stripe** subscriptions (test mode)
- **Bedrock Titan** embeddings · **Claude** concierge (Vercel AI SDK)

## Local setup

```bash
cp .env.example .env.local
# Fill in Aurora, Clerk, Stripe, Anthropic, AWS credentials

npm install
npx dotenv -e .env.local -- drizzle-kit push   # apply schema
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run seed` | Seed synthetic Auckland users (requires Task 8 seed script) |

## Golden path (demo)

1. Sign up at `/sign-up` (Clerk)
2. Complete onboarding + quiz → profile embedding stored
3. `/finding` → click **Run matching (demo)**
4. `/group/[id]` → see members, rationale, icebreakers, venue
5. **Confirm my seat** → Stripe test card `4242 4242 4242 4242`
6. `/chat/[id]` → agent welcome + icebreakers
7. `/survey/[id]` → post-event feedback re-tunes next match
8. `/admin` + `/admin/agents` → matching + agent trace views

## Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Deploy (Vercel)

1. Push to GitHub and import to Vercel
2. Set all env vars from `.env.example`
3. Co-locate function region with Aurora region
4. Add Stripe webhook endpoint for production URL

See [docs/architecture-diagram.md](docs/architecture-diagram.md) for system architecture.

## Hackathon submission notes

- **AWS DB:** Aurora PostgreSQL Serverless v2 with Data API + pgvector (not Neon/Vercel Postgres)
- **Embeddings:** Bedrock `amazon.titan-embed-text-v2:0` (1024-dim)
- Capture AWS console screenshot of Aurora cluster for submission
