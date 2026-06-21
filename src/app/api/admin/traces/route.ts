import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { agentTraces } from "@/db/schema";
import { getOrCreateUser, isAdmin } from "@/lib/current-user";

export async function GET(): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(agentTraces)
    .orderBy(desc(agentTraces.at))
    .limit(50);

  return NextResponse.json({
    traces: rows.map((t) => ({
      id: t.id,
      userId: t.userId,
      tool: t.tool,
      args: t.args,
      result: t.result,
      at: t.at.toISOString(),
    })),
  });
}
