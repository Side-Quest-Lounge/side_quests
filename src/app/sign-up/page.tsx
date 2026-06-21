"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Pill } from "@/components/ui";

export default function SignUpPage() {
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
      <Card style={{ maxWidth: 420, width: "100%" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--text-lg)",
            color: "var(--ink)",
          }}
        >
          Side&nbsp;Quest
        </Link>

        <div style={{ margin: "var(--space-4) 0 var(--space-2)" }}>
          <Pill tone="sunny">Free to join</Pill>
        </div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>
          Meet your people
        </h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-6)" }}>
          Two minutes to set up. Your first group is on us.
        </p>

        <form onSubmit={enterDemo} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Field label="First name" placeholder="Alex" autoComplete="given-name" />
          <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" />
          <Button variant="primary" type="submit" style={{ minHeight: 52 }}>
            Create account
          </Button>
        </form>

        <p style={{ marginTop: "var(--space-5)", color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "var(--lantern-ink)", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
