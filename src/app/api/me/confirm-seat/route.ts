import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getOrCreateUser } from "@/lib/current-user";
import { PAYMENTS_DISABLED } from "@/lib/payments";
import { enforceRateLimit, internalError } from "@/lib/api-helpers";

/** Free seat confirmation when payments are disabled (hackathon demo). */
export async function POST(): Promise<NextResponse> {
  if (!PAYMENTS_DISABLED) {
    return NextResponse.json({ error: "payments_enabled" }, { status: 403 });
  }

  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const limited = await enforceRateLimit("confirm_seat", user.id);
  if (limited) return limited;

  await db.update(users).set({ subscriptionStatus: "active" }).where(eq(users.id, user.id));

  return NextResponse.json({ status: "active" });
}
