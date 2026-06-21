import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { groupMembers, users } from "@/db/schema";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;
  const existing = await db.select().from(users).where(eq(users.id, userId));
  if (existing[0]) return existing[0];
  const cu = await currentUser();
  const row = { id: userId, name: cu?.firstName ?? "Friend", city: "Auckland" };
  await db.insert(users).values(row);
  return (await db.select().from(users).where(eq(users.id, userId)))[0];
}

export function isAdmin(user: { id: string }): boolean {
  const ids = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(user.id);
}

export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}
