/**
 * Per-route rate limits stored in Aurora (works across Vercel serverless).
 * Fails open if rate_limits table is missing.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

export type RateLimitScope =
  | "match"
  | "reveal"
  | "profile"
  | "chat"
  | "chat_poll"
  | "agent_host"
  | "survey"
  | "stripe_checkout"
  | "confirm_seat";

type LimitConfig = { max: number; windowMs: number };

/** Per-user (and optional suffix) rate limits for expensive API routes. */
const LIMITS: Record<RateLimitScope, LimitConfig> = {
  match: { max: 5, windowMs: 60 * 60 * 1000 },
  reveal: { max: 3, windowMs: 60 * 60 * 1000 },
  profile: { max: 10, windowMs: 60 * 60 * 1000 },
  chat: { max: 30, windowMs: 60 * 1000 },
  chat_poll: { max: 120, windowMs: 60 * 1000 },
  agent_host: { max: 5, windowMs: 60 * 60 * 1000 },
  survey: { max: 5, windowMs: 24 * 60 * 60 * 1000 },
  stripe_checkout: { max: 10, windowMs: 60 * 60 * 1000 },
  confirm_seat: { max: 5, windowMs: 60 * 60 * 1000 },
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/** Fixed-window counter stored in Aurora (works across Vercel serverless instances). */
export async function checkRateLimit(
  scope: RateLimitScope,
  identifier: string,
): Promise<RateLimitResult> {
  const { max, windowMs } = LIMITS[scope];
  const key = `${scope}:${identifier}`;
  const now = new Date();

  try {
    const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);

    if (!row || now.getTime() - row.windowStart.getTime() >= windowMs) {
      await db
        .insert(rateLimits)
        .values({ key, count: 1, windowStart: now })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: 1, windowStart: now },
        });
      return { ok: true };
    }

    if (row.count >= max) {
      const elapsed = now.getTime() - row.windowStart.getTime();
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
      return { ok: false, retryAfterSec };
    }

    await db
      .update(rateLimits)
      .set({ count: row.count + 1 })
      .where(eq(rateLimits.key, key));

    return { ok: true };
  } catch (err) {
    // rate_limits table missing — allow request (run npm run db:migrate to enable limits)
    console.warn("[rate-limit] disabled:", err instanceof Error ? err.message : err);
    return { ok: true };
  }
}

export function rateLimitKey(userId: string, suffix?: string): string {
  return suffix ? `${userId}:${suffix}` : userId;
}
