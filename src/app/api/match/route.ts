import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/current-user";
import { runMatchingRound } from "@/lib/matching";

export async function POST(): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  try {
    const groupId = await runMatchingRound(user.id);
    return NextResponse.json({ groupId });
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === "no_embedding") {
      return NextResponse.json({ error: "no_embedding" }, { status: 400 });
    }
    if (code === "no_open_event") {
      return NextResponse.json({ error: "no_open_event" }, { status: 404 });
    }
    return NextResponse.json({ error: "match_failed" }, { status: 500 });
  }
}
