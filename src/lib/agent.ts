/**
 * Concierge agent: venue pick + template group reveal (rationale + icebreakers).
 * Idempotent — skips if groups.agent_rationale already stored.
 *
 * Future: Claude via Vercel AI SDK for live chat concierge (nudges, contextual replies).
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentTraces, events, groups, groupMembers, users, venues } from "@/db/schema";
import {
  bookVenue,
  parseRevealPayload,
  pickStartTime,
  serializeRevealPayload,
  type Venue,
} from "@/lib/agent-tools";

export type RevealResult = {
  rationale: string;
  icebreakers: string[];
  venue: Venue;
  startsAt: Date;
};

async function recordTrace(
  userId: string | null,
  tool: string,
  args: unknown,
  result: unknown,
): Promise<void> {
  await db.insert(agentTraces).values({ userId, tool, args, result });
}

function buildTemplateReveal(
  members: Array<{ name: string; bio: string | null; matchScore: number }>,
  chosen: Venue,
): { rationale: string; icebreakers: string[] } {
  const rationale = `You're all newcomers-ish Aucklanders who scored high on vibe overlap — ${members.map((m) => m.name).join(", ")} should click over ${chosen.activityType} at ${chosen.name}.`;
  const icebreakers = [
    "What's the best thing you've discovered in Auckland so far?",
    "What made you say yes to meeting new people this week?",
    `Ever tried ${chosen.activityType}? What are you hoping to get out of it?`,
  ];
  return { rationale, icebreakers };
}

export async function generateReveal(groupId: string): Promise<RevealResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new Error("Group not found");

  const cached = parseRevealPayload(group.agentRationale);
  if (cached.rationale) {
    const [event] = group.eventId
      ? await db.select().from(events).where(eq(events.id, group.eventId))
      : [undefined];
    let venue: Venue = {
      id: "",
      name: "Side Quest venue",
      activityType: "activity",
      address: "Auckland",
      capacity: 6,
    };
    if (event?.venueId) {
      const [v] = await db.select().from(venues).where(eq(venues.id, event.venueId));
      if (v) venue = { id: v.id, name: v.name, activityType: v.activityType, address: v.address, capacity: v.capacity };
    }
    return {
      rationale: cached.rationale,
      icebreakers: cached.icebreakers,
      venue,
      startsAt: event?.startsAt ?? pickStartTime(event?.weekOf ?? ""),
    };
  }

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

  const venueRows = await db.select().from(venues);
  const venueList: Venue[] = venueRows.map((v) => ({
    id: v.id,
    name: v.name,
    activityType: v.activityType,
    address: v.address,
    capacity: v.capacity,
  }));

  const bios = members.map((m) => m.bio ?? "").join(" ");
  const chosen = bookVenue(venueList, bios);
  await recordTrace(null, "bookVenue", { activityPref: bios.slice(0, 200) }, chosen);

  const [event] = group.eventId
    ? await db.select().from(events).where(eq(events.id, group.eventId))
    : [undefined];
  const startsAt = event?.startsAt ?? pickStartTime(event?.weekOf ?? "");
  await recordTrace(null, "pickStartTime", { weekOf: event?.weekOf }, { startsAt: startsAt.toISOString() });

  const { rationale, icebreakers } = buildTemplateReveal(members, chosen);
  await recordTrace(null, "explainPicks", { groupId, memberCount: members.length, source: "template" }, {
    rationale,
    icebreakers,
  });

  await db
    .update(groups)
    .set({ agentRationale: serializeRevealPayload(rationale, icebreakers) })
    .where(eq(groups.id, groupId));

  if (group.eventId) {
    await db
      .update(events)
      .set({
        venueId: chosen.id,
        startsAt,
        activity: chosen.activityType,
      })
      .where(eq(events.id, group.eventId));
  }

  return { rationale, icebreakers, venue: chosen, startsAt };
}
