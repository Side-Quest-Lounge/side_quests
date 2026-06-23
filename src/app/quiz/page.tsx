"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import {
  consumeOnboardingNext,
  loadOnboardingDraft,
  setProfileComplete,
} from "@/lib/onboarding-session";
import { quizQuestions } from "@/lib/quiz";

function QuizFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = loadOnboardingDraft();
  const question = quizQuestions[step];
  const progress = ((step + 1) / quizQuestions.length) * 100;

  useEffect(() => {
    if (!draft) router.replace("/onboarding");
  }, [draft, router]);

  if (!draft) return null;

  async function finish(finalAnswers: Record<string, number>) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft!.name,
        bio: draft!.bio,
        isNewcomer: draft!.isNewcomer,
        answers: finalAnswers,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save profile. Try again.");
      return;
    }
    setProfileComplete(true);
    const nextFromQuery = searchParams.get("next");
    const destination = nextFromQuery ?? consumeOnboardingNext("/home");
    router.push(destination);
  }

  function pick(score: number) {
    const nextAnswers = { ...answers, [question.id]: score };
    setAnswers(nextAnswers);
    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
      return;
    }
    void finish(nextAnswers);
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
      <Card style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Pill tone="sunny">Step 2 of 2</Pill>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "var(--cream-deep)",
            marginBottom: "var(--space-5)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--lantern)",
              borderRadius: 999,
              transition: "width 0.25s ease",
            }}
          />
        </div>
        <p className="meta" style={{ marginBottom: "var(--space-2)" }}>
          Question {step + 1} of {quizQuestions.length}
        </p>
        <h1 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-6)", lineHeight: 1.35 }}>
          {question.text}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              variant={answers[question.id] === n ? "accent" : "ghost"}
              onClick={() => pick(n)}
              disabled={saving}
              style={{ justifyContent: "space-between", minHeight: 48 }}
            >
              <span>{n === 1 ? "Not me" : n === 5 ? "Very me" : n}</span>
              <span className="meta">{n}</span>
            </Button>
          ))}
        </div>
        {error && <p style={{ color: "var(--coral)", marginTop: "var(--space-4)", fontWeight: 600 }}>{error}</p>}
        <p style={{ marginTop: "var(--space-5)", fontSize: "var(--text-sm)" }}>
          <Link href="/onboarding" style={{ color: "var(--ink-faint)" }}>
            ← Back
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh" }} />}>
      <QuizFlow />
    </Suspense>
  );
}
