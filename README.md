# Side Quest

Weekly activity-based friend matching for Auckland newcomers. An AI concierge matches you into a small group, books the activity, and hosts the chat.

[Hackathon — Building Agents for Real-World Challenges](https://xprize.devpost.com/)

**New to the codebase?** Start with [docs/MAINTAINER.md](docs/MAINTAINER.md).

## Stack

- **Next.js 16** (App Router) on Vercel
- **Aurora PostgreSQL Serverless v2** + pgvector via RDS Data API
- **Clerk** auth · **Stripe** subscriptions (test mode)
- **Bedrock Titan** embeddings · **Claude** concierge (Vercel AI SDK)

## Local setup

```bash
cp .env.example .env.local
# Fill in Aurora, Clerk, Stripe, Anthropic, AWS credentials

npm install
npm run db:migrate
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run db:migrate` | Apply schema to Aurora |
| `npm run seed` | Seed ~40 synthetic users + open event (Bedrock) |
| `npm run check:aws` | Smoke-test Aurora + Bedrock env |

## Golden path (real auth)

1. Sign up → onboarding → quiz (stores embedding)
2. `/finding` → **Find my party** → match + reveal
3. `/group/[id]` → confirm seat (Stripe test card `4242…`)
4. `/chat/[id]` → party chat
5. `/survey/[id]` → feedback updates embedding

**Demo / judges:** set `NEXT_PUBLIC_DEMO_MODE=1` — no sign-in, mock data. See [docs/MAINTAINER.md](docs/MAINTAINER.md).

## Deploy (Vercel)

1. Push to GitHub and import to Vercel
2. Set all env vars from `.env.example`
3. Set function region near Aurora (e.g. `ap-southeast-2` / Sydney)
4. Run `npm run db:migrate` and `npm run seed` against production Aurora
5. Verify `GET /api/health` on your deploy URL
6. Add Stripe webhook → `https://your-app.vercel.app/api/stripe/webhook`

See [docs/architecture-diagram.md](docs/architecture-diagram.md) for system architecture.

## Hackathon submission notes

- **AWS DB:** Aurora PostgreSQL Serverless v2 with Data API + pgvector
- **Embeddings:** Bedrock `amazon.titan-embed-text-v2:0` (1024-dim)
- Capture AWS console screenshot of Aurora cluster for submission
