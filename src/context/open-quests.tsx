"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { demoOpenEvents, type DemoOpenEvent } from "@/lib/demo";

export type OpenQuest = DemoOpenEvent & { joined: boolean };

const JOINED_KEY = "sq_open_quest_joined";

function readJoined(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(JOINED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

let joinedCache = readJoined();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((l) => l());
}

function writeJoined(next: Record<string, boolean>): void {
  joinedCache = next;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(JOINED_KEY, JSON.stringify(next));
  }
  emit();
}

function getSnapshot(): Record<string, boolean> {
  return joinedCache;
}

/** Stable empty snapshot for SSR — must not allocate a new object per call. */
const SERVER_JOINED_SNAPSHOT: Record<string, boolean> = {};

function getServerSnapshot(): Record<string, boolean> {
  return SERVER_JOINED_SNAPSHOT;
}

type OpenQuestsContextValue = {
  quests: OpenQuest[];
  toggleJoin: (questId: string) => void;
};

const OpenQuestsContext = createContext<OpenQuestsContextValue | null>(null);

export function OpenQuestsProvider({ children }: { children: ReactNode }) {
  const joined = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const quests = useMemo((): OpenQuest[] => {
    return demoOpenEvents.map((e) => {
      const isJoined = joined[e.id] ?? false;
      return {
        ...e,
        spotsLeft: Math.max(0, e.spotsLeft - (isJoined ? 1 : 0)),
        joined: isJoined,
      };
    });
  }, [joined]);

  const toggleJoin = useCallback((questId: string) => {
    const base = demoOpenEvents.find((e) => e.id === questId);
    if (!base) return;
    const current = { ...readJoined() };
    const wasJoined = current[questId] ?? false;
    if (!wasJoined && base.spotsLeft <= 0) return;
    if (wasJoined) delete current[questId];
    else current[questId] = true;
    writeJoined(current);
  }, []);

  const value = useMemo(() => ({ quests, toggleJoin }), [quests, toggleJoin]);

  return <OpenQuestsContext.Provider value={value}>{children}</OpenQuestsContext.Provider>;
}

export function useOpenQuests(): OpenQuestsContextValue {
  const ctx = useContext(OpenQuestsContext);
  if (!ctx) throw new Error("useOpenQuests must be used within OpenQuestsProvider");
  return ctx;
}
