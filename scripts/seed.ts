/**
 * Seed synthetic Auckland users, venues, and an open event.
 * Requires Aurora + Bedrock Titan access in .env.local.
 *
 * Run: npx dotenv -e .env.local -- npm run seed
 *
 * Safe to re-run — skips personas that already have embeddings.
 * Uses sequential Bedrock calls with retries to avoid throttling.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { events, profiles, users, venues } from "../src/db/schema";
import { embedTextWithRetry, profileToText } from "../src/lib/embeddings";
import {
  buildSeedPersonas,
  currentWeekLabel,
  SEED_VENUES,
} from "../src/lib/seed-data";

const DELAY_BETWEEN_EMBEDS_MS = 1500;
const INITIAL_COOLDOWN_MS = Number(process.env.SEED_COOLDOWN_MS ?? 10_000);
const MAX_CONSECUTIVE_THROTTLES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countEmbeddedSeedProfiles(): Promise<number> {
  const rows = await db.execute(
    sql`SELECT count(*)::int AS n FROM profiles WHERE embedding IS NOT NULL AND user_id LIKE 'seed_%'`,
  );
  return (rows as unknown as Array<{ n: number }>)[0]?.n ?? 0;
}

async function hasEmbedding(userId: string): Promise<boolean> {
  const rows = await db.execute(
    sql`SELECT 1 FROM profiles WHERE user_id = ${userId} AND embedding IS NOT NULL LIMIT 1`,
  );
  return (rows as unknown as unknown[]).length > 0;
}

async function seedVenues(): Promise<void> {
  const existing = await db.select({ id: venues.id }).from(venues).limit(1);
  if (existing.length > 0) {
    console.log("Venues already exist — skipping");
    return;
  }

  await db.insert(venues).values([...SEED_VENUES]);
  console.log(`Inserted ${SEED_VENUES.length} venues`);
}

async function seedOpenEvent(): Promise<void> {
  const open = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.status, "open"))
    .limit(1);

  if (open.length > 0) {
    console.log("Open event already exists — skipping");
    return;
  }

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 3);
  startsAt.setHours(10, 0, 0, 0);

  await db.insert(events).values({
    weekOf: currentWeekLabel(),
    format: "signature",
    activity: "Side Quest weekly meetup",
    status: "open",
    startsAt,
  });
  console.log(`Inserted open event for ${currentWeekLabel()}`);
}

async function seedPersonas(): Promise<void> {
  const personas = buildSeedPersonas();
  const alreadyDone = await countEmbeddedSeedProfiles();

  if (alreadyDone >= personas.length) {
    console.log(`${alreadyDone} seed profiles with embeddings — skipping user seed`);
    return;
  }

  console.log(
    `Seeding ${personas.length} personas (${alreadyDone} already embedded, processing one at a time)...`,
  );
  console.log(`Waiting ${INITIAL_COOLDOWN_MS / 1000}s before Bedrock calls (rate limit cooldown)...\n`);
  await sleep(INITIAL_COOLDOWN_MS);

  const failed: string[] = [];
  let consecutiveThrottles = 0;

  for (const persona of personas) {
    if (await hasEmbedding(persona.id)) {
      continue;
    }

    await db
      .insert(users)
      .values({
        id: persona.id,
        name: persona.name,
        bio: persona.bio,
        city: "Auckland",
        isNewcomer: persona.isNewcomer,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: persona.name,
          bio: persona.bio,
          isNewcomer: persona.isNewcomer,
        },
      });

    try {
      const text = profileToText(persona.answers, persona.bio);
      const embedding = await embedTextWithRetry(text);

      await db
        .insert(profiles)
        .values({
          userId: persona.id,
          answers: persona.answers,
          embedding,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { answers: persona.answers, embedding },
        });

      console.log(`  ✓ ${persona.id} ${persona.name}`);
      consecutiveThrottles = 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const throttled = message.includes("Too many requests") || message.includes("ThrottlingException");
      console.error(`  ✗ ${persona.id} ${persona.name} — ${message.slice(0, 120)}`);
      failed.push(persona.id);

      if (throttled) {
        consecutiveThrottles++;
        if (consecutiveThrottles >= MAX_CONSECUTIVE_THROTTLES) {
          console.error(
            `\nBedrock rate limit hit ${MAX_CONSECUTIVE_THROTTLES} times in a row.`,
          );
          console.error("Wait 10–15 minutes, then re-run:");
          console.error("  SEED_COOLDOWN_MS=60000 npx dotenv -e .env.local -- npm run seed");
          break;
        }
      }
    }

    await sleep(DELAY_BETWEEN_EMBEDS_MS);
  }

  if (failed.length > 0) {
    console.warn(`\n${failed.length} personas failed — re-run npm run seed to retry`);
  }
}

async function main(): Promise<void> {
  console.log("Side Quest seed — Aurora + Bedrock\n");

  await seedVenues();
  await seedOpenEvent();
  await seedPersonas();

  const total = await countEmbeddedSeedProfiles();
  console.log(`\nDone. ${total}/40 seed profiles with embeddings.`);

  if (total < 40) {
    console.log("Re-run: npx dotenv -e .env.local -- npm run seed");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
