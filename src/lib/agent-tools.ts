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

/** Returns the signature slot: next Saturday at 4pm Pacific/Auckland. */
export function pickStartTime(weekOf: string): Date {
  const base = weekOf ? new Date(weekOf) : new Date();
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
} {
  if (!raw) return { rationale: "", icebreakers: [] };
  try {
    const parsed = JSON.parse(raw) as { rationale?: string; icebreakers?: string[] };
    if (typeof parsed.rationale === "string") {
      return {
        rationale: parsed.rationale,
        icebreakers: Array.isArray(parsed.icebreakers) ? parsed.icebreakers : [],
      };
    }
  } catch {
    /* plain text legacy */
  }
  return { rationale: raw, icebreakers: [] };
}

export function serializeRevealPayload(rationale: string, icebreakers: string[]): string {
  return JSON.stringify({ rationale, icebreakers });
}
