"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { DEMO, demoAdminGroups, demoEventWeek } from "@/lib/demo";

type AdminGroup = {
  id: string;
  status: string;
  rationale: string;
  members: { userId: string; name: string; matchScore: number }[];
};

export default function AdminPage() {
  const [groups, setGroups] = useState<AdminGroup[]>(DEMO ? demoAdminGroups : []);
  const [eventWeek, setEventWeek] = useState<string | null>(DEMO ? demoEventWeek : null);

  useEffect(() => {
    if (DEMO) return;
    void fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d: { event?: { weekOf: string }; groups: AdminGroup[] }) => {
        setEventWeek(d.event?.weekOf ?? null);
        setGroups(d.groups ?? []);
      });
  }, []);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Admin — Matching</h1>
        <Link href="/admin/agents" style={{ fontWeight: 700 }}>
          Agent traces →
        </Link>
      </div>

      {eventWeek && <Pill tone="neutral">Week of {eventWeek}</Pill>}

      <div style={{ marginTop: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {groups.length === 0 && <p style={{ color: "var(--ink-soft)" }}>No groups yet — run matching first.</p>}
        {groups.map((g) => (
          <Card key={g.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
              <code style={{ fontSize: "var(--text-sm)" }}>{g.id.slice(0, 8)}…</code>
              <Pill tone={g.status === "matched" ? "success" : "neutral"}>{g.status}</Pill>
            </div>
            {g.rationale && (
              <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>
                {g.rationale}
              </p>
            )}
            <table style={{ width: "100%", fontSize: "var(--text-sm)", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "var(--space-2)" }}>Member</th>
                  <th style={{ padding: "var(--space-2)" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {g.members.map((m) => (
                  <tr key={m.userId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "var(--space-2)" }}>{m.name}</td>
                    <td style={{ padding: "var(--space-2)" }}>{Math.round(m.matchScore * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </main>
  );
}
