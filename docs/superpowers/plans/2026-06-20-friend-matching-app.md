# Activity-Based Friend-Matching App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a weekly activity-based friend-matching web app where an explainable AI concierge matches strangers into groups of ~6, books the activity, and hosts the group chat — deployed on Vercel with Aurora PostgreSQL + pgvector.

**Architecture:** Next.js 15 App Router on Vercel. Aurora PostgreSQL Serverless v2 (pgvector) accessed over the RDS Data API via Drizzle's `aws-data-api/pg` driver (HTTP, no pooling). Clerk for auth. Vercel AI SDK + Claude for the tool-calling concierge; Bedrock Titan for profile embeddings. Stripe Checkout (test mode) for the subscription paywall. DB-backed chat with short polling.

**Tech Stack:** Next.js 15, TypeScript (strict), Drizzle ORM + `@aws-sdk/client-rds-data`, `@aws-sdk/client-bedrock-runtime`, Clerk, Vercel AI SDK (`ai`, `@ai-sdk/anthropic`), Stripe, Vitest.

## Global Constraints

- **AWS DB:** Aurora PostgreSQL Serverless v2 with **Data API enabled** and **pgvector**. NOT Vercel/Neon Postgres — the hackathon requires a real AWS Aurora resource.
- **DB access:** Drizzle via RDS Data API driver only (`drizzle-orm/aws-data-api/pg`). No direct `pg`/pooled connections.
- **Embeddings:** Bedrock `amazon.titan-embed-text-v2:0`, **1024 dimensions**. `profiles.embedding` is `vector(1024)`.
- **AI model:** Anthropic Claude — use the latest model id; confirm via the `claude-api` skill before wiring (do not hardcode an outdated id).
- **TypeScript:** strict mode on. Functional, early returns, no comments unless WHY is non-obvious.
- **Secrets:** never commit `.env*`. All keys via env vars.
- **Deploy target:** Vercel; functions region co-located with the Aurora region to cut Data API latency.
- **Demo dependency:** the city must be pre-seeded with ~30–50 synthetic users or a solo demoer can never form a group.

---

### Task 1: Clean slate + Next.js scaffold

**Files:**
- Delete: `web/`, `prototype/`, `design-system/`, `ARCHITECTURE.md`, `.DS_Store`
- Create: Next.js app at repo root (`package.json`, `next.config.ts`, `tsconfig.json`, `app/`, `.gitignore`, `.env.example`)

**Interfaces:**
- Produces: a running `next dev` app at `/`; `npm run lint`, `npm run build` work.

- [ ] **Step 1: Remove old code**

```bash
cd /Users/alexxie/Documents/personal_project/side_quest
git rm -r web prototype design-system ARCHITECTURE.md 2>/dev/null; rm -f .DS_Store
```

- [ ] **Step 2: Scaffold Next.js at repo root**

```bash
npx create-next-app@latest . --ts --app --eslint --src-dir --import-alias "@/*" --no-tailwind --use-npm
```
(Answer "yes" to proceed in a non-empty dir; keep `hackathon_info.md` and `docs/`.)

- [ ] **Step 3: Add Vitest**

```bash
npm i -D vitest @vitejs/plugin-react
```
Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], test: { environment: "node" } });
```
Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Verify dev + build**

Run: `npm run dev` (open http://localhost:3000), then `npm run build`.
Expected: default Next page renders; build passes.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: clean slate, scaffold Next.js app"
```

---

### Task 2: Provision Aurora (Data API + pgvector) and wire env

**Files:**
- Modify: `.env.example`, `.env.local` (local only, gitignored)

**Interfaces:**
- Produces: env vars `AWS_REGION`, `AURORA_CLUSTER_ARN`, `AURORA_SECRET_ARN`, `AURORA_DATABASE`. Aurora reachable via Data API.

> Infra task — verification is a successful Data API call, not a unit test.

- [ ] **Step 1: Create the Aurora cluster (AWS console or CLI)**

