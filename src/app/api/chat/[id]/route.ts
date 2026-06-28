import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, asc } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { groupMembers, messages } from "@/db/schema";
import { enforceRateLimit, internalError, parseBody } from "@/lib/api-helpers";
import { chatPostSchema } from "@/lib/validators";

async function assertMembership(userId: string, groupId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

function parseSinceParam(since: string | null): Date | null {
  if (!since) return null;
  const d = new Date(since);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const { id: groupId } = await params;
    if (!(await assertMembership(user.id, groupId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const limited = await enforceRateLimit("chat_poll", user.id, groupId);
    if (limited) return limited;

    const sinceDate = parseSinceParam(req.nextUrl.searchParams.get("since"));
    const rows = sinceDate
      ? await db
          .select()
          .from(messages)
          .where(and(eq(messages.groupId, groupId), gt(messages.createdAt, sinceDate)))
          .orderBy(asc(messages.createdAt))
          .limit(200)
      : await db
          .select()
          .from(messages)
          .where(eq(messages.groupId, groupId))
          .orderBy(asc(messages.createdAt))
          .limit(200);

    return NextResponse.json({
      messages: rows.map((m) => ({
        id: m.id,
        author: m.author,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return internalError("chat", err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const { id: groupId } = await params;
    if (!(await assertMembership(user.id, groupId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const limited = await enforceRateLimit("chat", user.id, groupId);
    if (limited) return limited;

    const parsed = await parseBody(req, chatPostSchema);
    if (!parsed.success) return parsed.response;

    const [msg] = await db
      .insert(messages)
      .values({ groupId, author: user.id, body: parsed.data.text })
      .returning();

    return NextResponse.json({
      message: {
        id: msg.id,
        author: msg.author,
        body: msg.body,
        createdAt: msg.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return internalError("chat", err);
  }
}
