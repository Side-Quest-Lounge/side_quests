/**
 * Paid-seat gating for group reveal and chat.
 * `subscription_status === 'active'` is set by Stripe webhook on users table.
 */
import { DEMO } from "@/lib/demo";

/** Paid seat — set via Stripe webhook (`users.subscription_status = active`). */
export function hasActiveSeat(status: string | undefined): boolean {
  return status === "active";
}

/** Full quest details, member names, chat (demo mode always unlocks). */
export function canViewFullQuest(status: string | undefined): boolean {
  return DEMO || hasActiveSeat(status);
}
