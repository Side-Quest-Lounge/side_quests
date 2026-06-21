import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, isGroupMember } from "@/lib/current-user";
import { generateReveal } from "@/lib/agent";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const body = (await req.json()) as { groupId?: string };
  if (!body.groupId) {
    return NextResponse.json({ error: "groupId required" }, { status: 400 });
  }

  if (!(await isGroupMember(user.id, body.groupId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await generateReveal(body.groupId);
    return NextResponse.json({
      rationale: result.rationale,
      icebreakers: result.icebreakers,
      venue: result.venue,
      startsAt: result.startsAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "reveal_failed" }, { status: 500 });
  }
}
