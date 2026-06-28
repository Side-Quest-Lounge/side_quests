"use client";

import { useCallback, useEffect, useState } from "react";
import type { PastQuest, MeQuestsResponse } from "./types";

export function useMeQuests(): { loading: boolean; past: PastQuest[] } {
  const [loading, setLoading] = useState(true);
  const [past, setPast] = useState<PastQuest[]>([]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/quests");
      if (!res.ok) {
        setPast([]);
        return;
      }
      const data = (await res.json()) as MeQuestsResponse;
      setPast(data.past ?? []);
    } catch {
      setPast([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { loading, past };
}
