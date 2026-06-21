"use client";

import { useState } from "react";
import { Avatar, Button, Card, Field, Pill } from "@/components/ui";
import { demoUser } from "@/lib/demo";

const sizeOptions = ["Just a few (3–4)", "Small group (5–6)", "Bigger crowd (7+)"];

export default function YouPage() {
  const [size, setSize] = useState(sizeOptions[0]);
  const [saved, setSaved] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Card style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <Avatar name={demoUser.name} size={64} />
        <div>
          <h1 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-1)" }}>{demoUser.name}</h1>
          <div style={{ color: "var(--ink-soft)" }}>{demoUser.blurb}</div>
          <div style={{ marginTop: "var(--space-2)" }}>
            <Pill tone="sunny">{demoUser.joinedAt}</Pill>
          </div>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>Your preferences</h2>
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <Field
            label="What are you into?"
            multiline
            rows={3}
            defaultValue="Coffee, coastal walks, live music, board games, trying new food spots."
          />
          <Field
            label="When are you usually free?"
            defaultValue="Weekend mornings, Wednesday evenings"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>Group size you prefer</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {sizeOptions.map((opt) => {
                const active = size === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSize(opt)}
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "var(--radius-pill)",
                      border: active ? "1.5px solid var(--lantern)" : "1.5px solid var(--border-strong)",
                      background: active ? "var(--coral-tint)" : "transparent",
                      color: active ? "var(--lantern-ink)" : "var(--ink-soft)",
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Button variant="primary" type="submit">
              Save preferences
            </Button>
            {saved && <span style={{ color: "var(--success-fg)", fontWeight: 700 }}>Saved ✓</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
