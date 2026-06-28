"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "./types";

/** Concierge seed messages — too long for home preview. */
export function isConciergeBoilerplate(message: ChatMessage): boolean {
  if (message.author !== "agent") return false;
  const body = message.body;
  return (
    body.startsWith("Welcome to your Side Quest") ||
    body.startsWith("💬 Icebreakers") ||
    body.startsWith("Hey everyone — drop a quick hello")
  );
}

export function useGroupChatPreview(groupId: string | null, enabled: boolean): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const load = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/chat/${groupId}`);
      if (!res.ok) {
        setMessages([]);
        return;
      }
      const data = (await res.json()) as { messages: ChatMessage[] };
      const preview = data.messages.filter((m) => !isConciergeBoilerplate(m)).slice(-3);
      setMessages(preview);
    } catch {
      setMessages([]);
    }
  }, [groupId]);

  useEffect(() => {
    if (!enabled || !groupId) {
      setMessages([]);
      return;
    }
    void load();
  }, [enabled, groupId, load]);

  return messages;
}
