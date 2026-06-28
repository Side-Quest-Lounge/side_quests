/** Shared quest title/subtitle for home, quests, and group pages. */

type QuestVenue = {
  name: string;
  activityType: string;
  address: string;
} | null | undefined;

export function questDisplayTitle(venue: QuestVenue, fallback = "Weekly quest"): string {
  return venue?.name ?? venue?.activityType ?? fallback;
}

export function questDisplaySubtitle(venue: QuestVenue): string {
  if (!venue) return "";
  return [venue.activityType, venue.address].filter(Boolean).join(" · ");
}

/** Compact date pill for quest cards, e.g. "Sat · 4:00 pm". */
export function formatQuestStartsPill(startsAt: string | null | undefined): string {
  if (!startsAt) return "This week";
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return "This week";
  const day = d.toLocaleString("en-NZ", { weekday: "short" });
  const time = d.toLocaleString("en-NZ", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}