Create an **Aurora PostgreSQL Serverless v2** cluster, enable **Data API** (RDS → cluster → Modify → "Enable RDS Data API"), and store the master credentials in a Secrets Manager secret. Note the cluster ARN, secret ARN, region, and DB name.

- [ ] **Step 2: Enable pgvector**

In the RDS Query Editor (Data API) run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

- [ ] **Step 3: Record env**

`.env.example`:
```
AWS_REGION=ap-southeast-2
AURORA_CLUSTER_ARN=
AURORA_SECRET_ARN=
AURORA_DATABASE=friendmatch
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID=
```
Copy to `.env.local` and fill real values (test keys for Stripe).

- [ ] **Step 4: Smoke-test the Data API**

```bash
aws rds-data execute-statement --resource-arn "$AURORA_CLUSTER_ARN" \
  --secret-arn "$AURORA_SECRET_ARN" --database "$AURORA_DATABASE" \
  --sql "SELECT extname FROM pg_extension WHERE extname='vector';"
```
Expected: a row with `vector`.

- [ ] **Step 5: Commit**

```bash
git add .env.example && git commit -m "chore: aurora data api env scaffolding"
```

---

### Task 3: Drizzle schema + Data API client + migrations

**Files:**
- Create: `src/db/client.ts`, `src/db/schema.ts`, `drizzle.config.ts`
- Test: `src/db/schema.test.ts`

**Interfaces:**
- Produces: `db` (Drizzle Data API instance) from `src/db/client.ts`; table objects (`users`, `profiles`, `preferences`, `venues`, `events`, `groups`, `groupMembers`, `messages`, `surveys`, `agentTraces`) from `src/db/schema.ts`.

- [ ] **Step 1: Install deps**

```bash
npm i drizzle-orm @aws-sdk/client-rds-data
npm i -D drizzle-kit
```

- [ ] **Step 2: Data API client**

`src/db/client.ts`:
```ts
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import * as schema from "./schema";

const rds = new RDSDataClient({ region: process.env.AWS_REGION! });

export const db = drizzle(rds, {
  database: process.env.AURORA_DATABASE!,
  resourceArn: process.env.AURORA_CLUSTER_ARN!,
  secretArn: process.env.AURORA_SECRET_ARN!,
  schema,
});
```

- [ ] **Step 3: Schema**

`src/db/schema.ts` — define all tables per the spec data model. Use a custom `vector(1024)` column:
```ts
import { pgTable, text, timestamp, integer, real, jsonb, uuid, boolean, customType } from "drizzle-orm/pg-core";

const vector1024 = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1024)",
  toDriver: (v) => `[${v.join(",")}]`,
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  name: text("name").notNull(),
  bio: text("bio"),
  city: text("city").notNull().default("Auckland"),
  isNewcomer: boolean("is_newcomer").notNull().default(false),
  subscriptionStatus: text("subscription_status").notNull().default("none"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  answers: jsonb("answers").$type<Record<string, number | string>>().notNull(),
  embedding: vector1024("embedding"),
});

export const preferences = pgTable("preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  likes: jsonb("likes").$type<string[]>().notNull().default([]),
  dislikes: jsonb("dislikes").$type<string[]>().notNull().default([]),
});

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  activityType: text("activity_type").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull().default(6),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekOf: text("week_of").notNull(),
  format: text("format").notNull().default("signature"),
  activity: text("activity"),
  venueId: uuid("venue_id").references(() => venues.id),
  startsAt: timestamp("starts_at"),
  status: text("status").notNull().default("open"),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  status: text("status").notNull().default("forming"), // forming|matched|confirmed|completed
  agentRationale: text("agent_rationale"),
});

export const groupMembers = pgTable("group_members", {
  groupId: uuid("group_id").notNull().references(() => groups.id),
  userId: text("user_id").notNull().references(() => users.id),
  matchScore: real("match_score").notNull().default(0),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  author: text("author").notNull(), // user id or 'agent'
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const surveys = pgTable("surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  userId: text("user_id").notNull().references(() => users.id),
  vibeScore: integer("vibe_score").notNull(),
  openText: text("open_text"),
});

export const agentTraces = pgTable("agent_traces", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  tool: text("tool").notNull(),
  args: jsonb("args"),
  result: jsonb("result"),
  at: timestamp("at").notNull().defaultNow(),
});
```

