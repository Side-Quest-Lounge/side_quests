import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { agentTraces, groupMembers, groups, messages } from "@/db/schema";
import { parseRevealPayload } from "@/lib/agent-tools";
import { enforceRateLimit, internalError, parseBody } from "@/lib/api-helpers";
import { agentHostSchema } from "@/lib/validators";

async function assertMembership(userId: string, groupId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const parsed = await parseBody(req, agentHostSchema);
    if (!parsed.success) return parsed.response;

    const { groupId, action } = parsed.data;

    if (!(await assertMembership(user.id, groupId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const limited = await enforceRateLimit("agent_host", user.id, groupId);
    if (limited) return limited;

    const existing = await db
      .select()
      .from(messages)
      .where(and(eq(messages.groupId, groupId), eq(messages.author, "agent")))
      .limit(1);

    if (existing.length > 0 && action !== "nudge") {
      return NextResponse.json({ ok: true, alreadyWelcomed: true });
    }

    if (action === "nudge") {
      const nudge =
        "Hey everyone — drop a quick hello if you're around! What's one thing you're looking forward to this week? 👋";
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

    await db.insert(messages).values({ groupId, author: "agent", body: welcome.slice(0, 2000) });

    for (const ib of icebreakers.slice(0, 5)) {
      await db.insert(messages).values({
        groupId,
        author: "agent",
        body: `💬 ${ib}`.slice(0, 2000),
      });
    }

    await db.insert(agentTraces).values({
      userId: user.id,
      tool: "postIcebreakers",
      args: { groupId, count: icebreakers.length },
      result: { welcome: true },
    });

    return NextResponse.json({ ok: true, welcomed: true });
  } catch (err) {
    return internalError("agent_host", err);
  }
}
