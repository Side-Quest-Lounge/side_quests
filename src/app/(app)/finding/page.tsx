"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button, Card } from "@/components/ui";
import { DEMO, DEMO_GROUP_ID } from "@/lib/demo";

type GroupPreview = { id: string; rationale?: string } | null;

const MATCH_HINTS: Record<string, string> = {
  no_embedding:
    "Your vibe quiz needs an embedding first. Re-save your quiz (Bedrock must be enabled), then try again.",
  no_open_event: "No open quest this week in the database. Run npm run seed against Aurora.",
  not_enough_candidates: "Not enough profiles to form a party. Run npm run seed (needs ~40 embedded users).",
  reveal_failed: "Matching worked but the concierge reveal failed. Try again in a moment.",
  unauth: "Please sign in again, then return here.",
};

function matchErrorMessage(code: string, fallback?: string): string {
  return MATCH_HINTS[code] ?? fallback ?? "Something went wrong — try again.";
}

export default function FindingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Scanning Auckland for your party…");
  const [error, setError] = useState<string | null>(null);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const finishReveal = useCallback(
    async (groupId: string) => {
      setStatus("Concierge is composing your reveal…");
      const revealRes = await fetch("/api/agent/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!revealRes.ok) {
        throw new Error("reveal_failed");
      }
      router.push(`/group/${groupId}`);
    },
    [router],
  );

  const checkGroup = useCallback(async () => {
    if (DEMO) return null;
    const res = await fetch("/api/me/group");
    if (!res.ok) return null;
    const data = (await res.json()) as { group: GroupPreview };
    if (!data.group?.id) return null;
    if (data.group.rationale) {
      router.push(`/group/${data.group.id}`);
      return data.group;
    }
    setPendingGroupId(data.group.id);
    setStatus("Your party is matched — ready for the reveal");
    return data.group;
  }, [router]);

  useEffect(() => {
    if (DEMO) return;
    void checkGroup();
    const interval = setInterval(() => void checkGroup(), 4000);
    return () => clearInterval(interval);
  }, [checkGroup]);

  async function runMatching() {
    if (DEMO) {
      setLoading(true);
      setStatus("Concierge is composing your reveal…");
      setTimeout(() => router.push(`/group/${DEMO_GROUP_ID}`), 1100);
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Running matching round…");
    try {
      const matchRes = await fetch("/api/match", { method: "POST" });
      const matchBody = (await matchRes.json()) as {
        groupId?: string;
        created?: boolean;
        error?: string;
        message?: string;
      };
      if (!matchRes.ok || !matchBody.groupId) {
        throw new Error(matchBody.error ?? "match_failed");
      }

      setPendingGroupId(matchBody.groupId);
      setStatus(matchBody.created ? "Party matched — one moment…" : "Resuming your matched party…");
      await finishReveal(matchBody.groupId);
    } catch (e) {
      const code = e instanceof Error ? e.message : "match_failed";
      setError(matchErrorMessage(code));
      setStatus("Still looking…");
    } finally {
      setLoading(false);
    }
  }

  async function resumeReveal() {
    if (!pendingGroupId) return;
    setLoading(true);
    setError(null);
    try {
      await finishReveal(pendingGroupId);
    } catch {
      setError(matchErrorMessage("reveal_failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) 0",
      }}
    >
      <Card style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 52,
            height: 52,
            margin: "0 auto var(--space-4)",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ffe7b0, var(--lantern) 55%, var(--lantern-deep))",
            boxShadow: "0 0 36px rgba(255,178,74,0.6)",
          }}
        />
        <span className="meta">Quest in progress</span>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-3) 0" }}>{status}</h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-6)" }}>
          {DEMO
            ? "The concierge is gathering a small party for one low-key activity. Hang tight — or assemble it now for the demo."
            : "We match you into a party of six using pgvector similarity on your vibe quiz answers."}
        </p>
        {error && (
          <p style={{ color: "var(--ember)", marginBottom: "var(--space-4)", fontWeight: 600 }}>
            {error}
          </p>
        )}
        {pendingGroupId && !loading && !DEMO ? (
          <Button variant="primary" onClick={() => void resumeReveal()} disabled={loading} style={{ marginBottom: "var(--space-3)" }}>
            Complete reveal →
          </Button>
        ) : null}
        <Button variant="primary" onClick={() => void runMatching()} disabled={loading}>
          {loading
            ? "Working…"
            : DEMO
              ? "Assemble my party (demo)"
              : pendingGroupId
                ? "Retry matching"
                : "Find my party →"}
        </Button>
        {!DEMO && (
          <p style={{ marginTop: "var(--space-4)" }}>
            <button
              type="button"
              onClick={() => router.push("/home")}
              style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer", fontSize: "var(--text-sm)" }}
            >
              ← Back to home
            </button>
          </p>
        )}
      </Card>
    </div>
  );
}
