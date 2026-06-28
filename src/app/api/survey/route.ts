import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { embedProfile } from "@/lib/embeddings";
import { setProfileEmbedding } from "@/lib/profile-embedding";
import { db } from "@/db/client";
import { groupMembers, preferences, profiles, surveys, users } from "@/db/schema";
import { enforceRateLimit, internalError, isUniqueViolation, parseBody } from "@/lib/api-helpers";
import { surveyPostSchema } from "@/lib/validators";

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
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const parsed = await parseBody(req, surveyPostSchema);
    if (!parsed.success) return parsed.response;

    const limited = await enforceRateLimit("survey", user.id, parsed.data.groupId);
    if (limited) return limited;

    const { groupId, vibeScore, openText } = parsed.data;

    const member = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
      .limit(1);
    if (!member[0]) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    try {
      await db.insert(surveys).values({
        groupId,
        userId: user.id,
        vibeScore,
        openText: openText ?? null,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ error: "already_submitted" }, { status: 409 });
      }
      throw err;
    }

    const [prefBefore] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, user.id));

    let likes = prefBefore?.likes ?? [];
    if (openText) {
      const signals = extractSignals(openText);
      likes = [...likes, ...signals.likes].slice(-20);
      const dislikes = [...(prefBefore?.dislikes ?? []), ...signals.dislikes].slice(-20);
      await db
        .insert(preferences)
        .values({ userId: user.id, likes, dislikes })
        .onConflictDoUpdate({ target: preferences.userId, set: { likes, dislikes } });
    }

    let embedded = false;
    const [row] = await db
      .select({ answers: profiles.answers, bio: users.bio })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (row?.answers) {
      const embedding = await embedProfile(row.answers, row.bio, likes);
      if (embedding) {
        await setProfileEmbedding(user.id, embedding);
        embedded = true;
      }
    }

    return NextResponse.json({ ok: true, embedded });
  } catch (err) {
    return internalError("survey", err);
  }
}
