"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Pill } from "@/components/ui";
import { useOpenQuests } from "@/context/open-quests";
import { useMeGroup } from "@/lib/api/use-me-group";
import type { ChatMessage } from "@/lib/api/types";
import { DEMO, DEMO_GROUP_ID, demoMessages } from "@/lib/demo";
import { formatOpenQuestDate, isOpenQuestChatId, openQuestIdFromChatId } from "@/lib/open-quest-utils";
import { trimOpenChatMessages } from "@/lib/open-quest-limits";
import { canViewFullQuest } from "@/lib/seat-access";

const localChatKey = (questId: string) => `sq_open_chat_${questId}`;

function readLocalOpenMessages(questId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(localChatKey(questId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function writeLocalOpenMessages(questId: string, messages: ChatMessage[]): void {
  localStorage.setItem(localChatKey(questId), JSON.stringify(trimOpenChatMessages(messages)));
}

function dedupeMessages(msgs: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  return msgs.filter((m) => {
    const key = `${m.author}:${m.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ChatPage() {
  const router = useRouter();
  const { id: groupId } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const { group } = useMeGroup();
  const { getQuestByChatId } = useOpenQuests();

  const openQuest = isOpenQuestChatId(groupId) ? getQuestByChatId(groupId) : undefined;
  const openQuestId = openQuest ? openQuestIdFromChatId(groupId) : null;
  const isOpenQuest = !!openQuest;
  const isDemoGroup = DEMO || groupId === DEMO_GROUP_ID;

  const namesById = useMemo(
    () => Object.fromEntries(group?.members.map((m) => [m.userId, m.name]) ?? []),
    [group],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(
    isDemoGroup ? demoMessages : [],
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const lastTs = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpenQuest && openQuestId) {
      setMessages(readLocalOpenMessages(openQuestId));
      return;
    }
    if (isDemoGroup) {
      setMessages(demoMessages);
      return;
    }
    setMessages([]);
    lastTs.current = null;
  }, [isOpenQuest, openQuestId, groupId, isDemoGroup]);

  useEffect(() => {
    if (isOpenQuest || isDemoGroup) return;
    if (!group) return;
    if (group.id === groupId && !canViewFullQuest(group.subscriptionStatus)) {
      router.replace(`/group/${group.id}`);
    }
  }, [group, groupId, isOpenQuest, isDemoGroup, router]);

  const fetchMessages = useCallback(async () => {
    const qs = lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : "";
    const res = await fetch(`/api/chat/${groupId}${qs}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    if (data.messages.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...data.messages.filter((m) => !ids.has(m.id))];
        return dedupeMessages(merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
      });
      lastTs.current = data.messages[data.messages.length - 1].createdAt;
    }
  }, [groupId]);

  useEffect(() => {
    if (isOpenQuest || isDemoGroup) return;

    let cancelled = false;
    const poll = setInterval(() => {
      if (!cancelled) void fetchMessages();
    }, 3000);

    void (async () => {
      await fetch("/api/agent/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!cancelled) await fetchMessages();
    })();

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [groupId, fetchMessages, isOpenQuest, isDemoGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;

    if (isOpenQuest && openQuestId) {
      const msg: ChatMessage = {
        id: `local-${Date.now()}`,
        author: "you",
        body: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        writeLocalOpenMessages(openQuestId, next);
        return next;
      });
      setText("");
      return;
    }

    if (isDemoGroup) {
      const msg: ChatMessage = {
        id: `demo-${Date.now()}`,
        author: "you",
        body: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      setText("");
      return;
    }

    setSending(true);
    const res = await fetch(`/api/chat/${groupId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = (await res.json()) as { message: ChatMessage };
      setMessages((prev) => [...prev, data.message]);
      lastTs.current = data.message.createdAt;
      setText("");
    }
    setSending(false);
  }

  if (isOpenQuest && !openQuest) {
    return (
      <Card style={{ maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: "var(--ink-soft)" }}>This open quest chat could not be found.</p>
        <Button variant="primary" onClick={() => router.push("/explore")} style={{ marginTop: "var(--space-4)" }}>
          Browse open quests →
        </Button>
      </Card>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link href="/chat" className="dash-link" style={{ display: "inline-block", marginBottom: "var(--space-3)" }}>
        ← All chats
      </Link>
      <span className="meta">{isOpenQuest ? "Open quest" : "Your party"}</span>
      <h1 style={{ fontSize: "var(--text-xl)", margin: "var(--space-1) 0 var(--space-2)" }}>
        {isOpenQuest ? openQuest!.title : "Party chat"}
      </h1>
      {isOpenQuest && openQuest && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Pill tone="sunny">{formatOpenQuestDate(openQuest.startsAt)}</Pill>
          <span className="meta" style={{ display: "block", marginTop: "var(--space-2)", color: "var(--ink-soft)" }}>
            {openQuest.venue}
          </span>
        </div>
      )}

      <Card
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          overflowY: "auto",
          maxHeight: "60vh",
          marginBottom: "var(--space-4)",
        }}
      >
        {messages.length === 0 && !isOpenQuest && (
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>No messages yet — say hi!</p>
        )}
        {messages.map((m) => {
          const isYou = m.author === "you" || (!!userId && m.author === userId);
          const isAgent = m.author === "agent";
          const label = isAgent
            ? "Side Quest concierge"
            : isYou
              ? "You"
              : (namesById[m.author] ?? m.author);
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isYou ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: isAgent ? "var(--sunny-soft)" : isYou ? "var(--coral-tint)" : "var(--cream-deep)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
              }}
            >
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 4 }}>{label}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </Card>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
          placeholder="Say hello…"
          style={{
            flex: 1,
            background: "var(--surface-2-raw)",
            color: "var(--ink)",
            border: "1.5px solid var(--border-strong)",
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-3) var(--space-4)",
            fontSize: "var(--text-base)",
            fontFamily: "var(--font-sans)",
          }}
        />
        <Button variant="primary" onClick={() => void send()} disabled={sending}>
          Send
        </Button>
      </div>
    </div>
  );
}
