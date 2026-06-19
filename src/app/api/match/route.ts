import { NextRequest, NextResponse } from "next/server";
import { runMatchingRound } from "@/lib/matching";

// TODO(task-4): replace userId from body with getOrCreateUser() once Clerk auth lands
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { userId?: string };
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const groupId = await runMatchingRound(userId);
    return NextResponse.json({ groupId });
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === "no_embedding") {
      return NextResponse.json({ error: "no_embedding" }, { status: 400 });
    }
    if (code === "no_open_event") {
      return NextResponse.json({ error: "no_open_event" }, { status: 404 });
    }
    return NextResponse.json({ error: "match_failed" }, { status: 500 });
  }
}
