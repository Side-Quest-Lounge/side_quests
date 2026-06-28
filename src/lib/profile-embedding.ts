/**
 * Persist pgvector embeddings via raw SQL — RDS Data API needs an explicit ::vector cast.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { toVec } from "@/lib/matching";

export async function setProfileEmbedding(userId: string, embedding: number[]): Promise<void> {
  await db.execute(
    sql`UPDATE profiles SET embedding = ${sql.raw(toVec(embedding))} WHERE user_id = ${userId}`,
  );
}