- [ ] **Step 4: drizzle-kit config + push schema**

`drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  driver: "aws-data-api",
  dbCredentials: {
    database: process.env.AURORA_DATABASE!,
    resourceArn: process.env.AURORA_CLUSTER_ARN!,
    secretArn: process.env.AURORA_SECRET_ARN!,
  },
});
```
Run: `npx dotenv -e .env.local -- drizzle-kit push` (install `dotenv-cli` if needed).
Then create the vector index via Data API:
```sql
CREATE INDEX IF NOT EXISTS profiles_embedding_hnsw
ON profiles USING hnsw (embedding vector_cosine_ops);
```

- [ ] **Step 5: Test schema shape**

`src/db/schema.test.ts`:
```ts
import { expect, test } from "vitest";
import { users, profiles, groups } from "./schema";
test("core tables expose expected columns", () => {
  expect(Object.keys(users)).toContain("subscriptionStatus");
  expect(Object.keys(profiles)).toContain("embedding");
  expect(Object.keys(groups)).toContain("agentRationale");
});
```
Run: `npm test -- schema` → PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: drizzle schema + data api client + migrations"
```

---

### Task 4: Clerk auth

**Files:**
- Create: `src/middleware.ts`, `src/app/layout.tsx` (wrap with ClerkProvider), `src/lib/current-user.ts`
- Test: none (integration-only; verified by protected route)

**Interfaces:**
- Produces: `getOrCreateUser()` from `src/lib/current-user.ts` → returns the `users` row for the signed-in Clerk user, inserting it on first login.

- [ ] **Step 1: Install + configure**

```bash
npm i @clerk/nextjs
```
`src/middleware.ts`:
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/stripe/webhook"]);
export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});
export const config = { matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"] };
```

- [ ] **Step 2: Wrap layout**

In `src/app/layout.tsx`, wrap children in `<ClerkProvider>` and add `<SignInButton>`/`<UserButton>` in a header.

- [ ] **Step 3: getOrCreateUser helper**

`src/lib/current-user.ts`:
```ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const existing = await db.select().from(users).where(eq(users.id, userId));
  if (existing[0]) return existing[0];
  const cu = await currentUser();
  const row = { id: userId, name: cu?.firstName ?? "Friend", city: "Auckland" };
  await db.insert(users).values(row);
  return (await db.select().from(users).where(eq(users.id, userId)))[0];
}
```

- [ ] **Step 4: Verify**

Run dev, hit `/home` while signed out → redirected to Clerk sign-in; sign in → `users` row created (check via Data API `SELECT * FROM users`).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: clerk auth + getOrCreateUser"
```

---

### Task 5: Visual identity + base UI kit

**Files:**
- Create: `src/app/globals.css` (design tokens), `src/components/ui.tsx` (Button, Card, Pill, Avatar, Field), `src/app/page.tsx` (landing)

**Interfaces:**
- Produces: reusable components `<Button>`, `<Card>`, `<Pill>`, `<Avatar>`, `<Field>` and CSS variables for color/spacing/type.

> Use the `frontend-design` skill to choose a distinctive, non-templated identity (the old Fern/Fraunces system is discarded). Pick one type pairing, one accent, a calm palette. Keep it simple and intentional.

- [ ] **Step 1: Define tokens + base styles** in `globals.css` (color vars, spacing scale, font imports, base button/card/input classes).
- [ ] **Step 2: Build `src/components/ui.tsx`** with the five components above, typed props, using the tokens.
- [ ] **Step 3: Landing page** `src/app/page.tsx` — hero with the newcomer-led message ("New to Auckland? Meet your people this week."), one primary CTA → sign-up.
- [ ] **Step 4: Verify** the landing renders at `/` and is responsive at 375/768/1440.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: visual identity + ui kit + landing"`

