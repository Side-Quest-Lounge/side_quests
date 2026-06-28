/** Client-side caps for open quests (localStorage demo layer — no Aurora writes). */

export const OPEN_QUEST_LIMITS = {
  /** Max user-created quests stored in this browser. */
  maxCustomQuests: 5,
  /** Max new quests a browser can create per calendar day (UTC). */
  maxCreatesPerDay: 3,
  /** Minimum ms between create attempts. */
  minCreateIntervalMs: 60_000,
  maxTitleLength: 80,
  maxVenueLength: 120,
  minCapacity: 2,
  maxCapacity: 20,
  /** Max messages stored per open-quest chat in localStorage. */
  maxChatMessages: 100,
} as const;

export type OpenQuestCreateMeta = {
  customCount: number;
  createsToday: number;
  lastCreateAt: number | null;
  now?: number;
};

export type OpenQuestCreateBlockReason =
  | "title_required"
  | "venue_required"
  | "title_too_long"
  | "venue_too_long"
  | "custom_limit"
  | "daily_limit"
  | "cooldown";

export function openQuestCreateBlockReason(
  input: { title: string; venue: string; capacity: number },
  meta: OpenQuestCreateMeta,
): OpenQuestCreateBlockReason | null {
  const title = input.title.trim();
  const venue = input.venue.trim();
  const now = meta.now ?? Date.now();
  const { maxTitleLength, maxVenueLength, maxCustomQuests, maxCreatesPerDay, minCreateIntervalMs } =
    OPEN_QUEST_LIMITS;

  if (!title) return "title_required";
  if (!venue) return "venue_required";
  if (title.length > maxTitleLength) return "title_too_long";
  if (venue.length > maxVenueLength) return "venue_too_long";
  if (meta.customCount >= maxCustomQuests) return "custom_limit";
  if (meta.createsToday >= maxCreatesPerDay) return "daily_limit";
  if (meta.lastCreateAt != null && now - meta.lastCreateAt < minCreateIntervalMs) return "cooldown";

  return null;
}

export function openQuestCreateErrorMessage(reason: OpenQuestCreateBlockReason): string {
  switch (reason) {
    case "title_required":
    case "venue_required":
      return "Title and venue are required.";
    case "title_too_long":
      return `Title must be ${OPEN_QUEST_LIMITS.maxTitleLength} characters or fewer.`;
    case "venue_too_long":
      return `Venue must be ${OPEN_QUEST_LIMITS.maxVenueLength} characters or fewer.`;
    case "custom_limit":
      return `You can host up to ${OPEN_QUEST_LIMITS.maxCustomQuests} open quests in this browser.`;
    case "daily_limit":
      return `You can create up to ${OPEN_QUEST_LIMITS.maxCreatesPerDay} open quests per day.`;
    case "cooldown":
      return "Please wait a minute before creating another quest.";
  }
}

export function clampOpenQuestCapacity(capacity: number): number {
  return Math.min(
    OPEN_QUEST_LIMITS.maxCapacity,
    Math.max(OPEN_QUEST_LIMITS.minCapacity, capacity),
  );
}

export function trimOpenChatMessages<T>(messages: T[]): T[] {
  const { maxChatMessages } = OPEN_QUEST_LIMITS;
  if (messages.length <= maxChatMessages) return messages;
  return messages.slice(-maxChatMessages);
}

/** Persisted under sq_open_quest_create_meta in localStorage. */
export type StoredCreateMeta = {
  day: string;
  createsToday: number;
  lastCreateAt: number | null;
};

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function readStoredCreateMeta(raw: string | null, day = todayUtc()): StoredCreateMeta {
  if (!raw) return { day, createsToday: 0, lastCreateAt: null };
  try {
    const parsed = JSON.parse(raw) as StoredCreateMeta;
    if (parsed.day !== day) return { day, createsToday: 0, lastCreateAt: parsed.lastCreateAt };
    return {
      day,
      createsToday: Math.max(0, parsed.createsToday ?? 0),
      lastCreateAt: parsed.lastCreateAt ?? null,
    };
  } catch {
    return { day, createsToday: 0, lastCreateAt: null };
  }
}

export function nextStoredCreateMeta(prev: StoredCreateMeta, now: number, day = todayUtc()): StoredCreateMeta {
  const base = prev.day === day ? prev : { day, createsToday: 0, lastCreateAt: prev.lastCreateAt };
  return { day, createsToday: base.createsToday + 1, lastCreateAt: now };
}
