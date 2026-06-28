/**
 * Browser sessionStorage for onboarding draft + profile-gate redirect.
 * Used in demo mode only for profile-complete flag; production uses /api/me/profile.
 */
export type OnboardingDraft = {
  name: string;
  bio: string;
  isNewcomer: boolean;
};

const DRAFT_KEY = "sq_onboarding_draft";
const COMPLETE_KEY = "sq_profile_complete";
const NEXT_KEY = "sq_onboarding_next";

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
