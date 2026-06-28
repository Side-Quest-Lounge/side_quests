import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { events, groupMembers, groups, surveys, venues } from "@/db/schema";
import type { PastQuest } from "@/lib/api/types";

const ACTIVITY_EMOJI: Record<string, string> = {
  bouldering: "🧗",
  pottery: "🏺",
  "mini-golf": "⛳",
  trivia: "🎯",
  cooking: "👨‍🍳",
  hiking: "🥾",
};

function questEmoji(activityType: string | null | undefined): string {
  if (!activityType) return "✨";
  return ACTIVITY_EMOJI[activityType] ?? "✨";
}

function formatPastDate(startsAt: Date | null): string {
  if (!startsAt) return "Past quest";
  return startsAt.toLocaleString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export async function GET(): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const current = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id))
    .limit(1);

  const activeGroupId = current[0]?.groupId ?? null;
  const now = new Date();

  const rows = await db
    .select({
      groupId: groupMembers.groupId,
      status: groups.status,
      startsAt: events.startsAt,
      venueName: venues.name,
      activityType: venues.activityType,
      vibeScore: surveys.vibeScore,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .leftJoin(events, eq(events.id, groups.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(
      surveys,
      and(eq(surveys.groupId, groupMembers.groupId), eq(surveys.userId, user.id)),
    )
    .where(eq(groupMembers.userId, user.id))
    .orderBy(desc(events.startsAt));

  const past: PastQuest[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.groupId)) continue;
    seen.add(row.groupId);

    if (row.groupId === activeGroupId) continue;

    const ended =
      row.status === "completed" ||
      (row.startsAt != null && row.startsAt.getTime() < now.getTime());
    if (!ended) continue;

    past.push({
      id: row.groupId,
      emoji: questEmoji(row.activityType),
      title: row.venueName ?? row.activityType ?? "Side Quest",
      date: formatPastDate(row.startsAt),
      vibeScore: row.vibeScore ?? null,
    });
  }

  return NextResponse.json({ past });
}
