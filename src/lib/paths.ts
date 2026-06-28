/** Route builders for group/chat links. */

export function groupPath(groupId: string | null | undefined): string {
  return groupId ? `/group/${groupId}` : "/finding";
}

export function chatPath(groupId: string | null | undefined): string {
  return groupId ? `/chat/${groupId}` : "/home";
}

export function openQuestChatPath(questId: string): string {
  return `/chat/open-${encodeURIComponent(questId)}`;
}

export function exploreQuestPath(questId: string): string {
  return `/explore?quest=${encodeURIComponent(questId)}`;
}
