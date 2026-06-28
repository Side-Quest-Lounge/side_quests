import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { embedProfile } from "@/lib/embeddings";
import { db } from "@/db/client";
import { users, profiles } from "@/db/schema";
import { DEMO } from "@/lib/demo";
import { enforceRateLimit, internalError, parseBody } from "@/lib/api-helpers";
import { profilePatchSchema, profilePostSchema } from "@/lib/validators";

async function requireUser() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  return user;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = await parseBody(req, profilePatchSchema);
    if (!parsed.success) return parsed.response;

    if (DEMO) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const limited = await enforceRateLimit("profile", user.id);
    if (limited) return limited;

    const { name, bio, isNewcomer } = parsed.data;
    const bioValue = bio?.trim() || null;

    await db
      .update(users)
      .set({
        name,
        bio: bioValue,
        isNewcomer: isNewcomer ?? false,
      })
      .where(eq(users.id, user.id));

    const [profile] = await db
      .select({ answers: profiles.answers })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    let embedded = false;
    if (profile?.answers) {
      const embedding = await embedProfile(profile.answers, bioValue);
      if (embedding) {
        await db
          .update(profiles)
          .set({ embedding })
          .where(eq(profiles.userId, user.id));
        embedded = true;
      }
    }

    return NextResponse.json({ ok: true, embedded });
  } catch (err) {
    return internalError("profile", err);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = await parseBody(req, profilePostSchema);
    if (!parsed.success) return parsed.response;

    if (DEMO) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const limited = await enforceRateLimit("profile", user.id);
    if (limited) return limited;

    const { name, bio, isNewcomer, answers } = parsed.data;
    const bioValue = bio?.trim() || null;

    await db
      .update(users)
      .set({
        name,
        bio: bioValue,
        isNewcomer: isNewcomer ?? false,
      })
      .where(eq(users.id, user.id));

    const embedding = await embedProfile(answers, bioValue);

    await db
      .insert(profiles)
      .values({
        userId: user.id,
        answers,
        ...(embedding ? { embedding } : {}),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          answers,
          ...(embedding ? { embedding } : {}),
        },
      });

    return NextResponse.json({ ok: true, embedded: Boolean(embedding) });
  } catch (err) {
    return internalError("profile", err);
  }
}
