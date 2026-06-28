import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/current-user";
import { runMatchingRound } from "@/lib/matching";
import { enforceRateLimit, internalError } from "@/lib/api-helpers";

const ERROR_STATUS: Record<string, number> = {
  no_embedding: 400,
  no_open_event: 404,
  not_enough_candidates: 503,
};

export async function POST(): Promise<NextResponse> {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const limited = await enforceRateLimit("match", user.id);
    if (limited) return limited;

    const result = await runMatchingRound(user.id);
    return NextResponse.json(result);
  } catch (err) {
    const code = (err as Error & { code?: string }).code ?? "match_failed";
    const status = ERROR_STATUS[code] ?? 500;
    if (status === 500) return internalError("match", err);
    return NextResponse.json({ error: code }, { status });
  }
}
