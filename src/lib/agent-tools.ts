/** Deterministic agent tools: venue booking, reveal JSON helpers, start times. */
export type Venue = {
  id: string;
  name: string;
  activityType: string;
  address: string;
  capacity: number;
};

const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  bouldering: ["boulder", "climb", "rock", "gym"],
  pottery: ["pottery", "clay", "ceramic", "craft", "creative"],
  "mini-golf": ["mini-golf", "minigolf", "golf", "game"],
  trivia: ["trivia", "quiz", "bar", "pub", "drink"],
  cooking: ["cook", "food", "kitchen", "chef", "eat"],
  hiking: ["hike", "walk", "outdoor", "nature", "trail"],
};

function activityFitScore(venue: Venue, pref?: string): number {
  if (!pref) return 0;
  const lower = pref.toLowerCase();
  const keywords = ACTIVITY_KEYWORDS[venue.activityType] ?? [venue.activityType];
  return keywords.reduce((score, kw) => (lower.includes(kw) ? score + 2 : score), 0);
}

/** Picks the best venue by activity fit and capacity (≥6). */
export function bookVenue(venues: Venue[], activityPref?: string): Venue {
  if (venues.length === 0) throw new Error("No venues available");
  const eligible = venues.filter((v) => v.capacity >= 6);
  const pool = eligible.length > 0 ? eligible : venues;
  return [...pool].sort((a, b) => {
    const fitDiff = activityFitScore(b, activityPref) - activityFitScore(a, activityPref);
    if (fitDiff !== 0) return fitDiff;
    return b.capacity - a.capacity;
  })[0];
}

/** Parse events.week_of — ISO week label ("2026-W26") or date string. */
export function parseWeekOf(weekOf: string): Date | null {
  const trimmed = weekOf.trim();
  if (!trimmed) return null;

  const isoWeek = /^(\d{4})-W(\d{2})$/i.exec(trimmed);
  if (isoWeek) {
    const year = Number(isoWeek[1]);
    const week = Number(isoWeek[2]);
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setDate(jan4.getDate() - jan4Day + 1);
    const monday = new Date(mondayWeek1);
    monday.setDate(mondayWeek1.getDate() + (week - 1) * 7);
    return monday;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Returns the signature slot: next Saturday at 4pm from the event week anchor. */
export function pickStartTime(weekOf: string): Date {
  const base = parseWeekOf(weekOf) ?? new Date();
  const d = new Date(base);
  const day = d.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  d.setHours(16, 0, 0, 0);
  return d;
}

export function parseRevealPayload(raw: string | null): {
  rationale: string;
  icebreakers: string[];
  chatWelcomed?: boolean;
} {
  if (!raw) return { rationale: "", icebreakers: [] };
  try {
    const parsed = JSON.parse(raw) as {
      rationale?: string;
      icebreakers?: string[];
      chatWelcomed?: boolean;
    };
    if (typeof parsed.rationale === "string") {
      return {
        rationale: parsed.rationale,
        icebreakers: Array.isArray(parsed.icebreakers) ? parsed.icebreakers : [],
        chatWelcomed: parsed.chatWelcomed === true,
      };
    }
    if (parsed.chatWelcomed === true) {
      return { rationale: "", icebreakers: [], chatWelcomed: true };
    }
  } catch {
    /* plain text legacy */
  }
  return { rationale: raw, icebreakers: [] };
}

export function serializeRevealPayload(
  rationale: string,
  icebreakers: string[],
  extra?: { chatWelcomed?: boolean },
): string {
  return JSON.stringify({ rationale, icebreakers, ...extra });
}
