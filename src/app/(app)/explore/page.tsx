"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { useOpenQuests } from "@/context/open-quests";

function ExploreContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("quest");
  const { quests, toggleJoin } = useOpenQuests();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightId) return;
    const el = cardRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-5)" }}>
      {quests.map((e) => {
        const isHighlighted = highlightId === e.id;
        return (
          <Card
            key={e.id}
            ref={(node) => {
              cardRefs.current[e.id] = node;
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              outline: isHighlighted ? "2px solid var(--lantern)" : undefined,
              boxShadow: isHighlighted ? "var(--shadow-md), 0 0 0 4px rgba(255,178,74,0.25)" : undefined,
            }}
          >
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
              variant={e.joined ? "accent" : "primary"}
              onClick={() => toggleJoin(e.id)}
              disabled={!e.joined && e.spotsLeft <= 0}
              style={{ width: "100%", marginTop: "var(--space-4)" }}
            >
              {e.joined ? "You're in 🎉 · tap to leave" : e.spotsLeft <= 0 ? "Full" : "Join this quest"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

export default function ExplorePage() {
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

      <Suspense fallback={<p style={{ color: "var(--ink-soft)" }}>Loading quests…</p>}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
