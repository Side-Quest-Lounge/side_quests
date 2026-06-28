"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Pill } from "@/components/ui";
import { DEMO } from "@/lib/demo";
import { useMeProfile } from "@/lib/api/use-me-profile";

function AfterAuthDemo() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return <AfterAuthShell />;
}

function AfterAuthClerk() {
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

    if (error === "unauth") {
      router.replace("/sign-in");
      setRouted(true);
      return;
    }

    router.replace(hasProfile ? "/home" : "/onboarding");
    setRouted(true);
  }, [isLoaded, isSignedIn, loading, hasProfile, error, router, routed]);

  return (
    <AfterAuthShell
      error={error && error !== "unauth" ? "Could not load your profile. Try again." : undefined}
    />
  );
}

function AfterAuthShell({ error }: { error?: string }) {
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
        {error ? (
          <p style={{ color: "var(--coral)", fontWeight: 600 }}>{error}</p>
        ) : (
          <p style={{ color: "var(--ink-soft)" }}>One moment…</p>
        )}
      </Card>
    </main>
  );
}

export default function AfterAuthPage() {
  if (DEMO) return <AfterAuthDemo />;
  return <AfterAuthClerk />;
}
