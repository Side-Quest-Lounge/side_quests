import { expect, test } from "vitest";
import {
  profilePatchSchema,
  profilePostSchema,
  quizAnswersSchema,
  surveyPostSchema,
  chatPostSchema,
  groupIdBodySchema,
} from "./validators";

const validAnswers = {
  energy: 3,
  creative: 3,
  spontaneity: 3,
  talkativeness: 3,
  outdoors: 3,
  food: 3,
  games: 3,
  fitness: 3,
  quiet: 3,
  newcomer: 3,
};

test("quizAnswersSchema accepts all 10 questions with 1-5 scores", () => {
  expect(quizAnswersSchema.parse(validAnswers)).toEqual(validAnswers);
});

test("quizAnswersSchema rejects unknown keys", () => {
  expect(() =>
    quizAnswersSchema.parse({ ...validAnswers, hacker: 99 }),
  ).toThrow();
});

test("quizAnswersSchema rejects out-of-range scores", () => {
  expect(() => quizAnswersSchema.parse({ ...validAnswers, energy: 6 })).toThrow();
});

test("profilePostSchema requires name and all quiz answers", () => {
  const result = profilePostSchema.parse({
    name: "Alex",
    bio: "hello",
    isNewcomer: true,
    answers: validAnswers,
  });
  expect(result.name).toBe("Alex");
});

test("profilePatchSchema rejects empty name", () => {
  expect(() => profilePatchSchema.parse({ name: "  " })).toThrow();
});

test("profilePatchSchema caps bio length", () => {
  expect(() => profilePatchSchema.parse({ name: "Alex", bio: "x".repeat(501) })).toThrow();
});

test("surveyPostSchema validates vibe score range", () => {
  expect(() =>
    surveyPostSchema.parse({
      groupId: "550e8400-e29b-41d4-a716-446655440000",
      vibeScore: 0,
    }),
  ).toThrow();
});

test("chatPostSchema rejects empty text", () => {
  expect(() => chatPostSchema.parse({ text: "   " })).toThrow();
});

test("groupIdBodySchema requires uuid", () => {
  expect(() => groupIdBodySchema.parse({ groupId: "not-a-uuid" })).toThrow();
});
