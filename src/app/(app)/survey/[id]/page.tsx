"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Field } from "@/components/ui";
import { DEMO } from "@/lib/demo";

export default function SurveyPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const [vibeScore, setVibeScore] = useState(4);
  const [openText, setOpenText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (DEMO) {
      setDone(true);
      setTimeout(() => router.push("/home"), 2000);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, vibeScore, openText }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/home"), 2000);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <Card>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-4)" }}>
          How was your Side Quest?
        </h1>

        {done ? (
          <p style={{ color: "var(--success-fg)", fontWeight: 700 }}>
            Thanks! Your agent will use this to tune your next match.
          </p>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: "var(--space-5)" }}>
              <span style={{ fontWeight: 700, display: "block", marginBottom: "var(--space-2)" }}>
                Vibe rating (1–5)
              </span>
              <input
                type="range"
                min={1}
                max={5}
                value={vibeScore}
                onChange={(e) => setVibeScore(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--lantern)" }}
              />
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 800 }}>{vibeScore}</span>
            </label>

            <Field
              label="Anything your agent should know?"
              multiline
              rows={4}
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              placeholder="e.g. I loved the outdoor vibe but prefer smaller groups…"
            />

            <div style={{ marginTop: "var(--space-5)" }}>
              <Button variant="primary" onClick={() => void submit()} disabled={loading}>
                {loading ? "Saving…" : "Submit feedback"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
