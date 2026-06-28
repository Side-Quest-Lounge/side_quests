/**
 * Re-embed an existing profile (no quiz retake needed).
 *
 * Run: npx dotenv -e .env.local -- npm run embed:user
 * Or:  npx dotenv -e .env.local -- npm run embed:user -- user_YOUR_CLERK_ID
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { profiles, users } from "../src/db/schema";
import { embedProfile } from "../src/lib/embeddings";

async function main(): Promise<void> {
  const userId = process.argv[2];

  let targetId = userId;
  if (!targetId) {
    const rows = await db.execute(sql`
      SELECT p.user_id FROM profiles p
      WHERE p.embedding IS NULL
      ORDER BY CASE WHEN p.user_id LIKE 'seed_%' THEN 1 ELSE 0 END
      LIMIT 1
    `);
    targetId = (rows as unknown as Array<{ user_id: string }>)[0]?.user_id;
  }

  if (!targetId) {
    console.log("No profile without embedding found.");
    return;
  }

  const [row] = await db
    .select({ answers: profiles.answers, bio: users.bio, name: users.name })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.userId, targetId))
    .limit(1);

  if (!row) {
    console.error("No profile row for", targetId);
    process.exit(1);
  }

  console.log("Embedding profile for:", row.name, `(${targetId})`);
  console.log("Calling Bedrock (may retry on throttle)...\n");

  const embedding = await embedProfile(row.answers, row.bio);

  if (!embedding) {
    console.error("Failed — Bedrock still throttling or unavailable.");
    console.error("Wait 30–60 min, then run this command again.");
    process.exit(1);
  }

  await db.update(profiles).set({ embedding }).where(eq(profiles.userId, targetId));
  console.log("Success — stored", embedding.length, "dimensional embedding.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
