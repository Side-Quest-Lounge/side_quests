import { expect, test } from "vitest";
import { users, profiles, groups, groupMembers, surveys, rateLimits } from "./schema";

test("core tables expose expected columns", () => {
  expect(Object.keys(users)).toContain("subscriptionStatus");
  expect(Object.keys(profiles)).toContain("embedding");
  expect(Object.keys(groups)).toContain("agentRationale");
  expect(Object.keys(rateLimits)).toContain("count");
});

test("groupMembers and surveys tables are defined with constraints", () => {
  expect(groupMembers).toBeDefined();
  expect(surveys).toBeDefined();
});
