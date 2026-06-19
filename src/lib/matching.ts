import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { groups, groupMembers, events } from "@/db/schema";

export type Candidate = { userId: string; score: number };
export type GroupMember = { userId: string; matchScore: number };

/**
 * Pure function: puts the seed user first with matchScore 1,
 * then takes top (size - 1) candidates by score descending.
 */
export function buildGroups(
  candidates: Candidate[],
  seedUserId: string,
  size: number = 6
): GroupMember[] {
  const rest = candidates
    .filter((c) => c.userId !== seedUserId)
    .sort((a, b) => b.score - a.score)
    .slice(0, size - 1)
    .map((c) => ({ userId: c.userId, matchScore: c.score }));

  return [{ userId: seedUserId, matchScore: 1 }, ...rest];
}

/**
 * Formats a number[] embedding as a Postgres vector literal for pgvector.
 * e.g. [0.1, 0.2] → '[0.1,0.2]'::vector
 */
export function toVec(v: number[]): string {
  return `'[${v.join(",")}]'::vector`;
}

/**
 * Runs the weekly matching round for a given user:
 * 1. Fetches the user's embedding from profiles.
 * 2. Runs a pgvector cosine-distance kNN to find the 30 nearest candidates.
 * 3. Builds a group via buildGroups.
 * 4. Persists a groups row (status "matched") + groupMembers rows.
 * Returns the created group id.
 */
export async function runMatchingRound(userId: string): Promise<string> {
  // Fetch seed user's embedding
  const selfRows = await db.execute(
    sql`SELECT embedding FROM profiles WHERE user_id = ${userId} LIMIT 1`
  );
  const selfRow = (selfRows as unknown as Array<{ embedding: number[] }>)[0];
  if (!selfRow?.embedding) {
    throw new Error(`No embedding found for user ${userId}`);
  }
  const embedding = selfRow.embedding;

  // Find the current open event
  const eventRows = await db.execute(
    sql`SELECT id FROM events WHERE status = 'open' ORDER BY starts_at ASC LIMIT 1`
  );
  const eventRow = (eventRows as unknown as Array<{ id: string }>)[0];
  if (!eventRow?.id) {
    throw new Error("No open event found");
  }
  const eventId = eventRow.id;

  // kNN cosine distance query (lower <=> = more similar; score = 1 - distance)
  const vecLiteral = toVec(embedding);
  const knnRows = await db.execute(sql`
    SELECT p.user_id, 1 - (p.embedding <=> ${sql.raw(vecLiteral)}) AS score
    FROM profiles p
    WHERE p.user_id <> ${userId}
    ORDER BY p.embedding <=> ${sql.raw(vecLiteral)}
    LIMIT 30
  `);

  const candidates = (knnRows as unknown as Array<{ user_id: string; score: number }>).map(
    (r) => ({ userId: r.user_id, score: r.score })
  );

  const members = buildGroups(candidates, userId, 6);

  // Persist group
  const [newGroup] = await db
    .insert(groups)
    .values({ eventId, status: "matched" })
    .returning({ id: groups.id });

  // Persist group members
  await db.insert(groupMembers).values(
    members.map((m) => ({
      groupId: newGroup.id,
      userId: m.userId,
      matchScore: m.matchScore,
    }))
  );

  return newGroup.id;
}