---

### Task 6: Bedrock Titan embedding utility

**Files:**
- Create: `src/lib/embeddings.ts`
- Test: `src/lib/embeddings.test.ts`

**Interfaces:**
- Produces: `embedText(text: string): Promise<number[]>` → 1024-length vector; `profileToText(answers, bio): string`.

- [ ] **Step 1: Install**

```bash
npm i @aws-sdk/client-bedrock-runtime
```

- [ ] **Step 2: Write failing test for `profileToText`**

`src/lib/embeddings.test.ts`:
```ts
import { expect, test } from "vitest";
import { profileToText } from "./embeddings";
test("profileToText weaves answers and bio into one string", () => {
  const t = profileToText({ energy: 5, creative: 2 }, "love bouldering");
  expect(t).toContain("bouldering");
  expect(t).toContain("energy");
});
```
Run: `npm test -- embeddings` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/embeddings.ts`:
```ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION! });

export function profileToText(answers: Record<string, number | string>, bio?: string): string {
  const parts = Object.entries(answers).map(([k, v]) => `${k}: ${v}`);
  if (bio) parts.push(`bio: ${bio}`);
  return parts.join("; ");
}

export async function embedText(text: string): Promise<number[]> {
  const res = await client.send(new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({ inputText: text, dimensions: 1024, normalize: true }),
  }));
  const parsed = JSON.parse(new TextDecoder().decode(res.body));
  return parsed.embedding as number[];
}
```

- [ ] **Step 4: Run unit test** → PASS. (Live `embedText` verified in Task 8 seeding.)
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: titan embedding utility"`

---

### Task 7: Onboarding + vibe quiz → persist profile + embedding

**Files:**
- Create: `src/app/onboarding/page.tsx`, `src/app/quiz/page.tsx`, `src/lib/quiz.ts` (questions), `src/app/api/profile/route.ts`

**Interfaces:**
- Consumes: `embedText`, `profileToText`, `getOrCreateUser`.
- Produces: POST `/api/profile` body `{ name, bio, answers }` → upserts `users`, `profiles` (with embedding); redirects to `/finding`.

- [ ] **Step 1: Quiz content** `src/lib/quiz.ts` — export `quizQuestions: { id: string; text: string }[]` (10 Likert questions across energy/creativity/spontaneity/talkativeness/etc.).
- [ ] **Step 2: Onboarding page** — name + short bio + "newcomer?" toggle → stores in client state, routes to `/quiz`.
- [ ] **Step 3: Quiz page** — one question per step, Likert 1–5, progress bar; on finish POST to `/api/profile`.
- [ ] **Step 4: API route** `src/app/api/profile/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { embedText, profileToText } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { name, bio, isNewcomer, answers } = await req.json();
  await db.update(users).set({ name, bio, isNewcomer }).where(eq(users.id, user.id));
  const embedding = await embedText(profileToText(answers, bio));
  await db.insert(profiles).values({ userId: user.id, answers, embedding })
    .onConflictDoUpdate({ target: profiles.userId, set: { answers, embedding } });
  return NextResponse.json({ ok: true });
}
```
- [ ] **Step 5: Verify** complete onboarding→quiz as a signed-in user; confirm a `profiles` row with a 1024-length embedding via Data API.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: onboarding + quiz + profile embedding"`

---

### Task 8: Seed synthetic Auckland users

**Files:**
- Create: `scripts/seed.ts`, `src/lib/seed-data.ts` (40 persona definitions)

**Interfaces:**
- Produces: `npm run seed` → inserts ~40 `users` + `profiles` (real Titan embeddings) + a current open `events` row + `venues`.

