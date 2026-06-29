/**
 * Browser sessionStorage for onboarding draft + profile-gate redirect.
 * Production profile state comes from /api/me/profile.
 */
export type OnboardingDraft = {
  name: string;
  bio: string;
  isNewcomer: boolean;
};

const DRAFT_KEY = "sq_onboarding_draft";
const COMPLETE_KEY = "sq_profile_complete";
const NEXT_KEY = "sq_onboarding_next";
const DEMO_ANSWERS_KEY = "sq_demo_quiz_answers";

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function setProfileComplete(complete: boolean): void {
  if (typeof window === "undefined") return;
  if (complete) sessionStorage.setItem(COMPLETE_KEY, "1");
  else sessionStorage.removeItem(COMPLETE_KEY);
}

export function isProfileComplete(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(COMPLETE_KEY) === "1";
}

export function saveDemoQuizAnswers(answers: Record<string, number | string>): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEMO_ANSWERS_KEY, JSON.stringify(answers));
}

export function loadDemoQuizAnswers(): Record<string, number | string> | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(DEMO_ANSWERS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, number | string>;
  } catch {
    return null;
  }
}

export function saveOnboardingNext(path: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(NEXT_KEY, path);
}

export function consumeOnboardingNext(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const next = sessionStorage.getItem(NEXT_KEY) ?? fallback;
  sessionStorage.removeItem(NEXT_KEY);
  return next;
}

/** Clear browser-only demo guest state (quiz draft, profile gate, etc.). */
export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(COMPLETE_KEY);
  sessionStorage.removeItem(NEXT_KEY);
  sessionStorage.removeItem(DEMO_ANSWERS_KEY);
  sessionStorage.removeItem("sq_embed_pending");
}
