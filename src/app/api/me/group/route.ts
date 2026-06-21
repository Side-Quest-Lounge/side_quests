import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { groupMembers, groups, users, events, venues } from "@/db/schema";
import { parseRevealPayload } from "@/lib/agent-tools";

export async function GET(): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const membership = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id))
    .limit(1);

  if (!membership[0]) {
    return NextResponse.json({ group: null });
  }

  const groupId = membership[0].groupId;
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) return NextResponse.json({ group: null });

  const members = await db
    .select({
      userId: groupMembers.userId,
      matchScore: groupMembers.matchScore,
      name: users.name,
      bio: users.bio,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

  const { rationale, icebreakers } = parseRevealPayload(group.agentRationale);

  let venue = null;
  let startsAt: string | null = null;
  if (group.eventId) {
    const [event] = await db.select().from(events).where(eq(events.id, group.eventId));
    if (event?.startsAt) startsAt = event.startsAt.toISOString();
    if (event?.venueId) {
      const [v] = await db.select().from(venues).where(eq(venues.id, event.venueId));
      if (v) venue = { id: v.id, name: v.name, activityType: v.activityType, address: v.address };
    }
  }

  return NextResponse.json({
    group: {
      id: group.id,
      status: group.status,
      rationale,
      icebreakers,
      venue,
      startsAt,
      subscriptionStatus: user.subscriptionStatus,
      members: members.map((m) => ({
        userId: m.userId,
        name: m.name,
        bio: m.bio,
        matchScore: m.matchScore,
        isYou: m.userId === user.id,
      })),
    },
  });
}
