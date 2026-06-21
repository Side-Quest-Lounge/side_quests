import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/current-user";

export async function GET(): Promise<NextResponse> {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  return NextResponse.json({ status: user.subscriptionStatus });
}
