import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { events, groupMembers, groups, users } from "@/db/schema";
import { parseRevealPayload } from "@/lib/agent-tools";
import { getOrCreateUser, isAdmin } from "@/lib/current-user";

export async function GET(): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const openEvents = await db
    .select()
    .from(events)
    .where(eq(events.status, "open"))
    .orderBy(desc(events.startsAt))
    .limit(1);

  const event = openEvents[0];
  if (!event) return NextResponse.json({ event: null, groups: [] });

  const groupRows = await db
    .select()
    .from(groups)
    .where(eq(groups.eventId, event.id));

  const result = [];
  for (const g of groupRows) {
    const members = await db
      .select({
        userId: groupMembers.userId,
        matchScore: groupMembers.matchScore,
        name: users.name,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, g.id));

    const { rationale } = parseRevealPayload(g.agentRationale);
    result.push({
      id: g.id,
      status: g.status,
      rationale: rationale.slice(0, 120),
      members,
    });
  }

  return NextResponse.json({ event: { id: event.id, weekOf: event.weekOf, status: event.status }, groups: result });
}
