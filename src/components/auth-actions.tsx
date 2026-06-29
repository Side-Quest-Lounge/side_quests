"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { notifyMeProfileUpdated } from "@/lib/api/use-me-profile";
import { DEMO } from "@/lib/demo";
import { clearDemoSession } from "@/lib/onboarding-session";

type AuthActionsProps = {
  /** Sidebar shows full-width buttons; topbar uses compact links. */
  placement?: "sidebar" | "topbar";
};

export function AuthActions({ placement = "sidebar" }: AuthActionsProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded) return null;

  const compact = placement === "topbar";

  async function handleSignOut() {
    clearDemoSession();
    notifyMeProfileUpdated();
    await signOut({ redirectUrl: "/sign-in" });
  }

  function handleExitDemo() {
    clearDemoSession();
    notifyMeProfileUpdated();
    router.push("/");
  }

  if (isSignedIn) {
    return (
      <Button
        variant="ghost"
        type="button"
        onClick={() => void handleSignOut()}
        style={
          compact
            ? { minHeight: 36, fontSize: "var(--text-sm)", padding: "0 var(--space-3)" }
            : { width: "100%", minHeight: 40, marginTop: "var(--space-2)" }
        }
      >
        Log out
      </Button>
    );
  }

  if (compact) {
    return (
      <Link href="/sign-in" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--lantern-ink)" }}>
        Log in
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
      <Link href="/sign-in">
        <Button variant="primary" type="button" style={{ width: "100%", minHeight: 40 }}>
          Log in
        </Button>
      </Link>
      {DEMO && (
        <Button variant="ghost" type="button" style={{ width: "100%", minHeight: 40 }} onClick={handleExitDemo}>
          Exit demo
        </Button>
      )}
    </div>
  );
}
