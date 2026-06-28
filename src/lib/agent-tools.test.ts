import { expect, test } from "vitest";
import { bookVenue, pickStartTime } from "./agent-tools";

const venues = [
  { id: "1", name: "Boulder Co", activityType: "bouldering", address: "A", capacity: 8 },
  { id: "2", name: "Clay Studio", activityType: "pottery", address: "B", capacity: 6 },
  { id: "3", name: "Trivia Bar", activityType: "trivia", address: "C", capacity: 20 },
];

test("bookVenue prefers activity fit", () => {
  const v = bookVenue(venues, "love bouldering and climbing");
  expect(v.activityType).toBe("bouldering");
});

test("bookVenue falls back to highest capacity when no pref", () => {
  const v = bookVenue(venues);
  expect(v.capacity).toBe(20);
});

test("pickStartTime returns a Saturday at 4pm", () => {
  const d = pickStartTime("2026-06-16"); // Monday
  expect(d.getDay()).toBe(6);
  expect(d.getHours()).toBe(16);
});

test("pickStartTime accepts ISO week labels from events.week_of", () => {
  const d = pickStartTime("2026-W26");
  expect(Number.isNaN(d.getTime())).toBe(false);
  expect(d.getDay()).toBe(6);
  expect(d.getHours()).toBe(16);
});
