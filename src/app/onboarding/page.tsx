"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button, Card, Field, Pill } from "@/components/ui";
import { clerkDisplayName, resolveDisplayName } from "@/components/user-display";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { saveOnboardingDraft, saveOnboardingNext } from "@/lib/onboarding-session";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { loading, hasProfile, user } = useMeProfile();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isNewcomer, setIsNewcomer] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (hasProfile && !next) {
      router.replace("/profile");
      return;
    }
    if (user) {
      const clerkName =
        clerkLoaded && clerkUser ? clerkDisplayName(clerkUser) : "";
      setName(resolveDisplayName(user.name, hasProfile, clerkName));
      setBio(user.bio ?? "");
      setIsNewcomer(user.isNewcomer);
    }
  }, [loading, hasProfile, next, user, clerkUser, clerkLoaded, router]);

  if (loading || (hasProfile && !next)) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Card style={{ maxWidth: 480, width: "100%" }}>
          <p style={{ color: "var(--ink-soft)" }}>Loading…</p>
        </Card>
      </main>
    );
  }

  function continueToQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    saveOnboardingDraft({ name: name.trim(), bio: bio.trim(), isNewcomer });
    if (next) saveOnboardingNext(next);
    const quizUrl = next ? `/quiz?next=${encodeURIComponent(next)}` : "/quiz";
    router.push(quizUrl);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--space-5)",
      }}
    >
      <Card style={{ maxWidth: 480, width: "100%" }}>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-lg)" }}>
          Side&nbsp;Quest
        </Link>
        <div style={{ margin: "var(--space-4) 0 var(--space-2)" }}>
          <Pill tone="sunny">Step 1 of 2</Pill>
        </div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>Tell us a little</h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-6)" }}>
          A short intro helps your concierge match you with the right people.
        </p>

        <form onSubmit={continueToQuiz} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Field
            label="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="given-name"
          />
          <Field
            label="Short bio"
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What are you into? Just moved here?"
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
          <Button variant="primary" type="submit" style={{ minHeight: 52 }}>
            Continue to vibe quiz →
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh" }} />}>
      <OnboardingForm />
    </Suspense>
  );
}
