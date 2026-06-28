/**
 * Clear party chat and insert a fresh concierge welcome from group reveal data.
 *
 * Run: npx dotenv -e .env.local -- npm run chat:reseed
 * Optional: pass a group UUID to reseed one group only.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { groups, messages } from "../src/db/schema";
import { parseRevealPayload, serializeRevealPayload } from "../src/lib/agent-tools";
import { parseRdsRows } from "../src/lib/rds-rows";

async function postConciergeWelcome(groupId: string, rationale: string, icebreakers: string[]): Promise<number> {
  let inserted = 0;

  const welcome = rationale
    ? `Welcome to your Side Quest group! 🎉\n\n${rationale}`
    : "Welcome to your Side Quest group! 🎉 So glad you're all here.";

  await db.insert(messages).values({ groupId, author: "agent", body: welcome.slice(0, 2000) });
  inserted += 1;

  const prompts = icebreakers.slice(0, 3);
  if (prompts.length > 0) {
    const icebreakerBlock = prompts.map((ib, i) => `${i + 1}. ${ib}`).join("\n");
    await db.insert(messages).values({
      groupId,
      author: "agent",
      body: `💬 Icebreakers to get you started:\n\n${icebreakerBlock}`.slice(0, 2000),
    });
    inserted += 1;
  }

  return inserted;
}

async function main(): Promise<void> {
  const groupIdArg = process.argv[2];

  const groupRows = groupIdArg
    ? await db.select().from(groups).where(eq(groups.id, groupIdArg))
    : await db.select().from(groups);

  if (groupRows.length === 0) {
    console.error("No groups found.");
    process.exit(1);
  }

  console.log("Side Quest — reseed concierge chat\n");

  for (const group of groupRows) {
    const before = await db.execute(
      sql`SELECT count(*)::int AS n FROM messages WHERE group_id = ${group.id}::uuid`,
    );
    const beforeCount = parseRdsRows<{ n: number }>(before, ["n"])[0]?.n ?? 0;

    await db.execute(sql`DELETE FROM messages WHERE group_id = ${group.id}::uuid`);

    const { rationale, icebreakers } = parseRevealPayload(group.agentRationale);
    const inserted = await postConciergeWelcome(group.id, rationale, icebreakers);

    await db
      .update(groups)
      .set({
        agentRationale: serializeRevealPayload(rationale, icebreakers, { chatWelcomed: true }),
      })
      .where(eq(groups.id, group.id));

    console.log(`  group ${group.id}`);
    console.log(`    removed: ${beforeCount} message(s)`);
    console.log(`    inserted: ${inserted} concierge message(s)`);
  }

  console.log("\n✓ Done — refresh party chat to see the concierge welcome.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
