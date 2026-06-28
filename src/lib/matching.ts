/**
 * Weekly matching: pgvector kNN → group of 6 → persist to Aurora.
 *
 * Guardrails: one group per user per open event; exclude already-assigned users;
 * idempotent on retry / race (unique constraint on group_members).
 */
import { sql, eq, and } from "drizzle-orm";
import { parseEmbedding, parseRdsRows } from "@/lib/rds-rows";
import { db } from "@/db/client";
import { groups, groupMembers } from "@/db/schema";
import { isUniqueViolation } from "@/lib/api-helpers";

export type Candidate = { userId: string; score: number };
export type GroupMember = { userId: string; matchScore: number };
export type MatchResult = { groupId: string; created: boolean };

const GROUP_SIZE = 6;

/**
 * Pure function: puts the seed user first with matchScore 1,
 * then takes top (size - 1) candidates by score descending.
 */
export function buildGroups(
  candidates: Candidate[],
  seedUserId: string,
  size: number = GROUP_SIZE,
): GroupMember[] {
  const rest = candidates
    .filter((c) => c.userId !== seedUserId)
    .sort((a, b) => b.score - a.score)
    .slice(0, size - 1)
    .map((c) => ({ userId: c.userId, matchScore: c.score }));

  return [{ userId: seedUserId, matchScore: 1 }, ...rest];
}

/** Drop users already placed in a group for this week's event. */
export function filterAvailableCandidates(
  candidates: Candidate[],
  excludedUserIds: Iterable<string>,
): Candidate[] {
  const excluded = new Set(excludedUserIds);
  return candidates.filter((c) => !excluded.has(c.userId));
}

/**
 * Formats a number[] embedding as a Postgres vector literal for pgvector.
 * e.g. [0.1, 0.2] → '[0.1,0.2]'::vector
 */
export function toVec(v: number[]): string {
  if (!v.every((x) => typeof x === "number" && isFinite(x)))
    throw new Error("toVec: non-finite value in embedding");
  const body = v.map((x) => x.toFixed(8)).join(",");
  return `'[${body}]'::vector`;
}

function codedError(message: string, code: string): Error {
  const err = new Error(message);
  (err as Error & { code: string }).code = code;
  return err;
}

async function findOpenEventId(): Promise<string> {
  const eventRows = await db.execute(
    sql`SELECT id FROM events WHERE status = 'open' ORDER BY starts_at ASC LIMIT 1`,
  );
  const eventId = parseRdsRows<{ id: string }>(eventRows, ["id"])[0]?.id;
  if (!eventId) throw codedError("No open event found", "no_open_event");
  return eventId;
}

async function findExistingGroupId(userId: string, eventId: string): Promise<string | null> {
  const rows = await db
    .select({ id: groups.id })
    .from(groups)
    .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .where(and(eq(groupMembers.userId, userId), eq(groups.eventId, eventId)))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function findAssignedUserIds(eventId: string): Promise<Set<string>> {
  const rows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groups.eventId, eventId));
  return new Set(rows.map((r) => r.userId));
}

/**
 * Runs the weekly matching round for a given user:
 * 1. Returns existing group for this open event if already matched.
 * 2. kNN pgvector search, excluding users already in a group this event.
 * 3. Persists groups + group_members.
 */
export async function runMatchingRound(userId: string): Promise<MatchResult> {
  const eventId = await findOpenEventId();

  const existingGroupId = await findExistingGroupId(userId, eventId);
  if (existingGroupId) {
    return { groupId: existingGroupId, created: false };
  }

  const selfRows = await db.execute(
    sql`SELECT embedding FROM profiles WHERE user_id = ${userId} LIMIT 1`,
  );
  const embedding = parseEmbedding(
    parseRdsRows<{ embedding: unknown }>(selfRows, ["embedding"])[0]?.embedding,
  );
  if (!embedding) {
    throw codedError(`No embedding found for user ${userId}`, "no_embedding");
  }

  const assigned = await findAssignedUserIds(eventId);

  const knnRows = await db.execute(sql`
    SELECT p.user_id, 1 - (p.embedding <=> anchor.embedding) AS score
    FROM profiles p
    CROSS JOIN (
      SELECT embedding FROM profiles WHERE user_id = ${userId} LIMIT 1
    ) anchor
    WHERE p.user_id <> ${userId}
      AND p.embedding IS NOT NULL
      AND anchor.embedding IS NOT NULL
    ORDER BY p.embedding <=> anchor.embedding
    LIMIT 30
  `);

  const knnCandidates = parseRdsRows<{ user_id: string; score: number | string }>(knnRows, [
    "user_id",
    "score",
  ]).map((r) => ({ userId: r.user_id, score: Number(r.score) }));
  const candidates = filterAvailableCandidates(knnCandidates, assigned);

  if (candidates.length < GROUP_SIZE - 1) {
    throw codedError(
      `Need at least ${GROUP_SIZE - 1} available profiles (found ${candidates.length}). Run npm run seed.`,
      "not_enough_candidates",
    );
  }

  const members = buildGroups(candidates, userId, GROUP_SIZE);

  const [newGroup] = await db
    .insert(groups)
    .values({ eventId, status: "matched" })
    .returning({ id: groups.id });

  try {
    await db.insert(groupMembers).values(
      members.map((m) => ({
        groupId: newGroup.id,
        userId: m.userId,
        matchScore: m.matchScore,
      })),
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      const raced = await findExistingGroupId(userId, eventId);
      if (raced) return { groupId: raced, created: false };
    }
    throw err;
  }

  return { groupId: newGroup.id, created: true };
}
