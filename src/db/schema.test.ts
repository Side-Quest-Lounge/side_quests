import { expect, test } from "vitest";
import { users, profiles, groups } from "./schema";
test("core tables expose expected columns", () => {
  expect(Object.keys(users)).toContain("subscriptionStatus");
  expect(Object.keys(profiles)).toContain("embedding");
  expect(Object.keys(groups)).toContain("agentRationale");
});
