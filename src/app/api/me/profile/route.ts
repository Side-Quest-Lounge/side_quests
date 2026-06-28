import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/current-user";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { DEMO } from "@/lib/demo";

export async function GET(): Promise<NextResponse> {
  if (DEMO) {
    return NextResponse.json({
      profile: null,
      user: { name: "Alex", bio: null, isNewcomer: true },
      demo: true,
    });
  }

  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const rows = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = rows[0];

  return NextResponse.json({
    user: {
      name: user.name,
      bio: user.bio,
      isNewcomer: user.isNewcomer,
    },
    profile: profile ? { answers: profile.answers } : null,
  });
}
