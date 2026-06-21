import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, asc } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { groupMembers, messages } from "@/db/schema";

async function assertMembership(userId: string, groupId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { id: groupId } = await params;
  if (!(await assertMembership(user.id, groupId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const since = req.nextUrl.searchParams.get("since");
  const rows = since
    ? await db
        .select()
        .from(messages)
        .where(and(eq(messages.groupId, groupId), gt(messages.createdAt, new Date(since))))
        .orderBy(asc(messages.createdAt))
    : await db
        .select()
        .from(messages)
        .where(eq(messages.groupId, groupId))
        .orderBy(asc(messages.createdAt));

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      author: m.author,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { id: groupId } = await params;
  if (!(await assertMembership(user.id, groupId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const [msg] = await db
    .insert(messages)
    .values({ groupId, author: user.id, body: body.text.trim() })
    .returning();

  return NextResponse.json({
    message: {
      id: msg.id,
      author: msg.author,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
