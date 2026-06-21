import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { groupMembers, preferences, profiles, surveys } from "@/db/schema";
import { embedText, profileToText } from "@/lib/embeddings";

function extractSignals(text: string): { likes: string[]; dislikes: string[] } {
  const likes: string[] = [];
  const dislikes: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("quiet") || lower.includes("introvert")) dislikes.push("loud bars");
  if (lower.includes("outdoor") || lower.includes("hike")) likes.push("outdoor activities");
  if (lower.includes("creative") || lower.includes("art")) likes.push("creative activities");
  if (lower.includes("food") || lower.includes("cook")) likes.push("food experiences");
  if (text.trim().length > 10 && likes.length === 0) likes.push(text.trim().slice(0, 80));
  return { likes, dislikes };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const body = (await req.json()) as {
    groupId?: string;
    vibeScore?: number;
    openText?: string;
  };

  if (!body.groupId || body.vibeScore == null) {
    return NextResponse.json({ error: "groupId and vibeScore required" }, { status: 400 });
  }

  const member = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, body.groupId), eq(groupMembers.userId, user.id)))
    .limit(1);
  if (!member[0]) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await db.insert(surveys).values({
    groupId: body.groupId,
    userId: user.id,
    vibeScore: body.vibeScore,
    openText: body.openText ?? null,
  });

  if (body.openText) {
    const signals = extractSignals(body.openText);
    const [pref] = await db.select().from(preferences).where(eq(preferences.userId, user.id));
    const likes = [...(pref?.likes ?? []), ...signals.likes].slice(-20);
    const dislikes = [...(pref?.dislikes ?? []), ...signals.dislikes].slice(-20);
    await db
      .insert(preferences)
      .values({ userId: user.id, likes, dislikes })
      .onConflictDoUpdate({ target: preferences.userId, set: { likes, dislikes } });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  if (profile) {
    const enrichedBio = [user.bio, body.openText].filter(Boolean).join(" — ");
    const text = profileToText(profile.answers, enrichedBio);
    const embedding = await embedText(text);
    await db
      .update(profiles)
      .set({ embedding })
      .where(eq(profiles.userId, user.id));
  }

  return NextResponse.json({ ok: true });
}
