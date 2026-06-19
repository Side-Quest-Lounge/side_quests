import { expect, test } from "vitest";
import { buildGroups, toVec } from "./matching";

test("builds a group anchored on the seed user, capped at size", () => {
  const cands = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, score: 1 - i * 0.01 }));
  const g = buildGroups(cands, "u0", 6);
  expect(g).toHaveLength(6);
  expect(g[0].userId).toBe("u0");
  expect(g.every(m => typeof m.matchScore === "number")).toBe(true);
});

test("anchor is first even when not the top scorer", () => {
  const cands = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, score: 1 - i * 0.01 }));
  const g = buildGroups(cands, "u15", 6);
  expect(g[0].userId).toBe("u15");
  expect(g[0].matchScore).toBe(1);
  expect(g).toHaveLength(6);
  expect(g.slice(1).some((m) => m.userId === "u15")).toBe(false);
});

test("toVec formats a pgvector literal", () => {
  expect(toVec([0.1, 0.2])).toBe("'[0.1,0.2]'::vector");
});
