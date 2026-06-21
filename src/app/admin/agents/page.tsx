"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEMO, demoTraces } from "@/lib/demo";

type Trace = {
  id: string;
  userId: string | null;
  tool: string;
  args: unknown;
  result: unknown;
  at: string;
};

export default function AdminAgentsPage() {
  const [traces, setTraces] = useState<Trace[]>(DEMO ? demoTraces : []);

  useEffect(() => {
    if (DEMO) return;
    void fetch("/api/admin/traces")
      .then((r) => r.json())
      .then((d: { traces: Trace[] }) => setTraces(d.traces ?? []));
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Admin — Agent traces</h1>
        <Link href="/admin" style={{ fontWeight: 700 }}>
          ← Matching
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            fontFamily: "ui-monospace, monospace",
            fontSize: "var(--text-sm)",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "var(--space-2)" }}>Time</th>
              <th style={{ padding: "var(--space-2)" }}>User</th>
              <th style={{ padding: "var(--space-2)" }}>Tool</th>
              <th style={{ padding: "var(--space-2)" }}>Args</th>
              <th style={{ padding: "var(--space-2)" }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {traces.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "var(--space-2)", whiteSpace: "nowrap" }}>
                  {new Date(t.at).toLocaleString()}
                </td>
                <td style={{ padding: "var(--space-2)" }}>{t.userId?.slice(0, 12) ?? "—"}</td>
                <td style={{ padding: "var(--space-2)" }}>{t.tool}</td>
                <td style={{ padding: "var(--space-2)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {JSON.stringify(t.args)}
                </td>
                <td style={{ padding: "var(--space-2)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {JSON.stringify(t.result)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {traces.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-4)" }}>No traces yet.</p>
        )}
      </div>
    </main>
  );
}
