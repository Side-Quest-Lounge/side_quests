"use client";

import { useState } from "react";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { demoOpenEvents } from "@/lib/demo";

export default function ExplorePage() {
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Open quests</span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>
          Jump into something this week
        </h1>
        <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-2)", maxWidth: "52ch" }}>
          Beyond your matched party, anyone can join these open quests around Tāmaki Makaurau. No
          pressure — show up if it sounds fun.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-5)" }}>
        {demoOpenEvents.map((e) => {
          const isJoined = joined[e.id] ?? false;
          return (
            <Card key={e.id} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
                <span style={{ fontSize: "2rem" }}>{e.emoji}</span>
                <Pill tone={e.spotsLeft <= 2 ? "coral" : "success"}>
                  {e.spotsLeft} spot{e.spotsLeft === 1 ? "" : "s"} left
                </Pill>
              </div>

              <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>{e.title}</h2>
              <div className="meta" style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
                {e.when} · {e.venue}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "auto" }}>
                <div style={{ display: "flex" }}>
                  {e.going.slice(0, 4).map((name, i) => (
                    <Avatar key={name} name={name} size={30} style={{ marginLeft: i === 0 ? 0 : -10, border: "2px solid var(--surface-raw)" }} />
                  ))}
                </div>
                <span className="meta" style={{ color: "var(--ink-faint)" }}>
                  {e.going.length} going
                </span>
              </div>

              <Button
                variant={isJoined ? "accent" : "primary"}
                onClick={() => setJoined((j) => ({ ...j, [e.id]: !j[e.id] }))}
                style={{ width: "100%", marginTop: "var(--space-4)" }}
              >
                {isJoined ? "You're in 🎉 · tap to leave" : "Join this quest"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
