"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileGateLink } from "@/components/profile-gate-link";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { DisplayName } from "@/components/user-display";
import type { ChatMessage, MeGroup } from "@/lib/api/types";
import { useMeGroup } from "@/lib/api/use-me-group";
import { useGroupChatPreview } from "@/lib/api/use-group-chat-preview";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { useMeQuests } from "@/lib/api/use-me-quests";
import { DEMO, demoGroup, demoMessages, demoPastQuests } from "@/lib/demo";
import { formatQuestStartsPill, questDisplaySubtitle, questDisplayTitle } from "@/lib/quest-display";
import { canViewFullQuest, hasActiveSeat } from "@/lib/seat-access";
import { chatPath, groupPath } from "@/lib/paths";

const PREVIEW_MAX_LEN = 100;

function truncatePreview(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= PREVIEW_MAX_LEN) return oneLine;
  return `${oneLine.slice(0, PREVIEW_MAX_LEN - 1)}…`;
}

export default function HomePage() {
  const { hasProfile, loading: profileLoading } = useMeProfile();
  const { group, groupId, loading: groupLoading } = useMeGroup();
  const { past: pastQuestsFromApi, loading: pastLoading } = useMeQuests();

  const quest = DEMO ? (demoGroup as MeGroup) : group;
  const pastQuests = DEMO ? demoPastQuests : pastQuestsFromApi;
  const unlocked = quest ? canViewFullQuest(quest.subscriptionStatus) : false;
  const seatActive = quest ? hasActiveSeat(quest.subscriptionStatus) : false;
  const showPartyFeed = DEMO || !!(group && seatActive && unlocked);
  const partyPreviewFromApi = useGroupChatPreview(DEMO ? null : groupId, showPartyFeed && !DEMO);
  const partyPreview = DEMO
    ? demoMessages.filter((m) => m.author !== "agent" || !m.body.startsWith("💬")).slice(-3)
    : partyPreviewFromApi;
  const chatHref = DEMO ? chatPath(demoGroup.id) : groupId ? chatPath(groupId) : "/chat";

  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Your week</span>
        <DisplayName>
          {(name) => (
            <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>
              Kia ora, {name} 👋
            </h1>
          )}
        </DisplayName>
      </div>

      {DEMO && (
        <Card style={{ marginBottom: "var(--space-5)", background: "var(--sunny-soft)" }}>
          <p style={{ fontWeight: 700, marginBottom: "var(--space-1)" }}>Demo mode</p>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
            No sign-in required — explore the full weekly quest flow with sample data.
          </p>
        </Card>
      )}

      {!profileLoading && !hasProfile && !DEMO && (
        <Card style={{ marginBottom: "var(--space-5)", background: "var(--coral-tint)" }}>
          <p style={{ fontWeight: 700, marginBottom: "var(--space-2)" }}>Finish setting up your profile</p>
          <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)", fontSize: "var(--text-sm)" }}>
            Complete the vibe quiz so your concierge can match you with the right party.
          </p>
          <Link href="/onboarding">
            <Button variant="primary">Continue setup →</Button>
          </Link>
        </Card>
      )}

      <div className="dash-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {groupLoading && !DEMO ? (
            <Card>
              <p style={{ color: "var(--ink-soft)" }}>Loading your quest…</p>
            </Card>
          ) : !quest ? (
            <FindingCard hasProfile={hasProfile} />
          ) : unlocked ? (
            <QuestHero quest={quest} groupId={DEMO ? demoGroup.id : groupId} unlocked />
          ) : (
            <QuestTeaser quest={quest} />
          )}

          {showPartyFeed && (
            <Card>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Latest in your party</h2>
                <Link href={chatHref} className="dash-link" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                  Open chat →
                </Link>
              </div>
              {partyPreview.length === 0 ? (
                <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)", margin: 0 }}>
                  No messages from your party yet —{" "}
                  <Link href={chatHref} className="dash-link" style={{ fontSize: "inherit", fontWeight: 600 }}>
                    say hi in chat
                  </Link>
                  .
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {partyPreview.map((m) => (
                    <PartyMessagePreview key={m.id} message={m} members={quest!.members} />
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {quest?.startsAt && <Countdown startsAt={quest.startsAt} />}

          <Card>
            <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
              Your seat
            </span>
            <SeatStatus group={quest as MeGroup | null} seatActive={seatActive} />
          </Card>

          <Card>
            <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
              Past quests
            </span>
            {pastLoading && !DEMO ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>Loading…</p>
            ) : pastQuests.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
                Completed quests appear here after your first Side Quest.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {pastQuests.map((q) => (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "1.25rem" }}>{q.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.title}
                      </div>
                      <div className="meta" style={{ color: "var(--ink-faint)" }}>{q.date}</div>
                    </div>
                    {q.vibeScore != null && (
                      <span aria-label={`${q.vibeScore} out of 5`} style={{ color: "var(--lantern-ink)", fontSize: "var(--text-sm)" }}>
                        {"★".repeat(q.vibeScore)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Link href="/quests" className="dash-link" style={{ display: "inline-block", marginTop: "var(--space-3)" }}>
              All quests →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SeatStatus({ group, seatActive }: { group: MeGroup | null; seatActive: boolean }) {
  if (!group) {
    return <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "var(--text-sm)" }}>Not matched yet</p>;
  }
  if (seatActive) {
    return (
      <p style={{ color: "var(--success-fg)", fontWeight: 700, margin: 0, fontSize: "var(--text-sm)" }}>
        Confirmed — see you there 🎉
      </p>
    );
  }
  return (
    <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "var(--text-sm)" }}>
      Pending — confirm on your group reveal
    </p>
  );
}

function FindingCard({ hasProfile }: { hasProfile: boolean }) {
  return (
    <Card style={{ boxShadow: "var(--shadow-md), var(--shadow-coral)" }}>
      <Pill tone="sunny" style={{ marginBottom: "var(--space-3)" }}>
        Quest in progress
      </Pill>
      <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>Finding your party</h2>
      <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-5)" }}>
        Your concierge is matching you with a small group for this week&apos;s activity. No party details yet — hang
        tight.
      </p>
      <Link href={hasProfile ? "/finding" : "/onboarding"}>
        <Button variant="primary">{hasProfile ? "Check matching status →" : "Finish profile first →"}</Button>
      </Link>
    </Card>
  );
}

function QuestTeaser({ quest }: { quest: MeGroup }) {
  const title = questDisplayTitle(quest.venue);
  const subtitle = questDisplaySubtitle(quest.venue);
  const when = formatQuestStartsPill(quest.startsAt);

  return (
    <Card style={{ boxShadow: "var(--shadow-md), var(--shadow-coral)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
        <span className="meta" style={{ color: "var(--lantern-ink)" }}>
          This week&apos;s quest
        </span>
        <Pill tone="coral">{when}</Pill>
      </div>
      <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 var(--space-2)" }}>{title}</h2>
      {subtitle && (
        <div className="meta" style={{ color: "var(--ink-soft)", marginBottom: "var(--space-3)" }}>
          {subtitle}
        </div>
      )}
      <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
        {`${quest.members.length} people matched for you. Confirm your seat to see names, the concierge's rationale, and party chat.`}
      </p>
      <Link href={groupPath(quest.id)}>
        <Button variant="primary">View party &amp; confirm seat →</Button>
      </Link>
    </Card>
  );
}

function QuestHero({
  quest,
  groupId,
  unlocked,
}: {
  quest: MeGroup;
  groupId: string | null;
  unlocked: boolean;
}) {
  const venue = quest.venue;
  const title = questDisplayTitle(venue);
  const subtitle = questDisplaySubtitle(venue);
  const when = formatQuestStartsPill(quest.startsAt);
  const chatHref = groupId ? chatPath(groupId) : "/chat";

  return (
    <Card style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow-md), var(--shadow-coral)" }}>
      <div style={{ background: "var(--coral-tint)", padding: "var(--space-5)", borderBottom: "1px solid rgba(255,178,74,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
          <span className="meta" style={{ color: "var(--lantern-ink)" }}>
            This week&apos;s quest
          </span>
          <Pill tone="coral">{when}</Pill>
        </div>
        <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>{title}</h2>
        {subtitle && (
          <div className="meta" style={{ color: "var(--ink-soft)" }}>
            {subtitle}
          </div>
        )}
        <ProfileGateLink
          href={groupPath(groupId ?? undefined)}
          className="dash-link"
          style={{
            display: "inline-block",
            marginTop: "var(--space-2)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          Full reveal →
        </ProfileGateLink>
      </div>

      <div style={{ padding: "var(--space-5)" }}>
        <div className="hero-actions">
          <div>
            <span className="meta" style={{ display: "block", marginBottom: "var(--space-2)" }}>
              Your party · {quest.members.length}
            </span>
            <div style={{ display: "flex" }}>
              {quest.members.map((m, i) => (
                <Avatar
                  key={m.userId}
                  name={m.name}
                  size={38}
                  style={{ marginLeft: i === 0 ? 0 : -12, border: "2px solid var(--surface-raw)" }}
                />
              ))}
            </div>
          </div>
          {unlocked && hasActiveSeat(quest.subscriptionStatus) && (
            <div className="hero-cta">
              <Link href={chatHref}>
                <Button variant="primary">Open party chat</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatCountdown(startsAt: string): string {
  const ms = new Date(startsAt).getTime() - Date.now();
  if (ms <= 0) return "Now";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function Countdown({ startsAt }: { startsAt: string | null }) {
  const [label, setLabel] = useState(() => (startsAt ? formatCountdown(startsAt) : "—"));

  useEffect(() => {
    if (!startsAt) {
      setLabel("—");
      return;
    }
    const tick = () => setLabel(formatCountdown(startsAt));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [startsAt]);

  return (
    <Card style={{ textAlign: "center", boxShadow: "var(--shadow-sm), var(--shadow-coral)" }}>
      <span className="meta" style={{ display: "block", marginBottom: "var(--space-2)" }}>
        Quest begins in
      </span>
      <div suppressHydrationWarning style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.4rem", color: "var(--lantern-ink)", lineHeight: 1 }}>
        {label}
      </div>
    </Card>
  );
}

function PartyMessagePreview({
  message: m,
  members,
}: {
  message: ChatMessage;
  members: MeGroup["members"];
}) {
  const isAgent = m.author === "agent";
  const member = members.find((x) => x.userId === m.author);
  const isYou = member?.isYou ?? false;
  const who = isAgent ? "Concierge" : isYou ? "You" : (member?.name ?? m.author);

  return (
    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
      {isAgent ? <ConciergeDot /> : <Avatar name={who} size={32} />}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{who}</div>
        <div
          style={{
            color: "var(--ink-soft)",
            fontSize: "var(--text-sm)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {truncatePreview(m.body)}
        </div>
      </div>
    </div>
  );
}

function ConciergeDot() {
  return (
    <span
      aria-hidden
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        background: "radial-gradient(circle at 35% 35%, #ffe7b0, var(--lantern) 55%, var(--lantern-deep))",
        boxShadow: "0 0 12px rgba(255,178,74,0.55)",
      }}
    />
  );
}
