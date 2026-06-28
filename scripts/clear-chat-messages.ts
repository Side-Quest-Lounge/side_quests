/**
 * Clear party chat messages and reset concierge welcome flags.
 *
 * Run: npx dotenv -e .env.local -- npm run chat:clear
 * Optional: pass a group UUID to clear one group only.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { groups, messages } from "../src/db/schema";
import { parseRevealPayload, serializeRevealPayload } from "../src/lib/agent-tools";
import { parseRdsCount } from "../src/lib/rds-rows";

async function messageCount(groupId?: string): Promise<number> {
  const result = groupId
    ? await db.execute(
        sql`SELECT count(*)::int AS n FROM messages WHERE group_id = ${groupId}::uuid`,
      )
    : await db.execute(sql`SELECT count(*)::int AS n FROM messages`);
  return parseRdsCount(result, "n");
}

async function resetWelcomeFlags(): Promise<number> {
  const groupRows = await db.select({ id: groups.id, agentRationale: groups.agentRationale }).from(groups);
  let reset = 0;

  for (const g of groupRows) {
    const payload = parseRevealPayload(g.agentRationale);
    if (!payload.chatWelcomed) continue;

    await db
      .update(groups)
      .set({
        agentRationale: serializeRevealPayload(payload.rationale, payload.icebreakers),
      })
      .where(eq(groups.id, g.id));
    reset += 1;
  }

  return reset;
}

async function main(): Promise<void> {
  const groupId = process.argv[2];

  const before = await messageCount(groupId);
  console.log("Side Quest — clear chat messages\n");
  console.log(groupId ? `  scope: group ${groupId}` : "  scope: all groups");
  console.log(`  messages before: ${before}`);

  if (groupId) {
    await db.execute(sql`DELETE FROM messages WHERE group_id = ${groupId}::uuid`);
  } else {
    await db.execute(sql`DELETE FROM messages`);
  }

  const flagsReset = await resetWelcomeFlags();
  const after = await messageCount(groupId);

  console.log(`  messages deleted: ${before - after}`);
  console.log(`  welcome flags reset: ${flagsReset}`);
  console.log(`  messages after: ${after}`);
  console.log("\n✓ Done — reopen party chat to get a fresh concierge welcome.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
