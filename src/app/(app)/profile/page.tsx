"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Button, Card, Field, Pill } from "@/components/ui";
import { notifyMeProfileUpdated, useMeProfile } from "@/lib/api/use-me-profile";

export default function ProfilePage() {
  const router = useRouter();
  const { loading, user, hasProfile, refetch } = useMeProfile();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isNewcomer, setIsNewcomer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedPending, setEmbedPending] = useState(false);

  useEffect(() => {
    setEmbedPending(sessionStorage.getItem("sq_embed_pending") === "1");
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio ?? "");
    setIsNewcomer(user.isNewcomer);
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), bio: bio.trim(), isNewcomer }),
    });

    setSaving(false);
    const body = (await res.json().catch(() => ({}))) as { error?: string; embedded?: boolean };
    if (!res.ok) {
      setError(body.error ?? "Could not save changes");
      return;
    }
    if (body.embedded === false) {
      sessionStorage.setItem("sq_embed_pending", "1");
      setEmbedPending(true);
    } else if (body.embedded === true) {
      sessionStorage.removeItem("sq_embed_pending");
      setEmbedPending(false);
    }
    setSaved(true);
    void refetch();
    notifyMeProfileUpdated();
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <Card>
          <p style={{ color: "var(--ink-soft)" }}>Loading profile…</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Your profile</span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>Edit profile</h1>
      </div>

      {embedPending && (
        <Card
          style={{
            marginBottom: "var(--space-5)",
            borderColor: "var(--lantern)",
            background: "var(--cream)",
          }}
        >
          <Pill tone="sunny" style={{ marginBottom: "var(--space-2)" }}>
            Matching profile pending
          </Pill>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)", margin: 0 }}>
            Your quiz answers are saved, but AWS Bedrock couldn&apos;t build your matching profile yet
            (rate limit). Wait 30–60 minutes, then retake the quiz or run{" "}
            <code style={{ fontSize: "0.85em" }}>npm run embed:user</code> in the project.
          </p>
        </Card>
      )}

      <Card style={{ marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
          <Avatar name={name || "Friend"} size={64} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>{name || "Friend"}</div>
            {hasProfile ? (
              <Pill tone="success" style={{ marginTop: "var(--space-2)" }}>
                Vibe quiz complete
              </Pill>
            ) : (
              <Pill tone="coral" style={{ marginTop: "var(--space-2)" }}>
                Finish setup
              </Pill>
            )}
          </div>
        </div>

        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Field
            label="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="given-name"
          />
          <Field
            label="Short bio"
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What are you into?"
            hint="Optional — a sentence or two is plenty."
          />
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isNewcomer}
              onChange={(e) => setIsNewcomer(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 600 }}>I&apos;m new to Auckland (or recently moved)</span>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span style={{ color: "var(--success-fg)", fontWeight: 700 }}>Saved ✓</span>}
          </div>
          {error && <p style={{ color: "var(--coral)", fontWeight: 600 }}>{error}</p>}
        </form>
      </Card>

      {hasProfile && (
        <Card>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>Vibe quiz</h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)", fontSize: "var(--text-sm)" }}>
            Your answers help the concierge match you with the right people.
          </p>
          <Link href="/quiz?retake=1" className="dash-link">
            Retake vibe quiz →
          </Link>
        </Card>
      )}

      {!hasProfile && (
        <Card>
          <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
            Complete the vibe quiz so we can match you with your first party.
          </p>
          <Button variant="primary" onClick={() => router.push("/onboarding")}>
            Finish setup →
          </Button>
        </Card>
      )}
    </div>
  );
}
