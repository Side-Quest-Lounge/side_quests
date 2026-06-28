import { describe, expect, it } from "vitest";
import { canViewFullQuest, hasActiveSeat } from "./seat-access";

describe("seat-access", () => {
  it("treats active as paid seat", () => {
    expect(hasActiveSeat("active")).toBe(true);
    expect(hasActiveSeat("none")).toBe(false);
  });

  it("unlocks full quest only when paid (non-demo)", () => {
    expect(canViewFullQuest("active")).toBe(true);
    expect(canViewFullQuest("none")).toBe(false);
  });
});
