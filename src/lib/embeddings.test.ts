import { expect, test } from "vitest";
import { profileToText } from "./embeddings";
test("profileToText weaves answers and bio into one string", () => {
  const t = profileToText({ energy: 5, creative: 2 }, "love bouldering");
  expect(t).toContain("bouldering");
  expect(t).toContain("energy");
});
