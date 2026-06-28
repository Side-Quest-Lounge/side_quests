# Side Quest — Setup checklist

Things **you** need to do to get the app running and ready to submit.  
The code is mostly built — this is about connecting the services.

---

## 1. Database (AWS Aurora)

- [ ] Create an **Aurora PostgreSQL Serverless v2** cluster in AWS
- [ ] Turn on **RDS Data API** for the cluster
- [ ] Enable the **pgvector** extension (in RDS Query Editor):
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- [ ] Copy these into `.env.local`:
  - `AWS_REGION`
  - `AURORA_CLUSTER_ARN`
  - `AURORA_SECRET_ARN`
  - `AURORA_DATABASE`
  - `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (for Data API + Bedrock)
- [ ] Push the database schema:
  ```bash
  npx dotenv -e .env.local -- drizzle-kit push
  ```
- [ ] Create the vector index (in RDS Query Editor):
  ```sql
  CREATE INDEX IF NOT EXISTS profiles_embedding_hnsw
  ON profiles USING hnsw (embedding vector_cosine_ops);
  ```

---

## 2. Auth (Clerk)

- [ ] Create a free app at [clerk.com](https://clerk.com)
- [ ] Add keys to `.env.local`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- [ ] In Clerk dashboard, set sign-in / sign-up URLs to match your app (e.g. `http://localhost:3000` for local dev)
- [ ] (Optional) Add your Clerk user ID to `ADMIN_USER_IDS` in `.env.local` so you can open `/admin`

---

## 3. AI (AWS Bedrock)

- [ ] In AWS, make sure your IAM user/role can call **Bedrock Titan** (`amazon.titan-embed-text-v2:0`) — used when users complete the quiz and update their profile
- [ ] (Future) Claude for live chat concierge — not required for hackathon build

---

## 4. Payments (Stripe — test mode)

- [ ] Create a Stripe account and stay in **test mode**
- [ ] Create a recurring **Price** (~$25/mo) and copy the Price ID → `NEXT_PUBLIC_STRIPE_PRICE_ID`
- [ ] Add to `.env.local`:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (from Stripe CLI or dashboard webhook)
- [ ] For local testing, forward webhooks:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- [ ] Test card: `4242 4242 4242 4242`

---

## 5. Seed data (so matching works)

Matching needs **other users** in the database — otherwise you can’t form a group of 6.

- [ ] Add ~40 fake Auckland users + venues + one open event (seed script — not done yet)
- [ ] Or manually insert a few test users with profile embeddings until seeding exists

---

## 6. Run locally

- [ ] Copy env file: `cp .env.example .env.local` and fill everything in
- [ ] Install + start:
  ```bash
  npm install
  npm run dev
  ```
- [ ] Open [http://localhost:3000](http://localhost:3000)

**You only run one command** — `npm run dev`. There is no separate backend server.  
API routes and pages run together; the database lives on AWS.

---

## 7. Test the full flow

- [ ] Sign up / sign in (Clerk)
- [ ] Complete onboarding + vibe quiz (saves profile + embedding to Aurora)
- [ ] Go to **Finding** → run matching
- [ ] View your **group reveal** (members, rationale, venue)
- [ ] **Confirm seat** via Stripe checkout
- [ ] Open **group chat** (agent welcome + icebreakers)
- [ ] Submit **survey** after the event
- [ ] Check **/admin** and **/admin/agents** for matching + agent logs

---

## 8. Deploy (Vercel)

- [ ] Push repo to GitHub
- [ ] Import project on [vercel.com](https://vercel.com)
- [ ] Add **all** env vars from `.env.local` in Vercel project settings
- [ ] Set function region close to your Aurora region (lower latency)
- [ ] Add production Stripe webhook → `https://your-app.vercel.app/api/stripe/webhook`
- [ ] Smoke-test the golden path on the live URL

---

## 9. Hackathon submission

**Full playbook:** [`docs/SUBMISSION.md`](docs/SUBMISSION.md) — Devpost checklist, demo script, env vars, smoke test.

Quick checklist from `hackathon_info.md`:

- [ ] Text description (mention **Aurora PostgreSQL** + Data API + pgvector) — copy from [`docs/DEVPOST_DESCRIPTION.md`](docs/DEVPOST_DESCRIPTION.md)
- [ ] Demo video (< 3 min) — use script in `docs/SUBMISSION.md`
- [ ] Published **Vercel project link** + **Vercel Team ID**
- [ ] **Architecture diagram** → `docs/architecture-diagram.md` (export PNG)
- [ ] **AWS screenshot** — Aurora console (Data API enabled)

**Before recording:** deploy latest code, set `NEXT_PUBLIC_PAYMENTS_DISABLED=1` on Vercel, run golden path on live URL.

---

## Quick reference — what runs where

| Piece | Where it lives |
|--------|----------------|
| Website + API (`/api/*`) | Next.js on your machine or Vercel |
| Database | AWS Aurora (always remote) |
| Login | Clerk (hosted) |
| Checkout | Stripe (hosted) |
| Profile embeddings | AWS Bedrock Titan |
| Group reveal text | Template + rule-based venue pick |
