"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfileGateLink } from "@/components/profile-gate-link";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { DisplayName } from "@/components/user-display";
import type { MeGroup } from "@/lib/api/types";
import { useMeGroup } from "@/lib/api/use-me-group";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { useOpenQuests } from "@/context/open-quests";
import { DEMO, demoGroup, demoMessages, demoPastQuests } from "@/lib/demo";
import { canViewFullQuest, hasActiveSeat } from "@/lib/seat-access";
import { chatPath, exploreQuestPath, groupPath } from "@/lib/paths";

export default function HomePage() {
  const { hasProfile, loading: profileLoading } = useMeProfile();
  const { group, groupId, loading: groupLoading } = useMeGroup();
  const { quests: openQuests } = useOpenQuests();

  const quest = DEMO ? demoGroup : group;
  const unlocked = quest ? canViewFullQuest(quest.subscriptionStatus) : false;
  const seatActive = quest ? hasActiveSeat(quest.subscriptionStatus) : false;
  const showPartyFeed = DEMO || (group && seatActive);

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
            No sign-in required — explore the full weekly quest flow.
          </p>
        </Card>
      )}

      {!profileLoading && !hasProfile && (
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
          ) : DEMO ? (
            <QuestHero quest={demoGroup} groupId={groupId} unlocked />
          ) : !group ? (
            <FindingCard hasProfile={hasProfile} />
          ) : unlocked ? (
            <QuestHero quest={group} groupId={groupId} unlocked />
          ) : (
            <QuestTeaser quest={group} />
          )}

          {showPartyFeed && (
            <Card>
              <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>Latest in your party</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {demoMessages.slice(-3).map((m) => {
                  const isYou = m.author === "you";
                  const isAgent = m.author === "agent";
                  const who = isAgent ? "Concierge" : isYou ? "You" : m.author;
                  return (
                    <div key={m.id} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                      {isAgent ? <ConciergeDot /> : <Avatar name={who} size={32} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{who}</div>
                        <div style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>{m.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {quest && unlocked && (
            <Card>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>From your concierge</h2>
                  <p
                    style={{
                      color: "var(--ink-soft)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {quest.rationale}
                  </p>
                </div>
                <ProfileGateLink href={groupPath(groupId ?? undefined)} className="dash-link" style={{ flexShrink: 0, marginTop: "var(--space-1)" }}>
                  Full reveal →
                </ProfileGateLink>
              </div>
            </Card>
          )}

          {group && !unlocked && (
            <Card style={{ background: "var(--cream-deep)" }}>
              <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>Your party is ready</h2>
              <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
                {group.members.length} people matched for you. Confirm your seat to see names, the concierge&apos;s
                rationale, and party chat.
              </p>
              <Link href={groupPath(group.id)}>
                <Button variant="primary">View party &amp; confirm seat →</Button>
              </Link>
            </Card>
          )}

          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
              <h2 style={{ fontSize: "var(--text-lg)" }}>Open quests anyone can join</h2>
              <Link href="/explore" className="dash-link">
                See all →
              </Link>
            </div>
            <div className="dash-duo">
              {openQuests.slice(0, 2).map((e) => (
                <Card key={e.id} interactive style={{ height: "100%" }}>
                  <div style={{ fontSize: "1.6rem", marginBottom: "var(--space-2)" }}>{e.emoji}</div>
                  <div style={{ fontWeight: 700, marginBottom: "var(--space-1)" }}>{e.title}</div>
                  <div className="meta" style={{ color: "var(--ink-soft)" }}>
                    {e.when} · {e.venue}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-3)" }}>
                    <Pill tone="success">{e.spotsLeft} spots left</Pill>
                    <Link href={exploreQuestPath(e.id)} className="dash-link">
                      More info →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {quest?.startsAt && <Countdown startsAt={quest.startsAt} />}

          <Card>
            <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
              Your seat
            </span>
            {!group && !DEMO ? (
              <p style={{ color: "var(--ink-soft)" }}>Match into a party first — then confirm your seat.</p>
            ) : seatActive ? (
              <p style={{ color: "var(--success-fg)", fontWeight: 700 }}>Confirmed — see you there 🎉</p>
            ) : (
              <>
                <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-3)" }}>
                  Seat not confirmed yet — lock in on your group reveal.
                </p>
                <Link href={groupPath(groupId ?? undefined)} className="dash-link">
                  Confirm seat →
                </Link>
              </>
            )}
          </Card>

          <Card>
            <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
              Past quests
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {demoPastQuests.map((q) => (
                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "1.25rem" }}>{q.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.title}
                    </div>
                    <div className="meta" style={{ color: "var(--ink-faint)" }}>{q.date}</div>
                  </div>
                  <span aria-label={`${q.vibeScore} out of 5`} style={{ color: "var(--lantern-ink)", fontSize: "var(--text-sm)" }}>
                    {"★".repeat(q.vibeScore)}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/quests" className="dash-link" style={{ display: "inline-block", marginTop: "var(--space-3)" }}>
              All quests →
            </Link>
          </Card>
        </div>
      </div>
    </div>
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
  const activity = quest.venue?.activityType ?? "Weekly activity";
  return (
    <Card style={{ boxShadow: "var(--shadow-md), var(--shadow-coral)" }}>
      <span className="meta" style={{ color: "var(--lantern-ink)" }}>
        This week&apos;s quest
      </span>
      <h2 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-2) 0" }}>{activity}</h2>
      <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
        Party of {quest.members.length} matched · confirm your seat to see who&apos;s coming.
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
  quest: MeGroup | typeof demoGroup;
  groupId: string | null;
  unlocked: boolean;
}) {
  const venue = quest.venue;
  const title = venue?.name ?? "This week's quest";
  const subtitle = [venue?.activityType, venue?.address].filter(Boolean).join(" · ");
  const chatHref = groupId ? chatPath(groupId) : chatPath();

  return (
    <Card style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow-md), var(--shadow-coral)" }}>
      <div style={{ background: "var(--coral-tint)", padding: "var(--space-5)", borderBottom: "1px solid rgba(255,178,74,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
          <span className="meta" style={{ color: "var(--lantern-ink)" }}>
            This week&apos;s quest
          </span>
          <Pill tone="coral">Saturday</Pill>
        </div>
        <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-2)" }}>{title}</h2>
        {subtitle && (
          <div className="meta" style={{ color: "var(--ink-soft)" }}>
            {subtitle}
          </div>
        )}
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

function Countdown({ startsAt }: { startsAt: string | null }) {
  const [label] = useState(() => {
    if (!startsAt) return "—";
    const ms = new Date(startsAt).getTime() - Date.now();
    const days = Math.max(0, Math.floor(ms / 86_400_000));
    const hours = Math.max(0, Math.floor((ms % 86_400_000) / 3_600_000));
    return `${days}d ${hours}h`;
  });

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
