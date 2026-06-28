/**
 * Display name resolution: DB name (from quiz) beats Clerk fallback.
 * Used in shell, home greeting, and onboarding prefill.
 */
"use client";

import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { DEMO, DEMO_GUEST_NAME } from "@/lib/demo";
import { clerkDisplayName, resolveDisplayName } from "@/lib/display-name";

export { clerkDisplayName, resolveDisplayName } from "@/lib/display-name";

export function DisplayName({ children }: { children: (name: string) => ReactNode }) {
  if (DEMO) return <DemoDisplayName>{children}</DemoDisplayName>;
  return <ProfileAwareDisplayName>{children}</ProfileAwareDisplayName>;
}

function DemoDisplayName({ children }: { children: (name: string) => ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return <>{children(DEMO_GUEST_NAME)}</>;
  return <ProfileAwareDisplayName>{children}</ProfileAwareDisplayName>;
}

function ProfileAwareDisplayName({ children }: { children: (name: string) => ReactNode }) {
  const { loading, user, hasProfile } = useMeProfile();
  const { user: clerkUser, isLoaded } = useUser();

  const clerkName =
    isLoaded && clerkUser ? clerkDisplayName(clerkUser) : DEMO ? DEMO_GUEST_NAME : "Friend";
  const name = !loading
    ? resolveDisplayName(user?.name, hasProfile, clerkName)
    : clerkName;

  return <>{children(name)}</>;
}
