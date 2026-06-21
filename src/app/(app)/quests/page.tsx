"use client";

import Link from "next/link";
import { Button, Card, Pill } from "@/components/ui";
import { demoGroup, demoPastQuests } from "@/lib/demo";

export default function QuestsPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Your quest log</span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>Every quest so far</h1>
      </div>

      <Card style={{ marginBottom: "var(--space-6)", boxShadow: "var(--shadow-sm), var(--shadow-coral)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
          <span className="meta" style={{ color: "var(--lantern-ink)" }}>This week · in progress</span>
          <Pill tone="coral">Saturday</Pill>
        </div>
        <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>☕ Coffee &amp; a coastal walk</h2>
        <div className="meta" style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
          {demoGroup.venue?.address} · 10:00 · {demoGroup.members.length} in your party
        </div>
        <Link href={`/group/${demoGroup.id}`}>
          <Button variant="primary">View this quest</Button>
        </Link>
      </Card>

      <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
        Completed
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {demoPastQuests.map((q) => (
          <Card key={q.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span style={{ fontSize: "1.8rem" }}>{q.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{q.title}</div>
              <div className="meta" style={{ color: "var(--ink-faint)" }}>{q.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--lantern-ink)" }}>{"★".repeat(q.vibeScore)}</div>
              <div className="meta" style={{ color: "var(--ink-faint)" }}>your vibe</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
