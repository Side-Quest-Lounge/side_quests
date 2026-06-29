"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button, Card, Pill } from "@/components/ui";
import { DEMO } from "@/lib/demo";
import {
  consumeOnboardingNext,
  loadDemoQuizAnswers,
  loadOnboardingDraft,
  saveDemoQuizAnswers,
  saveOnboardingDraft,
  setProfileComplete,
  type OnboardingDraft,
} from "@/lib/onboarding-session";
import { notifyMeProfileUpdated } from "@/lib/api/use-me-profile";
import { quizQuestions } from "@/lib/quiz";

function QuizFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const isRetake = searchParams.get("retake") === "1";
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveLabel, setSaveLabel] = useState("Saving your profile…");
  const [error, setError] = useState<string | null>(null);

  const question = quizQuestions[step];
  const progress = ((step + 1) / quizQuestions.length) * 100;

  useEffect(() => {
    async function init() {
      if (isRetake && DEMO && !isSignedIn) {
        const sessionDraft = loadOnboardingDraft();
        const storedAnswers = loadDemoQuizAnswers();
        if (!sessionDraft || !storedAnswers) {
          router.replace("/onboarding");
          return;
        }
        setDraft(sessionDraft);
        const nums: Record<string, number> = {};
        for (const [k, v] of Object.entries(storedAnswers)) {
          if (typeof v === "number") nums[k] = v;
        }
        setAnswers(nums);
        setReady(true);
        return;
      }

      if (isRetake) {
        const res = await fetch("/api/me/profile");
        if (!res.ok) {
          router.replace("/onboarding");
          return;
        }
        const data = (await res.json()) as {
          user: { name: string; bio: string | null; isNewcomer: boolean };
          profile: { answers: Record<string, number | string> } | null;
        };
        const loaded: OnboardingDraft = {
          name: data.user.name,
          bio: data.user.bio ?? "",
          isNewcomer: data.user.isNewcomer,
        };
        setDraft(loaded);
        saveOnboardingDraft(loaded);
        if (data.profile?.answers) {
          const nums: Record<string, number> = {};
          for (const [k, v] of Object.entries(data.profile.answers)) {
            if (typeof v === "number") nums[k] = v;
          }
          setAnswers(nums);
        }
        setReady(true);
        return;
      }

      const sessionDraft = loadOnboardingDraft();
      if (!sessionDraft) {
        router.replace("/onboarding");
        return;
      }
      setDraft(sessionDraft);
      setReady(true);
    }
    void init();
  }, [isRetake, isSignedIn, router]);

  useEffect(() => {
    if (!saving) {
      setSaveProgress(0);
      return;
    }
    setSaveLabel("Saving your profile…");
    const tick = window.setInterval(() => {
      setSaveProgress((p) => (p >= 88 ? p : p + Math.random() * 6 + 2));
    }, 180);
    return () => window.clearInterval(tick);
  }, [saving]);

  if (!ready || !draft) return null;

  async function finish(finalAnswers: Record<string, number>) {
    setSaving(true);
    setSaveProgress(8);
    setError(null);

    if (DEMO && !isSignedIn) {
      saveDemoQuizAnswers(finalAnswers);
      saveOnboardingDraft(draft!);
      setSaveLabel(isRetake ? "All set — back to profile…" : "All set — taking you home…");
      setSaveProgress(100);
      setProfileComplete(true);
      notifyMeProfileUpdated();
      const nextFromQuery = searchParams.get("next");
      const destination = isRetake
        ? "/profile"
        : (nextFromQuery ?? consumeOnboardingNext("/home"));
      setTimeout(() => router.push(destination), 450);
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft!.name,
          bio: draft!.bio,
          isNewcomer: draft!.isNewcomer,
          answers: finalAnswers,
        }),
      });
    } catch {
      setSaving(false);
      setSaveProgress(0);
      setError("Network error — check your connection and try again.");
      return;
    }
    let result: { embedded?: boolean; error?: string } = {};
    try {
      result = (await res.json()) as { embedded?: boolean; error?: string };
    } catch {
      setSaving(false);
      setSaveProgress(0);
      setError("Could not save profile — server timed out. Try again.");
      return;
    }
    if (!res.ok) {
      setSaving(false);
      setSaveProgress(0);
      if (res.status === 401) {
        setError("Your session expired — please sign in again.");
        setTimeout(() => router.push("/sign-in"), 1500);
        return;
      }
      setError(result.error ?? "Could not save profile. Try again.");
      return;
    }
    if (result.embedded === false) {
      sessionStorage.setItem("sq_embed_pending", "1");
    } else {
      sessionStorage.removeItem("sq_embed_pending");
    }
    setSaveLabel(isRetake ? "All set — back to profile…" : "All set — taking you home…");
    setSaveProgress(100);
    setProfileComplete(true);
    notifyMeProfileUpdated();
    const nextFromQuery = searchParams.get("next");
    const destination = isRetake
      ? "/profile"
      : (nextFromQuery ?? consumeOnboardingNext("/home"));
    setTimeout(() => router.push(destination), 450);
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
        {saving ? (
          <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
            <Pill tone="sunny" style={{ marginBottom: "var(--space-4)" }}>
              Almost there
            </Pill>
            <h1 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>{saveLabel}</h1>
            <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-6)", fontSize: "var(--text-sm)" }}>
              Storing your answers securely
            </p>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "var(--cream-deep)",
                overflow: "hidden",
                marginBottom: "var(--space-3)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${saveProgress}%`,
                  background: "linear-gradient(90deg, var(--lantern) 0%, var(--aqua) 100%)",
                  borderRadius: 999,
                  transition: "width 0.35s ease-out",
                  boxShadow: "0 0 12px rgba(255,178,74,0.45)",
                }}
              />
            </div>
            <p className="meta" style={{ color: "var(--ink-faint)" }}>
              {Math.round(saveProgress)}%
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "var(--space-4)" }}>
              <Pill tone="sunny">{isRetake ? "Retake quiz" : "Step 2 of 2"}</Pill>
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
                  variant={answers[question.id] === n ? "primary" : "ghost"}
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
              <Link href={isRetake ? "/profile" : "/onboarding"} style={{ color: "var(--ink-faint)" }}>
                ← Back
              </Link>
            </p>
          </>
        )}
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
