import { NextRequest, NextResponse } from "next/server";
import { runMatchingRound } from "@/lib/matching";

// TODO(task-4): replace userId from body with getOrCreateUser() once Clerk auth lands
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { userId?: string };
  const userId = body.userId;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const groupId = await runMatchingRound(userId);
  return NextResponse.json({ groupId });
}
