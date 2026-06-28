/**
 * Shared helpers for API routes: Zod body parsing, Aurora-backed rate limits,
 * consistent 500 logging. Prefer these over ad-hoc try/catch in route handlers.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitKey, type RateLimitScope } from "@/lib/rate-limit";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "invalid_json" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "validation_failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: parsed.data };
}

export async function enforceRateLimit(
  scope: RateLimitScope,
  userId: string,
  suffix?: string,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(scope, rateLimitKey(userId, suffix));
  if (result.ok) return null;

  return NextResponse.json(
    { error: "rate_limit_exceeded", retryAfterSec: result.retryAfterSec },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}

/** Detect Postgres unique-constraint violations (duplicate survey, group member, etc.). */
export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code: unknown }).code) : "";
  if (code === "23505") return true;
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("unique") || message.includes("duplicate key");
}

export function internalError(scope: string, err: unknown): NextResponse {
  console.error(`[${scope}]`, err);
  return NextResponse.json({ error: `${scope}_failed` }, { status: 500 });
}
