import { expect, test } from "vitest";
import { buildGroups } from "./matching";

test("builds a group anchored on the seed user, capped at size", () => {
  const cands = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, score: 1 - i * 0.01 }));
  const g = buildGroups(cands, "u0", 6);
  expect(g).toHaveLength(6);
  expect(g[0].userId).toBe("u0");
  expect(g.every(m => typeof m.matchScore === "number")).toBe(true);
});
