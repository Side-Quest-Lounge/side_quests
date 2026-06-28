"use client";

import Link from "next/link";
import { Button, Card, Pill } from "@/components/ui";
import { useMeGroup } from "@/lib/api/use-me-group";
import { useMeQuests } from "@/lib/api/use-me-quests";
import type { MeGroup } from "@/lib/api/types";
import { DEMO, demoGroup, demoPastQuests } from "@/lib/demo";
import { formatOpenQuestDateShort } from "@/lib/open-quest-utils";
import { questDisplaySubtitle, questDisplayTitle } from "@/lib/quest-display";
import { groupPath } from "@/lib/paths";

function questMeta(group: MeGroup): string {
  const parts = [
    group.venue?.address,
    group.startsAt ? formatOpenQuestDateShort(group.startsAt) : null,
    `${group.members.length} in your party`,
  ].filter(Boolean);
  return parts.join(" · ");
}

function ActiveQuestCard({ group }: { group: MeGroup }) {
  const inProgress = group.status === "matched" || group.status === "forming";
  const title = questDisplayTitle(group.venue);
  return (
    <Card style={{ marginBottom: "var(--space-6)", boxShadow: "var(--shadow-sm), var(--shadow-coral)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
        <span className="meta" style={{ color: "var(--lantern-ink)" }}>
          {inProgress ? "This week · in progress" : group.status}
        </span>
        <Pill tone="coral">Saturday</Pill>
      </div>
      <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>{title}</h2>
      {questDisplaySubtitle(group.venue) && (
        <div className="meta" style={{ color: "var(--ink-soft)", marginBottom: "var(--space-2)" }}>
          {questDisplaySubtitle(group.venue)}
        </div>
      )}
      <div className="meta" style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
        {questMeta(group)}
      </div>
      <Link href={groupPath(group.id)}>
        <Button variant="primary">View this quest</Button>
      </Link>
    </Card>
  );
}

export default function QuestsPage() {
  const { group, loading: groupLoading } = useMeGroup();
  const { past: pastQuestsFromApi, loading: pastLoading } = useMeQuests();
  const activeGroup = DEMO ? demoGroup : group;
  const pastQuests = DEMO ? demoPastQuests : pastQuestsFromApi;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Your quest log</span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>Every quest so far</h1>
      </div>

      {groupLoading && !DEMO ? (
        <Card style={{ marginBottom: "var(--space-6)" }}>
          <p style={{ color: "var(--ink-soft)" }}>Loading your quest…</p>
        </Card>
      ) : activeGroup ? (
        <ActiveQuestCard group={activeGroup as MeGroup} />
      ) : (
        <Card style={{ marginBottom: "var(--space-6)", background: "var(--cream-deep)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>No active quest yet</h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
            Finish your profile, then find your party for this week&apos;s Side Quest.
          </p>
          <Link href="/finding">
            <Button variant="primary">Find my party →</Button>
          </Link>
        </Card>
      )}

      <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
        Completed
      </span>
      {pastLoading && !DEMO ? (
        <Card>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>Loading…</p>
        </Card>
      ) : pastQuests.length === 0 ? (
        <Card>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
            Completed quests appear here after your first Side Quest and post-quest survey.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {pastQuests.map((q) => (
            <Card key={q.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <span style={{ fontSize: "1.8rem" }}>{q.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{q.title}</div>
                <div className="meta" style={{ color: "var(--ink-faint)" }}>{q.date}</div>
              </div>
              {q.vibeScore != null && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--lantern-ink)" }}>{"★".repeat(q.vibeScore)}</div>
                  <div className="meta" style={{ color: "var(--ink-faint)" }}>your vibe</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
