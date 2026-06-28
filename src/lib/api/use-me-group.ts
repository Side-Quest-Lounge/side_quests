"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO, demoGroup } from "@/lib/demo";
import type { MeGroup, MeGroupResponse } from "./types";

type MeGroupState = {
  loading: boolean;
  error: string | null;
  group: MeGroup | null;
  groupId: string | null;
  refetch: () => Promise<void>;
};

export function useMeGroup(): MeGroupState {
  const [loading, setLoading] = useState(!DEMO);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<MeGroup | null>(null);

  const refetch = useCallback(async () => {
    if (DEMO) {
      setGroup(demoGroup as MeGroup);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/group");
      if (res.status === 401) {
        setGroup(null);
        setError("unauth");
        return;
      }
      if (!res.ok) {
        setError("Could not load group");
        setGroup(null);
        return;
      }
      const data = (await res.json()) as MeGroupResponse;
      setGroup(data.group);
    } catch {
      setError("Could not load group");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    loading,
    error,
    group,
    groupId: group?.id ?? null,
    refetch,
  };
}
