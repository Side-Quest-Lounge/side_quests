import { DEMO } from "@/lib/demo";
import { PAYMENTS_DISABLED } from "@/lib/payments";

/** Paid seat gates full quest reveal, chat, and hosting open quests. */

export function hasActiveSeat(status: string | undefined): boolean {
  return status === "active" || status === "trial";
}

export function canViewFullQuest(status: string | undefined): boolean {
  return DEMO || hasActiveSeat(status);
}

/** Paid or trial subscribers can create open quests for others to join. */
export function canHostOpenQuest(status: string | undefined): boolean {
  if (PAYMENTS_DISABLED) return true;
  return hasActiveSeat(status);
}
