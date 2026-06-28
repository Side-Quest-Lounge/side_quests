import { describe, expect, it } from "vitest";
import {
  OPEN_QUEST_LIMITS,
  openQuestCreateBlockReason,
  readStoredCreateMeta,
  nextStoredCreateMeta,
  trimOpenChatMessages,
} from "./open-quest-limits";

describe("openQuestCreateBlockReason", () => {
  const baseMeta = { customCount: 0, createsToday: 0, lastCreateAt: null, now: 1_000_000 };

  it("blocks when custom quest cap reached", () => {
    expect(
      openQuestCreateBlockReason(
        { title: "Hike", venue: "Mt Eden", capacity: 8 },
        { ...baseMeta, customCount: OPEN_QUEST_LIMITS.maxCustomQuests },
      ),
    ).toBe("custom_limit");
  });

  it("blocks rapid creates", () => {
    expect(
      openQuestCreateBlockReason(
        { title: "Hike", venue: "Mt Eden", capacity: 8 },
        { ...baseMeta, lastCreateAt: baseMeta.now! - 1000 },
      ),
    ).toBe("cooldown");
  });
});

describe("stored create meta", () => {
  it("resets daily count on new UTC day", () => {
    const prev = readStoredCreateMeta(JSON.stringify({ day: "2026-06-27", createsToday: 3, lastCreateAt: 1 }));
    expect(readStoredCreateMeta(JSON.stringify(prev), "2026-06-28").createsToday).toBe(0);
  });

  it("increments createsToday", () => {
    const prev = readStoredCreateMeta(null, "2026-06-28");
    const next = nextStoredCreateMeta(prev, 5000, "2026-06-28");
    expect(next.createsToday).toBe(1);
    expect(next.lastCreateAt).toBe(5000);
  });
});

describe("trimOpenChatMessages", () => {
  it("keeps only the most recent messages", () => {
    const msgs = Array.from({ length: 120 }, (_, i) => i);
    expect(trimOpenChatMessages(msgs)).toEqual(Array.from({ length: 100 }, (_, i) => i + 20));
  });
});
