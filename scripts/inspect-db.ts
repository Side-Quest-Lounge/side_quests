/**
 * Print a readable snapshot of Aurora data.
 *
 * Run: npx dotenv -e .env.local -- npm run inspect:db
 */
import { sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, venues, events, groups, groupMembers } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";

function rows<T extends string>(
  result: unknown,
  keys: T[],
): Array<Record<T, string | number | boolean | null>> {
  const records = (result as { records?: Array<Array<{ stringValue?: string; longValue?: number; booleanValue?: boolean; isNull?: boolean }>> }).records ?? [];
  return records.map((row) => {
    const obj = {} as Record<T, string | number | boolean | null>;
    keys.forEach((key, i) => {
      const f = row[i];
      if (!f || f.isNull) obj[key] = null;
      else obj[key] = f.stringValue ?? f.longValue ?? f.booleanValue ?? null;
    });
    return obj;
  });
}

async function countEmbedded(): Promise<number> {
  const rows = await db.execute(
    sql`SELECT count(*)::int AS n FROM profiles WHERE embedding IS NOT NULL`,
  );
  return (rows as unknown as Array<{ n: number }>)[0]?.n ?? 0;
}

async function main(): Promise<void> {
  console.log("Side Quest — Aurora data\n");

  const userRows = await db.select({ id: users.id, name: users.name }).from(users);
  const profileResult = await db.execute(
    sql`SELECT user_id, (embedding IS NOT NULL) AS has_emb FROM profiles`,
  );
  const profilesList = rows(profileResult, ["user_id", "has_emb"] as const);
  const embedded = await countEmbedded();
  const venueRows = await db.select({ name: venues.name, type: venues.activityType }).from(venues);
  const openEvents = await db.select().from(events).where(eq(events.status, "open"));
  const groupRows = await db.select({ id: groups.id, status: groups.status }).from(groups);

  console.log("Counts");
  console.log("  users:              ", userRows.length);
  console.log("  profiles:           ", profilesList.length);
  console.log("  profiles embedded:  ", embedded, embedded >= 6 ? "✓ (enough to match)" : "✗ (need ≥6 for a group of 6)");
  console.log("  venues:             ", venueRows.length);
  console.log("  open events:        ", openEvents.length);
  console.log("  groups:             ", groupRows.length);

  console.log("\nOpen event");
  if (openEvents[0]) {
    const e = openEvents[0];
    console.log(`  id: ${e.id}`);
    console.log(`  week: ${e.weekOf}  starts: ${e.startsAt?.toISOString() ?? "TBD"}`);
  } else {
    console.log("  (none — run npm run seed)");
  }

  console.log("\nVenues");
  for (const v of venueRows) console.log(`  • ${v.name} (${v.type})`);

  console.log("\nReal users (non-seed)");
  for (const u of userRows.filter((r) => !r.id.startsWith("seed_"))) {
    const p = profilesList.find((pr) => pr.user_id === u.id);
    console.log(`  ${u.id}  ${u.name}  embedded: ${p?.has_emb ? "yes" : "no"}`);
  }

  console.log("\nSeed users (first 5)");
  for (const u of userRows.filter((r) => r.id.startsWith("seed_")).slice(0, 5)) {
    const p = profilesList.find((pr) => pr.user_id === u.id);
    console.log(`  ${u.id}  ${u.name}  embedded: ${p?.has_emb ? "yes" : "no"}`);
  }
  const seedCount = userRows.filter((r) => r.id.startsWith("seed_")).length;
  if (seedCount > 5) console.log(`  ... ${seedCount - 5} more seed users`);

  if (groupRows.length > 0) {
    console.log("\nGroups & members");
    for (const g of groupRows) {
      const members = await db
        .select({ name: users.name, score: groupMembers.matchScore })
        .from(groupMembers)
        .innerJoin(users, eq(users.id, groupMembers.userId))
        .where(eq(groupMembers.groupId, g.id))
        .orderBy(desc(groupMembers.matchScore));

      console.log(`\n  Group ${g.id} (${g.status})`);
      for (const m of members) {
        console.log(`    ${m.name.padEnd(20)} match: ${Math.round(m.score * 100)}%`);
      }
    }
  }

  if (embedded < 6) {
    console.log("\n⚠ Matching blocked: need profiles with embeddings.");
    console.log("  1. Wait for Bedrock cooldown (check: npm run check:aws)");
    console.log("  2. npx dotenv -e .env.local -- npm run seed");
    console.log("  3. Retake quiz at /quiz?retake=1 (embeds your account)");
  } else {
    console.log("\n✓ Ready to match — run: npm run demo:match");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
