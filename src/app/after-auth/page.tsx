"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Pill } from "@/components/ui";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { clearDemoSession } from "@/lib/onboarding-session";

export default function AfterAuthPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { loading, hasProfile, error } = useMeProfile();
  const [routed, setRouted] = useState(false);

  useEffect(() => {
    if (!isLoaded || routed) return;

    if (!isSignedIn) {
      router.replace("/sign-in");
      setRouted(true);
      return;
    }

    if (loading) return;

    clearDemoSession();

    if (error === "unauth") {
      router.replace("/sign-in");
      setRouted(true);
      return;
    }

    router.replace(hasProfile ? "/home" : "/onboarding");
    setRouted(true);
  }, [isLoaded, isSignedIn, loading, hasProfile, error, router, routed]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--space-5)",
      }}
    >
      <Card style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <Pill tone="sunny" style={{ marginBottom: "var(--space-4)" }}>
          Signing you in
        </Pill>
        {error && error !== "unauth" ? (
          <p style={{ color: "var(--coral)", fontWeight: 600 }}>Could not load your profile. Try again.</p>
        ) : (
          <p style={{ color: "var(--ink-soft)" }}>One moment…</p>
        )}
      </Card>
    </main>
  );
}
