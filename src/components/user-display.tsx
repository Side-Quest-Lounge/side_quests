/**
 * Display name resolution: DB name (from quiz) beats Clerk fallback.
 * Used in shell, home greeting, and onboarding prefill.
 */
"use client";

import { useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { DEMO, demoUser } from "@/lib/demo";

const DEFAULT_DB_NAME = "Friend";

export function clerkDisplayName(user: NonNullable<ReturnType<typeof useUser>["user"]>): string {
  return (
    user.firstName ??
    user.fullName ??
    user.username ??
    user.emailAddresses[0]?.emailAddress?.split("@")[0] ??
    demoUser.name
  );
}

/** Prefer name saved during onboarding/quiz; fall back to Clerk while unset. */
export function resolveDisplayName(
  dbName: string | null | undefined,
  hasProfile: boolean,
  clerkName: string,
): string {
  if (dbName && (hasProfile || dbName !== DEFAULT_DB_NAME)) return dbName;
  return clerkName;
}

export function DisplayName({ children }: { children: (name: string) => ReactNode }) {
  if (DEMO) return <>{children(demoUser.name)}</>;
  return <ProfileAwareDisplayName>{children}</ProfileAwareDisplayName>;
}

function ProfileAwareDisplayName({ children }: { children: (name: string) => ReactNode }) {
  const { loading, user, hasProfile } = useMeProfile();
  const { user: clerkUser, isLoaded } = useUser();

  const clerkName =
    isLoaded && clerkUser ? clerkDisplayName(clerkUser) : demoUser.name;
  const name = !loading
    ? resolveDisplayName(user?.name, hasProfile, clerkName)
    : clerkName;

  return <>{children(name)}</>;
}
