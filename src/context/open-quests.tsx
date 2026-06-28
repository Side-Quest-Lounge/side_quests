"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { seedOpenEvents, type SeedOpenEvent } from "@/lib/open-quest-seed";
import {
  clampOpenQuestCapacity,
  nextStoredCreateMeta,
  openQuestCreateBlockReason,
  openQuestCreateErrorMessage,
  readStoredCreateMeta,
} from "@/lib/open-quest-limits";
import { openQuestChatId } from "@/lib/open-quest-utils";

export type OpenQuestRecord = SeedOpenEvent;

export type OpenQuest = OpenQuestRecord & { joined: boolean };

export type CreateOpenQuestInput = {
  emoji: string;
  title: string;
  venue: string;
  startsAt: string;
  capacity: number;
  createdBy: string;
};

const JOINED_KEY = "sq_open_quest_joined";
const CUSTOM_KEY = "sq_open_quest_custom";
const CREATE_META_KEY = "sq_open_quest_create_meta";

function readJoined(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(JOINED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function readCustomQuests(): OpenQuestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as OpenQuestRecord[]) : [];
  } catch {
    return [];
  }
}

let joinedCache = readJoined();
let customCache = readCustomQuests();
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

function writeCustomQuests(next: OpenQuestRecord[]): void {
  customCache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
  }
  emit();
}

function getJoinedSnapshot(): Record<string, boolean> {
  return joinedCache;
}

function getCustomSnapshot(): OpenQuestRecord[] {
  return customCache;
}

const SERVER_JOINED_SNAPSHOT: Record<string, boolean> = {};
const SERVER_CUSTOM_SNAPSHOT: OpenQuestRecord[] = [];

function getServerJoinedSnapshot(): Record<string, boolean> {
  return SERVER_JOINED_SNAPSHOT;
}

function getServerCustomSnapshot(): OpenQuestRecord[] {
  return SERVER_CUSTOM_SNAPSHOT;
}

function allBaseQuests(custom: OpenQuestRecord[]): OpenQuestRecord[] {
  const byId = new Map<string, OpenQuestRecord>();
  for (const q of seedOpenEvents) byId.set(q.id, q);
  for (const q of custom) byId.set(q.id, q);
  return [...byId.values()].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

function withJoinState(base: OpenQuestRecord[], joined: Record<string, boolean>): OpenQuest[] {
  return base.map((e) => {
    const isJoined = joined[e.id] ?? false;
    const goingCount = e.going.length + (isJoined ? 1 : 0);
    const spotsLeft = Math.max(0, e.capacity - goingCount);
    return { ...e, spotsLeft, joined: isJoined };
  });
}

type OpenQuestsContextValue = {
  quests: OpenQuest[];
  toggleJoin: (questId: string) => { joined: boolean; chatPath: string | null };
  createQuest: (input: CreateOpenQuestInput) => { quest: OpenQuest | null; error?: string };
  getQuestById: (questId: string) => OpenQuest | undefined;
  getQuestByChatId: (chatId: string) => OpenQuest | undefined;
  joinedQuestIds: string[];
};

const OpenQuestsContext = createContext<OpenQuestsContextValue | null>(null);

export function OpenQuestsProvider({ children }: { children: ReactNode }) {
  const joined = useSyncExternalStore(subscribe, getJoinedSnapshot, getServerJoinedSnapshot);
  const custom = useSyncExternalStore(subscribe, getCustomSnapshot, getServerCustomSnapshot);

  const quests = useMemo(
    () => withJoinState(allBaseQuests(custom), joined),
    [custom, joined],
  );

  const joinedQuestIds = useMemo(
    () => quests.filter((q) => q.joined).map((q) => q.id),
    [quests],
  );

  const getQuestById = useCallback(
    (questId: string) => quests.find((q) => q.id === questId),
    [quests],
  );

  const getQuestByChatId = useCallback(
    (chatId: string) => {
      const questId = chatId.replace(/^open-/, "");
      return quests.find((q) => q.id === questId);
    },
    [quests],
  );

  const toggleJoin = useCallback(
    (questId: string): { joined: boolean; chatPath: string | null } => {
      const base = allBaseQuests(readCustomQuests()).find((e) => e.id === questId);
      if (!base) return { joined: false, chatPath: null };

      const current = { ...readJoined() };
      const wasJoined = current[questId] ?? false;
      const goingCount = base.going.length + (wasJoined ? 1 : 0);
      const spotsLeft = Math.max(0, base.capacity - goingCount);

      if (!wasJoined && spotsLeft <= 0) {
        return { joined: false, chatPath: null };
      }

      if (wasJoined) delete current[questId];
      else current[questId] = true;
      writeJoined(current);

      const nowJoined = !wasJoined;
      return {
        joined: nowJoined,
        chatPath: nowJoined ? `/chat/${openQuestChatId(questId)}` : null,
      };
    },
    [],
  );

  const createQuest = useCallback((input: CreateOpenQuestInput): { quest: OpenQuest | null; error?: string } => {
    const now = Date.now();
    const customQuests = readCustomQuests();
    const storedMeta = readStoredCreateMeta(
      typeof window !== "undefined" ? localStorage.getItem(CREATE_META_KEY) : null,
    );
    const block = openQuestCreateBlockReason(
      { title: input.title, venue: input.venue, capacity: input.capacity },
      {
        customCount: customQuests.length,
        createsToday: storedMeta.createsToday,
        lastCreateAt: storedMeta.lastCreateAt,
        now,
      },
    );
    if (block) {
      return { quest: null, error: openQuestCreateErrorMessage(block) };
    }

    const id = `oe-custom-${now}`;
    const quest: OpenQuestRecord = {
      id,
      emoji: input.emoji.trim() || "✨",
      title: input.title.trim(),
      venue: input.venue.trim(),
      startsAt: input.startsAt,
      when: new Date(input.startsAt).toLocaleString("en-NZ", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }),
      capacity: clampOpenQuestCapacity(input.capacity),
      spotsLeft: clampOpenQuestCapacity(input.capacity),
      going: [input.createdBy],
      createdBy: input.createdBy,
    };

    const next = [...customQuests, quest];
    writeCustomQuests(next);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        CREATE_META_KEY,
        JSON.stringify(nextStoredCreateMeta(storedMeta, now)),
      );
    }

    const joinedState = { ...readJoined(), [id]: true };
    writeJoined(joinedState);

    return {
      quest: { ...quest, joined: true, spotsLeft: quest.capacity - 1 },
    };
  }, []);

  const value = useMemo(
    () => ({
      quests,
      toggleJoin,
      createQuest,
      getQuestById,
      getQuestByChatId,
      joinedQuestIds,
    }),
    [quests, toggleJoin, createQuest, getQuestById, getQuestByChatId, joinedQuestIds],
  );

  return <OpenQuestsContext.Provider value={value}>{children}</OpenQuestsContext.Provider>;
}

export function useOpenQuests(): OpenQuestsContextValue {
  const ctx = useContext(OpenQuestsContext);
  if (!ctx) throw new Error("useOpenQuests must be used within OpenQuestsProvider");
  return ctx;
}
