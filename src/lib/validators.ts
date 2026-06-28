/** Zod schemas for API request bodies — keep in sync with quiz question ids. */
import { z } from "zod";
import { quizQuestions } from "@/lib/quiz";

const QUIZ_IDS = quizQuestions.map((q) => q.id) as [string, ...string[]];

const uuidSchema = z.string().uuid();

const quizAnswersShape = Object.fromEntries(
  QUIZ_IDS.map((id) => [id, z.number().int().min(1).max(5)]),
) as Record<(typeof QUIZ_IDS)[number], z.ZodNumber>;

export const quizAnswersSchema = z
  .object(quizAnswersShape)
  .strict();

export const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(500).optional().nullable(),
  isNewcomer: z.boolean().optional(),
});

export const profilePostSchema = profilePatchSchema.extend({
  answers: quizAnswersSchema,
});

export const surveyPostSchema = z.object({
  groupId: uuidSchema,
  vibeScore: z.number().int().min(1).max(5),
  openText: z.string().trim().max(1000).optional(),
});

export const chatPostSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const groupIdBodySchema = z.object({
  groupId: uuidSchema,
});

export const agentHostSchema = z.object({
  groupId: uuidSchema,
  action: z.literal("nudge").optional(),
});

export const stripeCheckoutSchema = z.object({
  groupId: uuidSchema.optional(),
});

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;
export type ProfilePostInput = z.infer<typeof profilePostSchema>;
export type SurveyPostInput = z.infer<typeof surveyPostSchema>;
export type ChatPostInput = z.infer<typeof chatPostSchema>;
