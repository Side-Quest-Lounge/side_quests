import { expect, test } from "vitest";
import { buildSeedPersonas } from "./seed-data";
import { quizQuestions } from "./quiz";

test("buildSeedPersonas returns 40 personas with all quiz fields", () => {
  const personas = buildSeedPersonas();
  expect(personas).toHaveLength(40);
  expect(personas[0].id).toBe("seed_01");
  expect(personas[39].id).toBe("seed_40");

  const ids = quizQuestions.map((q) => q.id);
  for (const persona of personas) {
    for (const id of ids) {
      expect(persona.answers[id]).toBeGreaterThanOrEqual(1);
      expect(persona.answers[id]).toBeLessThanOrEqual(5);
    }
  }
});
