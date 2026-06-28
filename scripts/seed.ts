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
import {
  deterministicEmbed,
  embedText,
  embedTextWithFallback,
  isBedrockThrottleError,
  profileToText,
} from "../src/lib/embeddings";
import { setProfileEmbedding } from "../src/lib/profile-embedding";
import {
  buildSeedPersonas,
  currentWeekLabel,
  SEED_VENUES,
} from "../src/lib/seed-data";

import { parseRdsCount, parseRdsRows } from "../src/lib/rds-rows";

const DELAY_BETWEEN_EMBEDS_MS = Number(process.env.DELAY_BETWEEN_EMBEDS_MS ?? 1500);
const INITIAL_COOLDOWN_MS = Number(process.env.SEED_COOLDOWN_MS ?? 10_000);
const SEED_DETERMINISTIC = process.env.SEED_DETERMINISTIC === "1";
const MAX_CONSECUTIVE_THROTTLES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countEmbeddedSeedProfiles(): Promise<number> {
  const rows = await db.execute(
    sql`SELECT count(*)::int AS n FROM profiles WHERE embedding IS NOT NULL AND user_id LIKE 'seed_%'`,
  );
  return parseRdsCount(rows, "n");
}

async function hasEmbedding(userId: string): Promise<boolean> {
  const rows = await db.execute(
    sql`SELECT (embedding IS NOT NULL) AS has_emb FROM profiles WHERE user_id = ${userId} LIMIT 1`,
  );
  return parseRdsRows<{ has_emb: boolean }>(rows, ["has_emb"])[0]?.has_emb === true;
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

  let useDeterministic = SEED_DETERMINISTIC;

  console.log(
    `Seeding ${personas.length} personas (${alreadyDone} already embedded, processing one at a time)...`,
  );
  if (useDeterministic) {
    console.log("SEED_DETERMINISTIC=1 — skipping Bedrock (hash-based embeddings for matching demos)\n");
  } else {
    console.log(`Waiting ${INITIAL_COOLDOWN_MS / 1000}s, then probing Bedrock...\n`);
    await sleep(INITIAL_COOLDOWN_MS);
    try {
      await embedText("side quest seed probe");
      console.log("Bedrock OK — using Titan embeddings\n");
    } catch (err) {
      if (isBedrockThrottleError(err)) {
        console.warn(
          "Bedrock throttled — account RPM quota exhausted. Using deterministic embeddings for this run.",
        );
        console.warn("Request a quota increase in AWS Service Quotas, or set SEED_DETERMINISTIC=1.\n");
        useDeterministic = true;
      } else {
        throw err;
      }
    }
  }

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
      const { embedding, source } = useDeterministic
        ? { embedding: deterministicEmbed(text), source: "deterministic" as const }
        : await embedTextWithFallback(text, { allowDeterministic: false, maxAttempts: 4, baseDelayMs: 5000 });

      await db
        .insert(profiles)
        .values({
          userId: persona.id,
          answers: persona.answers,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { answers: persona.answers },
        });

      await setProfileEmbedding(persona.id, embedding);

      const tag = source === "deterministic" ? " (deterministic — Bedrock throttled)" : "";
      console.log(`  ✓ ${persona.id} ${persona.name}${tag}`);
      consecutiveThrottles = 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const throttled = isBedrockThrottleError(err);
      console.error(`  ✗ ${persona.id} ${persona.name} — ${message.slice(0, 120)}`);
      failed.push(persona.id);

      if (throttled) {
        consecutiveThrottles++;
        if (consecutiveThrottles >= MAX_CONSECUTIVE_THROTTLES) {
          console.error(
            `\nBedrock still throttled after ${MAX_CONSECUTIVE_THROTTLES} failures in a row.`,
          );
          console.error("Your account RPM quota is likely exhausted — waiting 30 min won't reset it.");
          console.error("Re-run with deterministic seed (good enough for hackathon matching):");
          console.error("  SEED_DETERMINISTIC=1 npx dotenv -e .env.local -- npm run seed");
          break;
        }
      }
    }

    if (!useDeterministic) {
      await sleep(DELAY_BETWEEN_EMBEDS_MS);
    }
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