- [ ] **Step 1: Persona data** `src/lib/seed-data.ts` — 40 varied personas `{ name, bio, answers }` spanning activity tastes and energy levels.
- [ ] **Step 2: Seed script** `scripts/seed.ts` — for each persona: insert user (id `seed_<n>`), embed `profileToText`, insert profile; insert ~6 venues (bouldering gym, pottery studio, mini-golf, trivia bar, cooking school, hiking meetup); insert one `events` row for the current week (`status: 'open'`, `format: 'signature'`).
- [ ] **Step 3: Script runner** add `"seed": "tsx scripts/seed.ts"`; `npm i -D tsx`. Run `npx dotenv -e .env.local -- npm run seed`.
- [ ] **Step 4: Verify** `SELECT count(*) FROM profiles WHERE embedding IS NOT NULL;` ≥ 40.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: synthetic user + venue + event seeding"`

---

### Task 9: Matching round (pgvector kNN + group constraints)

**Files:**
- Create: `src/lib/matching.ts`, `src/app/api/match/route.ts`
- Test: `src/lib/matching.test.ts`

**Interfaces:**
- Consumes: `db`, schema tables.
- Produces: `buildGroups(candidates, seedUserId, size=6): { userId; matchScore }[]` (pure, testable); POST `/api/match` runs a round for the current open event, persists `groups` + `group_members` (status `matched`), returns the signed-in user's group id.

- [ ] **Step 1: Failing test for `buildGroups`**

`src/lib/matching.test.ts`:
```ts
import { expect, test } from "vitest";
import { buildGroups } from "./matching";
test("builds a group anchored on the seed user, capped at size", () => {
  const cands = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, score: 1 - i * 0.01 }));
  const g = buildGroups(cands, "u0", 6);
  expect(g).toHaveLength(6);
  expect(g[0].userId).toBe("u0");
  expect(g.every(m => typeof m.matchScore === "number")).toBe(true);
});
```
Run → FAIL.

- [ ] **Step 2: Implement `buildGroups`** (pure): put the anchor first (score 1), take top `size-1` remaining by score, map to `{ userId, matchScore }`.
- [ ] **Step 3: Run unit test** → PASS.
- [ ] **Step 4: API route** — fetch the signed-in user's embedding, run a pgvector cosine-distance kNN over `profiles` (exclude self, limit ~30), call `buildGroups`, insert a `groups` row (event = current open event, status `matched`) and `group_members`. kNN via raw SQL through Drizzle Data API:
```ts
// cosine distance: embedding <=> $1 ; lower = closer
const rows = await db.execute(sql`
  SELECT p.user_id, 1 - (p.embedding <=> ${toVec(self.embedding)}) AS score
  FROM profiles p WHERE p.user_id <> ${user.id}
  ORDER BY p.embedding <=> ${toVec(self.embedding)} LIMIT 30`);
```
(`toVec` formats `number[]` → `'[...]'::vector`.)
- [ ] **Step 5: Verify** POST `/api/match` after seeding → a `groups` row + 6 `group_members` with descending scores; rationale filled in Task 10.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: matching round with pgvector knn"`

---

### Task 10: Agent concierge — rationale, icebreakers, venue booking

**Files:**
- Create: `src/lib/agent.ts` (Claude client + tools), `src/lib/agent-tools.ts`, `src/app/api/agent/reveal/route.ts`
- Test: `src/lib/agent-tools.test.ts` (pure tool fns)

**Interfaces:**
- Consumes: `db`, Vercel AI SDK, `groups`/`group_members`/`venues`/`events`/`agentTraces`.
- Produces: `generateReveal(groupId): Promise<{ rationale; icebreakers; venue; startsAt }>` — Claude composes a plain-language rationale + 3 icebreakers, calls `bookVenue` to pick a venue/time; all tool calls logged to `agent_traces`. Persists rationale + event venue/time.

- [ ] **Step 1: Install AI SDK**

```bash
npm i ai @ai-sdk/anthropic zod
```
(Confirm the current Claude model id via the `claude-api` skill.)

