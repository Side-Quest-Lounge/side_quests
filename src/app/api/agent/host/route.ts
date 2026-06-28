import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { agentTraces, groupMembers, groups, messages } from "@/db/schema";
import { parseRevealPayload, serializeRevealPayload } from "@/lib/agent-tools";
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
    if (!group) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const { rationale, icebreakers, chatWelcomed } = parseRevealPayload(group.agentRationale);
    if (chatWelcomed) {
      return NextResponse.json({ ok: true, alreadyWelcomed: true });
    }

    const existingAgent = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.groupId, groupId), eq(messages.author, "agent")))
      .limit(1);

    if (existingAgent.length > 0) {
      await db
        .update(groups)
        .set({
          agentRationale: serializeRevealPayload(rationale, icebreakers, { chatWelcomed: true }),
        })
        .where(eq(groups.id, groupId));
      return NextResponse.json({ ok: true, alreadyWelcomed: true });
    }

    // Atomic claim — only one concurrent request can set chatWelcomed and post messages.
    const claimed = await db
      .update(groups)
      .set({
        agentRationale: serializeRevealPayload(rationale, icebreakers, { chatWelcomed: true }),
      })
      .where(
        and(
          eq(groups.id, groupId),
          sql`(agent_rationale IS NULL OR agent_rationale NOT LIKE ${'%"chatWelcomed":true%'})`,
        ),
      )
      .returning({ id: groups.id });

    if (claimed.length === 0) {
      return NextResponse.json({ ok: true, alreadyWelcomed: true });
    }

    const welcome = rationale
      ? `Welcome to your Side Quest group! 🎉\n\n${rationale}`
      : "Welcome to your Side Quest group! 🎉 So glad you're all here.";

    await db.insert(messages).values({ groupId, author: "agent", body: welcome.slice(0, 2000) });

    const prompts = icebreakers.slice(0, 3);
    if (prompts.length > 0) {
      const icebreakerBlock = prompts.map((ib, i) => `${i + 1}. ${ib}`).join("\n");
      await db.insert(messages).values({
        groupId,
        author: "agent",
        body: `💬 Icebreakers to get you started:\n\n${icebreakerBlock}`.slice(0, 2000),
      });
    }

    await db.insert(agentTraces).values({
      userId: user.id,
      tool: "postIcebreakers",
      args: { groupId, count: prompts.length },
      result: { welcome: true },
    });

    return NextResponse.json({ ok: true, welcomed: true });
  } catch (err) {
    return internalError("agent_host", err);
  }
}
