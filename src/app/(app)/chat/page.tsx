"use client";

import Link from "next/link";
import { Avatar, Card, Pill } from "@/components/ui";
import { useOpenQuests } from "@/context/open-quests";
import { useMeGroup } from "@/lib/api/use-me-group";
import { formatOpenQuestDateShort } from "@/lib/open-quest-utils";
import { questDisplayTitle } from "@/lib/quest-display";
import { canViewFullQuest, hasActiveSeat } from "@/lib/seat-access";
import { chatPath, groupPath, openQuestChatPath } from "@/lib/paths";

export default function ChatInboxPage() {
  const { group, groupId, loading: groupLoading } = useMeGroup();
  const { quests } = useOpenQuests();

  const joinedOpenQuests = quests.filter((q) => q.joined);
  const partyUnlocked = group ? canViewFullQuest(group.subscriptionStatus) && hasActiveSeat(group.subscriptionStatus) : false;
  const hasPartyChat = !!group;
  const hasOpenChats = joinedOpenQuests.length > 0;
  const loading = groupLoading;
  const empty = !loading && !hasPartyChat && !hasOpenChats;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Messages</span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>Your chats</h1>
        <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-2)", fontSize: "var(--text-sm)" }}>
          Your matched party and any open quests you&apos;ve joined each have their own room.
        </p>
      </div>

      {loading ? (
        <Card>
          <p style={{ color: "var(--ink-soft)" }}>Loading chats…</p>
        </Card>
      ) : empty ? (
        <Card style={{ background: "var(--cream-deep)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>No chats yet</h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)", fontSize: "var(--text-sm)" }}>
            Get matched into a weekly party, or join an open quest on Explore — each one opens a chat room.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <Link href="/explore" className="dash-link">
              Browse open quests →
            </Link>
            <Link href="/finding" className="dash-link">
              Find my party →
            </Link>
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {hasPartyChat && group && (
            <section>
              <h2 className="chat-inbox__label">Matched party</h2>
              <Link
                href={partyUnlocked && groupId ? chatPath(groupId) : groupPath(group.id)}
                className="chat-inbox__row"
              >
                <span className="chat-inbox__emoji" aria-hidden>
                  ☕
                </span>
                <span className="chat-inbox__body">
                  <span className="chat-inbox__title">{questDisplayTitle(group.venue)}</span>
                  <span className="chat-inbox__meta">
                    {group.members.length} in your party
                    {!partyUnlocked ? " · confirm seat to chat" : ""}
                  </span>
                </span>
                <div className="chat-inbox__avatars">
                  {group.members.slice(0, 3).map((m, i) => (
                    <Avatar
                      key={m.userId}
                      name={m.name}
                      size={28}
                      style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid var(--surface-raw)" }}
                    />
                  ))}
                </div>
                {!partyUnlocked && (
                  <Pill tone="coral" className="chat-inbox__pill">
                    Locked
                  </Pill>
                )}
              </Link>
            </section>
          )}

          {hasOpenChats && (
            <section>
              <h2 className="chat-inbox__label">Open quests</h2>
              <div className="chat-inbox__list">
                {joinedOpenQuests.map((q) => (
                  <Link key={q.id} href={openQuestChatPath(q.id)} className="chat-inbox__row">
                    <span className="chat-inbox__emoji" aria-hidden>
                      {q.emoji}
                    </span>
                    <span className="chat-inbox__body">
                      <span className="chat-inbox__title">{q.title}</span>
                      <span className="chat-inbox__meta">
                        {formatOpenQuestDateShort(q.startsAt)} · {q.venue}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!hasPartyChat && hasOpenChats && (
            <p style={{ color: "var(--ink-faint)", fontSize: "var(--text-sm)" }}>
              <Link href="/finding" className="dash-link">
                Find your weekly party →
              </Link>
            </p>
          )}

          {hasPartyChat && !hasOpenChats && (
            <p style={{ color: "var(--ink-faint)", fontSize: "var(--text-sm)" }}>
              <Link href="/explore" className="dash-link">
                Join an open quest for another chat →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
