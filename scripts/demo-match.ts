/**
 * Walk through pgvector matching for one user: kNN candidates → group formation.
 *
 * Run: npx dotenv -e .env.local -- npm run demo:match
 * Or:  npx dotenv -e .env.local -- npm run demo:match -- user_YOUR_CLERK_ID
 */
import { sql, eq, desc } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, groupMembers } from "../src/db/schema";
import { buildGroups, runMatchingRound } from "../src/lib/matching";
import { parseEmbedding, parseRdsRows } from "../src/lib/rds-rows";

const GROUP_SIZE = 6;

async function findMatchUser(requestedId?: string): Promise<string> {
  if (requestedId) return requestedId;

  const rows = await db.execute(sql`
    SELECT p.user_id
    FROM profiles p
    WHERE p.embedding IS NOT NULL AND p.user_id NOT LIKE 'seed_%'
    LIMIT 1
  `);
  const id = parseRdsRows<{ user_id: string }>(rows, ["user_id"])[0]?.user_id;
  if (id) return id;

  const seed = await db.execute(sql`
    SELECT user_id FROM profiles WHERE embedding IS NOT NULL LIMIT 1
  `);
  const seedId = parseRdsRows<{ user_id: string }>(seed, ["user_id"])[0]?.user_id;
  if (seedId) return seedId;

  throw new Error("No profile with embedding found. Run npm run seed and/or retake the quiz.");
}

async function main(): Promise<void> {
  const requestedId = process.argv[2];
  const userId = await findMatchUser(requestedId);

  const [user] = await db.select().from(users).where(sql`${users.id} = ${userId}`);
  console.log("Side Quest — matching demo\n");
  console.log("Anchor user:", user?.name ?? userId, `(${userId})`);

  const eventRows = await db.execute(
    sql`SELECT id FROM events WHERE status = 'open' ORDER BY starts_at ASC LIMIT 1`,
  );
  const eventId = parseRdsRows<{ id: string }>(eventRows, ["id"])[0]?.id;
  if (!eventId) throw new Error("No open event");

  const selfRows = await db.execute(
    sql`SELECT embedding FROM profiles WHERE user_id = ${userId} LIMIT 1`,
  );
  const embedding = parseEmbedding(
    parseRdsRows<{ embedding: unknown }>(selfRows, ["embedding"])[0]?.embedding,
  );
  if (!embedding) throw new Error(`No embedding for ${userId} — retake quiz or run seed`);

  console.log("\nStep 1 — pgvector kNN (cosine similarity, top 10)");
  const knnRows = await db.execute(sql`
    SELECT p.user_id, u.name,
           round((1 - (p.embedding <=> anchor.embedding))::numeric, 3) AS score
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    CROSS JOIN (
      SELECT embedding FROM profiles WHERE user_id = ${userId} LIMIT 1
    ) anchor
    WHERE p.user_id <> ${userId}
      AND p.embedding IS NOT NULL
      AND anchor.embedding IS NOT NULL
    ORDER BY p.embedding <=> anchor.embedding
    LIMIT 10
  `);

  const candidates = parseRdsRows<{ user_id: string; name: string; score: number | string }>(
    knnRows,
    ["user_id", "name", "score"],
  );
  if (candidates.length === 0) throw new Error("No candidates with embeddings");

  for (const c of candidates) {
    console.log(`  ${Math.round(Number(c.score) * 100)}%  ${c.name} (${c.user_id})`);
  }

  console.log("\nStep 2 — buildGroups (anchor + top 5 by score)");
  const mapped = candidates.map((c) => ({ userId: c.user_id, score: Number(c.score) }));
  const party = buildGroups(mapped, userId, GROUP_SIZE);
  for (const m of party) {
    const name =
      m.userId === userId
        ? user?.name ?? "You"
        : candidates.find((c) => c.user_id === m.userId)?.name ?? m.userId;
    console.log(`  ${Math.round(m.matchScore * 100)}%  ${name}`);
  }

  console.log("\nStep 3 — persist group (POST /api/match)");
  const result = await runMatchingRound(userId);
  console.log(`  groupId: ${result.groupId}`);
  console.log(`  created: ${result.created}`);

  const members = await db
    .select({ name: users.name, matchScore: groupMembers.matchScore })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, result.groupId))
    .orderBy(desc(groupMembers.matchScore));

  console.log("\nSaved to Aurora — group_members:");
  for (const row of members) {
    console.log(`  ${Math.round(row.matchScore * 100)}%  ${row.name}`);
  }

  console.log("\nNext: POST /api/agent/reveal with this groupId, then open /group/" + result.groupId);
}

main().catch((err) => {
  console.error("\nDemo failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
