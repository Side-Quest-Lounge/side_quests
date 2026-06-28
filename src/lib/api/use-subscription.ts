"use client";

import { useCallback, useEffect, useState } from "react";
import { canHostOpenQuest } from "@/lib/seat-access";

type SubscriptionState = {
  loading: boolean;
  status: string;
  canHostOpenQuest: boolean;
  refetch: () => Promise<void>;
};

export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("none");

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) {
        setStatus("none");
        return;
      }
      const data = (await res.json()) as { status: string };
      setStatus(data.status ?? "none");
    } catch {
      setStatus("none");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    loading,
    status,
    canHostOpenQuest: canHostOpenQuest(status),
    refetch,
  };
}
