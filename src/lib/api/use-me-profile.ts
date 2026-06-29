"use client";

/** Client hook: signed-in user + profile row from GET /api/me/profile. */
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { clerkDisplayName } from "@/lib/display-name";
import { DEMO, DEMO_GUEST_NAME } from "@/lib/demo";
import {
  isProfileComplete,
  loadDemoQuizAnswers,
  loadOnboardingDraft,
} from "@/lib/onboarding-session";
import type { MeProfileResponse } from "./types";

export const ME_PROFILE_UPDATED = "sq-me-profile-updated";

let cachedProfile: MeProfileResponse | null = null;
let inflightProfile: Promise<MeProfileResponse | null> | null = null;

export function invalidateMeProfileCache(): void {
  cachedProfile = null;
}

export function notifyMeProfileUpdated(): void {
  invalidateMeProfileCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ME_PROFILE_UPDATED));
  }
}

async function fetchMeProfile(): Promise<MeProfileResponse | null> {
  if (cachedProfile) return cachedProfile;
  if (inflightProfile) return inflightProfile;

  inflightProfile = (async () => {
    try {
      const res = await fetch("/api/me/profile");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Could not load profile");
      const data = (await res.json()) as MeProfileResponse;
      cachedProfile = data;
      return data;
    } finally {
      inflightProfile = null;
    }
  })();

  return inflightProfile;
}

type MeProfileState = {
  loading: boolean;
  error: string | null;
  user: MeProfileResponse["user"] | null;
  profile: MeProfileResponse["profile"];
  hasProfile: boolean;
  refetch: () => Promise<void>;
};

export function useMeProfile(): MeProfileState {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<MeProfileResponse["user"] | null>(null);
  const [profile, setProfile] = useState<MeProfileResponse["profile"]>(null);

  const applyDemoGuestState = useCallback(() => {
    if (!clerkLoaded) {
      setLoading(true);
      return;
    }
    const demoName =
      isSignedIn && clerkUser ? clerkDisplayName(clerkUser) : DEMO_GUEST_NAME;
    const draft = loadOnboardingDraft();
    setUser({
      name: draft?.name ?? demoName,
      bio: draft?.bio ? draft.bio : null,
      isNewcomer: draft?.isNewcomer ?? true,
    });
    setProfile(
      isProfileComplete()
        ? { answers: loadDemoQuizAnswers() ?? {} }
        : null,
    );
    setLoading(false);
    setError(null);
  }, [clerkLoaded, isSignedIn, clerkUser]);

  const refetch = useCallback(async () => {
    if (DEMO && !isSignedIn) {
      applyDemoGuestState();
      return;
    }

    if (!clerkLoaded) {
      setLoading(true);
      return;
    }

    if (!isSignedIn) {
      setUser(null);
      setProfile(null);
      setError("unauth");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeProfile();
      if (!data) {
        setUser(null);
        setProfile(null);
        setError("unauth");
        return;
      }
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setError("Could not load profile");
    } finally {
      setLoading(false);
    }
  }, [applyDemoGuestState, clerkLoaded, isSignedIn]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const onUpdate = () => void refetch();
    window.addEventListener(ME_PROFILE_UPDATED, onUpdate);
    return () => window.removeEventListener(ME_PROFILE_UPDATED, onUpdate);
  }, [refetch]);

  const displayUser =
    user ??
    (isSignedIn && clerkUser
      ? {
          name: clerkDisplayName(clerkUser),
          bio: null,
          isNewcomer: true,
        }
      : null);

  return {
    loading,
    error,
    user: displayUser,
    profile,
    hasProfile: !!profile,
    refetch,
  };
}
