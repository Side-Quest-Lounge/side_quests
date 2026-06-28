"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { DEMO, DEMO_GROUP_ID, demoGroup } from "@/lib/demo";
import { PAYMENTS_DISABLED } from "@/lib/payments";
import { canViewFullQuest } from "@/lib/seat-access";

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
  const [notFound, setNotFound] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  useEffect(() => {
    if (isDemoGroup) {
      setGroup(demoGroup);
      return;
    }

    async function load() {
      const res = await fetch("/api/me/group");
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = (await res.json()) as { group: GroupData | null };
      if (!data.group || data.group.id !== id) {
        setNotFound(true);
        return;
      }
      setGroup(data.group);
    }
    void load();
  }, [id, isDemoGroup]);

  async function confirmSeat() {
    setCheckoutLoading(true);
    try {
      if (PAYMENTS_DISABLED) {
        const res = await fetch("/api/me/confirm-seat", { method: "POST" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        setGroup((g) => (g ? { ...g, subscriptionStatus: data.status } : g));
        setJustConfirmed(true);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: id }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (notFound) {
    return (
      <Card style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
          This group wasn&apos;t found or isn&apos;t yours.
        </p>
        <Link href="/home">
          <Button variant="primary">Back to home</Button>
        </Link>
      </Card>
    );
  }

  if (!group) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--ink-soft)" }}>
        Loading your group…
      </div>
    );
  }

  const unlocked = canViewFullQuest(group.subscriptionStatus);
  const checkoutSuccess = searchParams.get("checkout") === "success";
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
        {unlocked ? "Your party has assembled" : "Your party is ready"}
      </h1>

      {(justConfirmed || checkoutSuccess) && unlocked && (
        <Card style={{ marginBottom: "var(--space-5)", background: "var(--success-bg)" }}>
          Seat confirmed — see you there! 🎉
        </Card>
      )}

      {!unlocked && (
        <Card style={{ marginBottom: "var(--space-5)", background: "var(--coral-tint)" }}>
          <p style={{ fontWeight: 700, marginBottom: "var(--space-2)" }}>Confirm your seat to unlock</p>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
            See who&apos;s in your party, read the concierge&apos;s rationale, and open group chat after confirming.
          </p>
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
          {unlocked ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {group.members.map((m) => (
                <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <Avatar name={m.name} size={44} />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {m.name} {m.isYou && <Pill tone="coral">You</Pill>}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-soft)" }}>
                      {m.bio ?? "Joined this week"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>
                {`${group.members.length} people matched for this quest.`}
              </p>
              <div style={{ display: "flex", filter: "blur(6px)", opacity: 0.55, pointerEvents: "none" }}>
                {group.members.slice(0, 4).map((m, i) => (
                  <Avatar
                    key={m.userId}
                    name="?"
                    size={44}
                    style={{ marginLeft: i === 0 ? 0 : -12, border: "2px solid var(--surface-raw)" }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>
            Why you&apos;re together
          </h2>
          {unlocked ? (
            <>
              <p style={{ color: "var(--ink-soft)", marginBottom: "var(--space-4)" }}>{group.rationale}</p>
              <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-2)" }}>Icebreakers</h3>
              <ul style={{ paddingLeft: "var(--space-5)", color: "var(--ink-soft)" }}>
                {group.icebreakers.map((ib) => (
                  <li key={ib} style={{ marginBottom: "var(--space-2)" }}>
                    {ib}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "var(--ink-soft)" }}>
              Your concierge matched you on shared vibe and availability. Confirm your seat to read the full reveal
              and icebreakers.
            </p>
          )}
        </Card>
      </div>

      <Card style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>Your quest this week</h2>
        {group.venue ? (
          <>
            {unlocked ? (
              <>
                <div style={{ fontWeight: 800, fontSize: "var(--text-xl)" }}>{group.venue.name}</div>
                <div style={{ color: "var(--ink-soft)" }}>
                  {group.venue.activityType} · {group.venue.address}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--ink-soft)" }}>
                {group.venue.activityType} · {startsLabel}
                <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  Exact venue shared after you confirm.
                </div>
              </div>
            )}
            {unlocked && <div style={{ marginTop: "var(--space-2)", fontWeight: 600 }}>{startsLabel}</div>}
          </>
        ) : (
          <p style={{ color: "var(--ink-soft)" }}>Venue details coming soon</p>
        )}
      </Card>

      {unlocked ? (
        <Link href={`/chat/${group.id}`}>
          <Button variant="primary" style={{ minHeight: 54 }}>
            Open group chat →
          </Button>
        </Link>
      ) : (
        <Button variant="primary" style={{ minHeight: 54 }} onClick={() => void confirmSeat()} disabled={checkoutLoading}>
          {checkoutLoading
            ? PAYMENTS_DISABLED
              ? "Confirming…"
              : "Opening checkout…"
            : PAYMENTS_DISABLED
              ? "Confirm my seat →"
              : "Confirm my seat — $25/mo"}
        </Button>
      )}

      {unlocked && (
        <div style={{ marginTop: "var(--space-5)" }}>
          <Link href={`/survey/${group.id}`} style={{ color: "var(--ink-faint)", fontSize: "var(--text-sm)" }}>
            After the event? Leave feedback →
          </Link>
        </div>
      )}
    </div>
  );
}
