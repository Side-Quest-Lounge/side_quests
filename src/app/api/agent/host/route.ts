import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { agentTraces, groupMembers, groups, messages } from "@/db/schema";
import { parseRevealPayload } from "@/lib/agent-tools";

async function assertMembership(userId: string, groupId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const body = (await req.json()) as { groupId?: string; action?: string };
  if (!body.groupId) {
    return NextResponse.json({ error: "groupId required" }, { status: 400 });
  }

  if (!(await assertMembership(user.id, body.groupId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const groupId = body.groupId;
  const existing = await db
    .select()
    .from(messages)
    .where(and(eq(messages.groupId, groupId), eq(messages.author, "agent")))
    .limit(1);

  if (existing.length > 0 && body.action !== "nudge") {
    return NextResponse.json({ ok: true, alreadyWelcomed: true });
  }

  if (body.action === "nudge") {
    const nudge = "Hey everyone — drop a quick hello if you're around! What's one thing you're looking forward to this week? 👋";
    await db.insert(messages).values({ groupId, author: "agent", body: nudge });
    await db.insert(agentTraces).values({
      userId: user.id,
      tool: "nudgeQuietMember",
      args: { groupId },
      result: { posted: true },
    });
    return NextResponse.json({ ok: true, nudged: true });
  }

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  const { rationale, icebreakers } = parseRevealPayload(group?.agentRationale ?? null);

  const welcome = rationale
    ? `Welcome to your Side Quest group! 🎉\n\n${rationale}`
    : "Welcome to your Side Quest group! 🎉 So glad you're all here.";

  await db.insert(messages).values({ groupId, author: "agent", body: welcome });

  for (const ib of icebreakers) {
    await db.insert(messages).values({ groupId, author: "agent", body: `💬 ${ib}` });
  }

  await db.insert(agentTraces).values({
    userId: user.id,
    tool: "postIcebreakers",
    args: { groupId, count: icebreakers.length },
    result: { welcome: true },
  });

  return NextResponse.json({ ok: true, welcomed: true });
}
