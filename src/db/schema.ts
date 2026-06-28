/**
 * Drizzle schema for Side Quest.
 *
 * Core flow: users + profiles (embeddings) → events → groups + group_members
 * → messages / surveys. subscription_status on users gates paid features.
 */
import { pgTable, text, timestamp, integer, real, jsonb, uuid, boolean, customType, uniqueIndex } from "drizzle-orm/pg-core";

const vector1024 = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1024)",
  toDriver: (v) => `[${v.join(",")}]`,
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  name: text("name").notNull(),
  bio: text("bio"),
  city: text("city").notNull().default("Auckland"),
  isNewcomer: boolean("is_newcomer").notNull().default(false),
  subscriptionStatus: text("subscription_status").notNull().default("none"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  answers: jsonb("answers").$type<Record<string, number | string>>().notNull(),
  embedding: vector1024("embedding"),
});

export const preferences = pgTable("preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  likes: jsonb("likes").$type<string[]>().notNull().default([]),
  dislikes: jsonb("dislikes").$type<string[]>().notNull().default([]),
});

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  activityType: text("activity_type").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull().default(6),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekOf: text("week_of").notNull(),
  format: text("format").notNull().default("signature"),
  activity: text("activity"),
  venueId: uuid("venue_id").references(() => venues.id),
  startsAt: timestamp("starts_at"),
  status: text("status").notNull().default("open"),
});

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  status: text("status").notNull().default("forming"), // forming|matched|confirmed|completed
  agentRationale: text("agent_rationale"),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id").notNull().references(() => groups.id),
    userId: text("user_id").notNull().references(() => users.id),
    matchScore: real("match_score").notNull().default(0),
  },
  (table) => [
    uniqueIndex("group_members_group_user_unique").on(table.groupId, table.userId),
  ],
);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groups.id),
  author: text("author").notNull(), // user id or 'agent'
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const surveys = pgTable(
  "surveys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull().references(() => groups.id),
    userId: text("user_id").notNull().references(() => users.id),
    vibeScore: integer("vibe_score").notNull(),
    openText: text("open_text"),
  },
  (table) => [
    uniqueIndex("surveys_group_user_unique").on(table.groupId, table.userId),
  ],
);

export const agentTraces = pgTable("agent_traces", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  tool: text("tool").notNull(),
  args: jsonb("args"),
  result: jsonb("result"),
  at: timestamp("at").notNull().defaultNow(),
});

/** Fixed-window counters for API rate limiting (shared across serverless instances). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  windowStart: timestamp("window_start").notNull().defaultNow(),
});