- [ ] **Step 2: Pure tool fns + test** — `bookVenue(venues, activityPref)` picks a venue by activity fit + capacity; `pickStartTime(weekOf)` returns the signature slot (e.g. next Saturday 4pm). Test these directly.
- [ ] **Step 3: Agent route** `src/app/api/agent/reveal/route.ts` uses `generateText` with tools (`bookVenue`, `recordTrace`) and a system prompt instructing plain, warm rationale referencing real member bios; parse structured output (rationale + 3 icebreakers) via a `zod` schema / `generateObject`.
- [ ] **Step 4: Persist** rationale onto `groups.agentRationale`; venue/time onto the `events` row (or a per-group field); insert `agent_traces` rows for each tool call.
- [ ] **Step 5: Verify** call reveal for a matched group → non-empty rationale, 3 icebreakers, a chosen venue, and `agent_traces` rows.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: agent concierge reveal (rationale, icebreakers, venue)"`

---

### Task 11: Core app pages — Finding, Reveal

**Files:**
- Create: `src/app/finding/page.tsx`, `src/app/group/[id]/page.tsx`, `src/app/api/me/group/route.ts`

**Interfaces:**
- Consumes: matching + reveal APIs.
- Produces: `/finding` (matching-pending state with a "Run matching" trigger for the demo), `/group/[id]` (reveal: members, agent rationale, icebreakers, venue + time, CTA to chat / paywall).

- [ ] **Step 1: `/api/me/group`** returns the signed-in user's current group (+ members, rationale, venue) or `null`.
- [ ] **Step 2: `/finding`** polls `/api/me/group`; shows "Finding your group this week"; demo button POSTs `/api/match` then `/api/agent/reveal`; on group ready → routes to `/group/[id]`.
- [ ] **Step 3: `/group/[id]`** renders members (Avatar + name + "joined this week"), the agent rationale, 3 icebreakers, venue + time; primary CTA gated by subscription (Task 12).
- [ ] **Step 4: Verify** full flow signup→quiz→finding→reveal shows a real matched group with rationale.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: finding + group reveal pages"`

---

### Task 12: Stripe subscription paywall

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/subscription/route.ts`

**Interfaces:**
- Consumes: `users.subscriptionStatus`.
- Produces: POST `/api/stripe/checkout` → Checkout Session URL; webhook flips `subscriptionStatus` to `active` on `checkout.session.completed`. Reveal CTA ("Confirm my seat") gated until active.

- [ ] **Step 1: Install** `npm i stripe`. Create a test-mode recurring Price; set `NEXT_PUBLIC_STRIPE_PRICE_ID`.
- [ ] **Step 2: Checkout route** creates a subscription Checkout Session with `client_reference_id = user.id`, success → `/group/[id]`.
- [ ] **Step 3: Webhook route** (public, raw body) verifies signature, on `checkout.session.completed` sets `subscriptionStatus='active'` for `client_reference_id`.
- [ ] **Step 4: Gate** the reveal CTA: if not active → "Confirm my seat" opens Checkout; if active → "Open group chat".
- [ ] **Step 5: Verify** `stripe listen --forward-to localhost:3000/api/stripe/webhook`; pay with `4242 4242 4242 4242`; `subscriptionStatus` becomes `active`.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: stripe subscription paywall + webhook"`

---

### Task 13: Group chat with agent host

**Files:**
- Create: `src/app/chat/[id]/page.tsx`, `src/app/api/chat/[id]/route.ts`, `src/app/api/agent/host/route.ts`

**Interfaces:**
- Produces: GET/POST `/api/chat/[id]` (list/append messages); chat page polls every ~3s; agent host posts a welcome + icebreakers on first load and can nudge.

