"use client";

import { useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { DEMO, demoUser } from "@/lib/demo";

function clerkDisplayName(user: NonNullable<ReturnType<typeof useUser>["user"]>): string {
  return (
    user.firstName ??
    user.fullName ??
    user.username ??
    user.emailAddresses[0]?.emailAddress?.split("@")[0] ??
    demoUser.name
  );
}

export function DisplayName({ children }: { children: (name: string) => ReactNode }) {
  if (DEMO) return <>{children(demoUser.name)}</>;
  return <ClerkDisplayName>{children}</ClerkDisplayName>;
}

function ClerkDisplayName({ children }: { children: (name: string) => ReactNode }) {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return <>{children(demoUser.name)}</>;
  return <>{children(clerkDisplayName(user))}</>;
}
