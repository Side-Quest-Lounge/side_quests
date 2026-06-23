"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { DEMO, DEMO_GROUP_ID, demoGroup } from "@/lib/demo";

type Member = {
  userId: string;
  name: string;
  bio: string | null;
  matchScore: number;
  isYou: boolean;
};

type GroupData = {
  id: string;
  status: string;
  rationale: string;
  icebreakers: string[];
  venue: { name: string; activityType: string; address: string } | null;
  startsAt: string | null;
  subscriptionStatus: string;
  members: Member[];
};

export default function GroupRevealPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isDemoGroup = DEMO || id === DEMO_GROUP_ID;
  const [group, setGroup] = useState<GroupData | null>(isDemoGroup ? demoGroup : null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (isDemoGroup) {
      setGroup(demoGroup);
      return;
    }
    async function load() {
      const res = await fetch("/api/me/group");
      if (!res.ok) return;
      const data = (await res.json()) as { group: GroupData | null };
      if (data.group?.id === id) setGroup(data.group);
    }
    void load();
  }, [id, isDemoGroup]);

  async function confirmSeat() {
    if (DEMO) {
      setGroup((g) => (g ? { ...g, subscriptionStatus: "active" } : g));
      return;
    }
    setCheckoutLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id }),
    });
    const data = (await res.json()) as { url?: string };
    if (data.url) window.location.href = data.url;
    setCheckoutLoading(false);
  }

  const isActive = group?.subscriptionStatus === "active";
  const checkoutSuccess = searchParams.get("checkout") === "success";

  if (!group) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--ink-soft)" }}>
        Loading your group…
      </div>
    );
  }

  const startsLabel = group.startsAt
    ? new Date(group.startsAt).toLocaleString("en-NZ", {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Saturday · 4pm";

  return (
    <div>
      <Pill tone="success">Your party · this week</Pill>
      <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-4) 0" }}>
        Your party has assembled
      </h1>

      {checkoutSuccess && (
        <Card style={{ marginBottom: "var(--space-5)", background: "var(--success-bg)" }}>
          Seat confirmed — see you there! 🎉
        </Card>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-5)",
          marginBottom: "var(--space-6)",
        }}
      >
        <Card>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>Your party</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {group.members.map((m) => (
              <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <Avatar name={m.name} size={44} />
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {m.name} {m.isYou && <Pill tone="coral">You</Pill>}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-soft)" }}>
                    {m.bio ?? "Joined this week"} · {Math.round(m.matchScore * 100)}% match
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>
            Why you&apos;re together
          </h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>{group.rationale}</p>

          <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-2)" }}>Icebreakers</h3>
          <ul style={{ paddingLeft: "var(--space-5)", color: "var(--ink-soft)" }}>
            {group.icebreakers.map((ib) => (
              <li key={ib} style={{ marginBottom: "var(--space-2)" }}>
                {ib}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>Your quest this week</h2>
        {group.venue ? (
          <>
            <div style={{ fontWeight: 800, fontSize: "var(--text-xl)" }}>{group.venue.name}</div>
            <div style={{ color: "var(--ink-soft)" }}>
              {group.venue.activityType} · {group.venue.address}
            </div>
            <div style={{ marginTop: "var(--space-2)", fontWeight: 600 }}>{startsLabel}</div>
          </>
        ) : (
          <p style={{ color: "var(--ink-soft)" }}>Venue details coming soon</p>
        )}
      </Card>

      {isActive ? (
        <Link href={`/chat/${group.id}`}>
          <Button variant="primary" style={{ minHeight: 54 }}>
            Open group chat →
          </Button>
        </Link>
      ) : (
        <Button variant="primary" style={{ minHeight: 54 }} onClick={() => void confirmSeat()} disabled={checkoutLoading}>
          {checkoutLoading ? "Opening checkout…" : "Confirm my seat — $25/mo"}
        </Button>
      )}

      <div style={{ marginTop: "var(--space-5)" }}>
        <Link href={`/survey/${group.id}`} style={{ color: "var(--ink-faint)", fontSize: "var(--text-sm)" }}>
          After the event? Leave feedback →
        </Link>
      </div>
    </div>
  );
}