- [ ] **Step 1: Chat API** — GET returns messages since a cursor; POST appends a user message (author = user id). Membership-checked.
- [ ] **Step 2: Agent host** `/api/agent/host` — posts agent welcome + the 3 icebreakers (author `'agent'`) once per group; optional "nudge quiet member" action; logs to `agent_traces`.
- [ ] **Step 3: Chat page** — message list (agent messages styled distinctly), composer, 3s polling; triggers host welcome on first open.
- [ ] **Step 4: Verify** open chat → agent welcome + icebreakers appear; send a message → it persists and renders.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: group chat + agent host"`

---

### Task 14: Post-event survey → re-tune embedding

**Files:**
- Create: `src/app/survey/[id]/page.tsx`, `src/app/api/survey/route.ts`

**Interfaces:**
- Produces: POST `/api/survey` `{ groupId, vibeScore, openText }` → inserts `surveys`, appends `openText` signal to `preferences`, re-embeds the profile so the next match shifts.

- [ ] **Step 1: Survey page** — 1–5 vibe rating + one open text ("anything your agent should know?").
- [ ] **Step 2: Survey API** — insert survey; push parsed likes/dislikes into `preferences`; recompute `embedText(profileToText(answers, bio + ' ' + openText))` and update `profiles.embedding`.
- [ ] **Step 3: Verify** submit survey with a strong steer → embedding changes; re-running `/api/match` yields a different group ordering.
- [ ] **Step 4: Commit** `git add -A && git commit -m "feat: post-event survey + agent re-tune loop"`

---

### Task 15: Admin views (matching + agent trace)

**Files:**
- Create: `src/app/admin/page.tsx`, `src/app/admin/agents/page.tsx`, `src/app/api/admin/traces/route.ts`

**Interfaces:**
- Produces: `/admin` (current event + groups + members + scores) and `/admin/agents` (recent `agent_traces` table) — read-only, proves agent + DB for the demo video.

- [ ] **Step 1: Admin traces API** returns the latest ~50 `agent_traces`.
- [ ] **Step 2: `/admin`** table of current-week groups with members + match scores + status.
- [ ] **Step 3: `/admin/agents`** mono-styled table of tool calls (time, user, tool, args, result).
- [ ] **Step 4: Verify** both render real rows after a full run-through.
- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: admin matching + agent trace views"`

---

### Task 16: Deploy to Vercel + submission artifacts

**Files:**
- Create: `docs/architecture-diagram.md` (or image), `README.md` (submission notes)

- [ ] **Step 1: Push to GitHub**, import to Vercel, set all env vars (Step 3 of Task 2), set the function region to the Aurora region.
- [ ] **Step 2: Add Stripe live webhook** endpoint (Vercel URL) and `STRIPE_WEBHOOK_SECRET`.
- [ ] **Step 3: Production smoke test** — full golden path on the deployed URL with a seeded city.
- [ ] **Step 4: Capture artifacts** — AWS console screenshot of the Aurora cluster (proving Data API + the DB), an architecture diagram, and note "Aurora PostgreSQL" + Vercel Team ID for the submission.
- [ ] **Step 5: Commit** `git add -A && git commit -m "docs: deploy notes + architecture diagram"`

---

## Self-Review notes

- **Spec coverage:** format/audience/edge → Tasks 5,7,9; agent concierge+host → Tasks 10,13; simple-literal UX → Tasks 11,13; subscription → Task 12; Aurora+pgvector+DataAPI → Tasks 2,3,9; Titan embeddings → Tasks 6,7,14; Clerk → Task 4; seeding (cold-start) → Task 8; admin proof → Task 15; deploy+artifacts → Task 16. All spec sections mapped.
- **Type consistency:** `embedText`/`profileToText` (Task 6) reused verbatim in 7/8/14; `buildGroups` returns `{ userId, matchScore }` consumed in Task 9 persistence and Task 15 display; `generateReveal` output (rationale/icebreakers/venue) consumed in Tasks 11/13.
- **Open items (non-blocking):** final product name; the specific visual identity (decided via `frontend-design` in Task 5); exact Claude model id (confirm via `claude-api` in Task 10).
```
