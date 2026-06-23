import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { users, profiles } from "@/db/schema";
import { embedText, profileToText } from "@/lib/embeddings";
import { DEMO } from "@/lib/demo";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    name?: string;
    bio?: string;
    isNewcomer?: boolean;
    answers?: Record<string, number | string>;
  };

  if (!body.name || !body.answers) {
    return NextResponse.json({ error: "name and answers required" }, { status: 400 });
  }

  if (DEMO) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  await db
    .update(users)
    .set({
      name: body.name,
      bio: body.bio ?? null,
      isNewcomer: body.isNewcomer ?? false,
    })
    .where(eq(users.id, user.id));

  const embedding = await embedText(profileToText(body.answers, body.bio));
  await db
    .insert(profiles)
    .values({ userId: user.id, answers: body.answers, embedding })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { answers: body.answers, embedding },
    });

  return NextResponse.json({ ok: true });
}
