"use client";

/** Client hook: signed-in user + profile row from GET /api/me/profile. */
import { useCallback, useEffect, useState } from "react";
import { DEMO } from "@/lib/demo";
import { isProfileComplete } from "@/lib/onboarding-session";
import type { MeProfileResponse } from "./types";

export const ME_PROFILE_UPDATED = "sq-me-profile-updated";

export function notifyMeProfileUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ME_PROFILE_UPDATED));
  }
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
  const [loading, setLoading] = useState(!DEMO);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<MeProfileResponse["user"] | null>(null);
  const [profile, setProfile] = useState<MeProfileResponse["profile"]>(null);

  const refetch = useCallback(async () => {
    if (DEMO) {
      setUser({ name: "Alex", bio: null, isNewcomer: true });
      setProfile(isProfileComplete() ? { answers: {} } : null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile");
      if (res.status === 401) {
        setUser(null);
        setProfile(null);
        setError("unauth");
        return;
      }
      if (!res.ok) {
        setError("Could not load profile");
        return;
      }
      const data = (await res.json()) as MeProfileResponse;
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setError("Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const onUpdate = () => void refetch();
    window.addEventListener(ME_PROFILE_UPDATED, onUpdate);
    return () => window.removeEventListener(ME_PROFILE_UPDATED, onUpdate);
  }, [refetch]);

  return {
    loading,
    error,
    user,
    profile,
    hasProfile: DEMO ? isProfileComplete() : !!profile,
    refetch,
  };
}
