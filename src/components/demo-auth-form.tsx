"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Pill } from "@/components/ui";

type DemoGuestEntryProps = {
  /** Where "explore demo" sends the user. */
  destination?: string;
  /** Short label on the primary demo button. */
  buttonLabel?: string;
};

/** Shown below Clerk sign-in/up when demo mode is enabled. */
export function DemoGuestEntry({
  destination = "/home",
  buttonLabel = "Explore demo as guest →",
}: DemoGuestEntryProps) {
  const router = useRouter();

  return (
    <div
      style={{
        marginTop: "var(--space-5)",
        paddingTop: "var(--space-5)",
        borderTop: "1px solid var(--cream-deep)",
      }}
    >
      <Pill tone="sunny" style={{ marginBottom: "var(--space-2)" }}>
        Demo mode
      </Pill>
      <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
        Preview the full weekly quest flow with sample data — no account needed.
      </p>
      <Button
        variant="ghost"
        type="button"
        style={{ width: "100%", minHeight: 48 }}
        onClick={() => router.push(destination)}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

/** @deprecated Use Clerk sign-in with DemoGuestEntry instead. Kept for reference in tests/docs. */
export function DemoSignIn() {
  const router = useRouter();

  function enterDemo(e: React.FormEvent) {
    e.preventDefault();
    router.push("/home");
  }

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
      <form onSubmit={enterDemo}>
        <Button variant="primary" type="submit">
          Enter demo
        </Button>
      </form>
    </main>
  );
}

/** @deprecated Use Clerk sign-up with DemoGuestEntry instead. */
export function DemoSignUp() {
  const router = useRouter();

  function enterDemo(e: React.FormEvent) {
    e.preventDefault();
    router.push("/onboarding");
  }

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
      <form onSubmit={enterDemo}>
        <Button variant="primary" type="submit">
          Enter demo
        </Button>
        <p style={{ marginTop: "var(--space-5)", fontSize: "var(--text-sm)" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "var(--lantern-ink)", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
