import { demoGroup } from "@/lib/demo";

export function groupPath(groupId = demoGroup.id): string {
  return `/group/${groupId}`;
}

export function chatPath(groupId = demoGroup.id): string {
  return `/chat/${groupId}`;
}

export function exploreQuestPath(questId: string): string {
  return `/explore?quest=${encodeURIComponent(questId)}`;
}
