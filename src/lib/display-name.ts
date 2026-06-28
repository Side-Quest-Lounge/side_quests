/** Shared display-name helpers for Clerk, DB profile, and demo guest. */

export const DEFAULT_DISPLAY_NAME = "Friend";
export const DEMO_GUEST_NAME = "Guest";

type ClerkUserLike = {
  firstName?: string | null;
  fullName?: string | null;
  username?: string | null;
  emailAddresses?: { emailAddress: string }[];
};

export function clerkDisplayName(user: ClerkUserLike): string {
  return (
    user.firstName ??
    user.fullName ??
    user.username ??
    user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    DEFAULT_DISPLAY_NAME
  );
}

/** Prefer name saved during onboarding/quiz; fall back to Clerk while unset. */
export function resolveDisplayName(
  dbName: string | null | undefined,
  hasProfile: boolean,
  clerkName: string,
): string {
  if (dbName && (hasProfile || dbName !== DEFAULT_DISPLAY_NAME)) return dbName;
  return clerkName;
}
