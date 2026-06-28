/** Route builders for group/chat links. Falls back to demo group id when none passed. */
import { DEMO, DEMO_GROUP_ID, demoGroup } from "@/lib/demo";

export function groupPath(groupId?: string): string {
  return `/group/${groupId ?? (DEMO ? demoGroup.id : DEMO_GROUP_ID)}`;
}

export function chatPath(groupId?: string): string {
  return `/chat/${groupId ?? (DEMO ? demoGroup.id : DEMO_GROUP_ID)}`;
}

export function exploreQuestPath(questId: string): string {
  return `/explore?quest=${encodeURIComponent(questId)}`;
}
