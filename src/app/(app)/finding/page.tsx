"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button, Card } from "@/components/ui";
import { DEMO, DEMO_GROUP_ID } from "@/lib/demo";

type GroupPreview = { id: string } | null;

export default function FindingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Scanning Auckland for your party…");
  const [error, setError] = useState<string | null>(null);

  const checkGroup = useCallback(async () => {
    const res = await fetch("/api/me/group");
    if (!res.ok) return null;
    const data = (await res.json()) as { group: GroupPreview & { rationale?: string } };
    if (data.group?.id && data.group.rationale) {
      router.push(`/group/${data.group.id}`);
      return data.group;
    }
    return data.group;
  }, [router]);

  useEffect(() => {
    if (DEMO) return;
    const interval = setInterval(() => {
      void checkGroup();
    }, 3000);
    void checkGroup();
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
      if (!matchRes.ok) {
        const err = (await matchRes.json()) as { error?: string };
        throw new Error(err.error ?? "match failed");
      }
      const { groupId } = (await matchRes.json()) as { groupId: string };
      setStatus("Concierge is composing your reveal…");

      const revealRes = await fetch("/api/agent/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!revealRes.ok) throw new Error("reveal failed");

      router.push(`/group/${groupId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("Still looking…");
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
          The concierge is gathering a small party for one low-key activity. Hang tight — or
          assemble it now for the demo.
        </p>
        {error && (
          <p style={{ color: "var(--ember)", marginBottom: "var(--space-4)", fontWeight: 600 }}>
            {error}
          </p>
        )}
        <Button variant="primary" onClick={() => void runMatching()} disabled={loading}>
          {loading ? "Assembling…" : "Assemble my party (demo)"}
        </Button>
      </Card>
    </div>
  );
}
