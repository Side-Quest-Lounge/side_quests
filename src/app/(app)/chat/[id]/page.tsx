"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { DEMO, DEMO_GROUP_ID, demoMessages } from "@/lib/demo";

type ChatMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export default function ChatPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const isDemoGroup = DEMO || groupId === DEMO_GROUP_ID;
  const [messages, setMessages] = useState<ChatMessage[]>(isDemoGroup ? demoMessages : []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const lastTs = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const qs = lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : "";
    const res = await fetch(`/api/chat/${groupId}${qs}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    if (data.messages.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...data.messages.filter((m) => !ids.has(m.id))];
        return merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      lastTs.current = data.messages[data.messages.length - 1].createdAt;
    }
  }, [groupId]);

  useEffect(() => {
    if (isDemoGroup) return;
    void fetch("/api/agent/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    }).then(() => fetchMessages());
  }, [groupId, fetchMessages, isDemoGroup]);

  useEffect(() => {
    if (isDemoGroup) return;
    const interval = setInterval(() => void fetchMessages(), 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, isDemoGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    if (isDemoGroup) {
      const msg: ChatMessage = {
        id: `local-${Date.now()}`,
        author: "you",
        body: text,
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

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span className="meta">Your party</span>
      <h1 style={{ fontSize: "var(--text-xl)", margin: "var(--space-1) 0 var(--space-4)" }}>Party chat</h1>

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
        {messages.map((m) => {
          const isYou = m.author === "you";
          const isAgent = m.author === "agent";
          const label = isAgent ? "Side Quest concierge" : isYou ? "You" : m.author;
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
