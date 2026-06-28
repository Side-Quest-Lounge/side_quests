"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function ClerkAuthShell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--space-5)",
        gap: "var(--space-4)",
      }}
    >
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
      <Card style={{ maxWidth: 420, width: "100%", padding: "var(--space-4)" }}>{children}</Card>
    </main>
  );
}
