"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field } from "@/components/ui";

export default function SignInPage() {
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

        <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-4) 0 var(--space-2)" }}>
          Welcome back
        </h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-6)" }}>
          Sign in to see this week&apos;s group.
        </p>

        <form onSubmit={enterDemo} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" placeholder="••••••••" autoComplete="current-password" />
          <Button variant="primary" type="submit" style={{ minHeight: 52 }}>
            Sign in
          </Button>
        </form>

        <p style={{ marginTop: "var(--space-5)", color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
          New here?{" "}
          <Link href="/sign-up" style={{ color: "var(--lantern-ink)", fontWeight: 700 }}>
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}
