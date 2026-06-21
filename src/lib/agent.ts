import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { agentTraces, events, groups, groupMembers, users, venues } from "@/db/schema";
import {
  bookVenue,
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
  result: unknown
): Promise<void> {
  await db.insert(agentTraces).values({ userId, tool, args, result });
}

const revealSchema = z.object({
  rationale: z
    .string()
    .describe("Warm, plain-language explanation of why these people fit together"),
  icebreakers: z
    .array(z.string())
    .length(3)
    .describe("Three tailored conversation starters referencing member interests"),
});

export async function generateReveal(groupId: string): Promise<RevealResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) throw new Error("Group not found");

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
  const startsAt = pickStartTime(event?.weekOf ?? new Date().toISOString());
  await recordTrace(null, "pickStartTime", { weekOf: event?.weekOf }, { startsAt: startsAt.toISOString() });

  const memberSummaries = members
    .map((m) => `${m.name}${m.bio ? ` (${m.bio})` : ""} — match ${Math.round(m.matchScore * 100)}%`)
    .join("\n");

  let rationale: string;
  let icebreakers: string[];

  if (process.env.ANTHROPIC_API_KEY) {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: revealSchema,
      system: `You are Side Quest's warm AI concierge in Auckland. Explain group picks in plain, friendly language — no jargon. Reference real member details when provided. Keep rationale to 2–3 sentences.`,
      prompt: `Compose a group reveal for this week's activity (${chosen.name}, ${chosen.activityType}).

Members:
${memberSummaries}

Write a rationale explaining why they fit, plus exactly 3 icebreaker questions tailored to their interests.`,
    });
    rationale = object.rationale;
    icebreakers = object.icebreakers;
    await recordTrace(null, "explainPicks", { groupId, memberCount: members.length }, { rationale, icebreakers });
  } else {
    rationale = `You're all newcomers-ish Aucklanders who scored high on vibe overlap — ${members.map((m) => m.name).join(", ")} should click over ${chosen.activityType} at ${chosen.name}.`;
    icebreakers = [
      "What's the best thing you've discovered in Auckland so far?",
      "What made you say yes to meeting new people this week?",
      `Ever tried ${chosen.activityType}? What are you hoping to get out of it?`,
    ];
  }

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
