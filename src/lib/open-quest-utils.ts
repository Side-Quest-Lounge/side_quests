/** Formatting helpers for open quest dates and chat routes. */

export function formatOpenQuestDate(startsAt: string): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return startsAt;
  return d.toLocaleString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatOpenQuestDateShort(startsAt: string): string {
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return startsAt;
  const day = d.toLocaleString("en-NZ", { weekday: "short" });
  const time = d.toLocaleString("en-NZ", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

/** Chat route id for an open quest (distinct from matched group uuids). */
export function openQuestChatId(questId: string): string {
  return `open-${questId}`;
}

export function isOpenQuestChatId(chatId: string): boolean {
  return chatId.startsWith("open-");
}

export function openQuestIdFromChatId(chatId: string): string {
  return chatId.replace(/^open-/, "");
}
