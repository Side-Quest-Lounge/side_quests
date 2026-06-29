"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Field, Pill } from "@/components/ui";
import { OpenQuestTile } from "@/components/open-quest-tile";
import { useMeProfile } from "@/lib/api/use-me-profile";
import { useSubscription } from "@/lib/api/use-subscription";
import { useOpenQuests } from "@/context/open-quests";
import { formatOpenQuestDate } from "@/lib/open-quest-utils";
import { PAYMENTS_DISABLED } from "@/lib/payments";
import { clampOpenQuestCapacity } from "@/lib/open-quest-limits";

const CHAT_MSG_KEY = (questId: string) => `sq_open_chat_${questId}`;

function seedWelcomeMessage(quest: { id: string; title: string; startsAt: string; venue: string }): void {
  const key = CHAT_MSG_KEY(quest.id);
  if (localStorage.getItem(key)) return;
  const welcome = [
    {
      id: `welcome-${quest.id}`,
      author: "agent",
      body: `You're in for ${quest.title}! ${formatOpenQuestDate(quest.startsAt)} · ${quest.venue}. Say hi below — the concierge will share a pin closer to the date.`,
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(key, JSON.stringify(welcome));
}

function CreateOpenQuestForm() {
  const { createQuest } = useOpenQuests();
  const { canHostOpenQuest, loading } = useSubscription();
  const { user } = useMeProfile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("✨");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [error, setError] = useState<string | null>(null);

  if (loading || !canHostOpenQuest) return null;

  function reset() {
    setEmoji("✨");
    setTitle("");
    setVenue("");
    setStartsAt("");
    setCapacity("8");
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !venue.trim() || !startsAt) {
      setError("Title, venue, and date are required.");
      return;
    }
    const cap = clampOpenQuestCapacity(parseInt(capacity, 10) || 8);
    const { quest: created, error: createError } = createQuest({
      emoji: emoji.trim() || "✨",
      title: title.trim(),
      venue: venue.trim(),
      startsAt: new Date(startsAt).toISOString(),
      capacity: cap,
      createdBy: user?.name?.trim() || "You",
    });
    if (!created) {
      setError(createError ?? "Could not create quest.");
      return;
    }
    seedWelcomeMessage(created);
    reset();
    setOpen(false);
    router.replace(`/explore?quest=${encodeURIComponent(created.id)}`);
  }

  return (
    <Card style={{ marginBottom: "var(--space-6)", background: "var(--sunny-soft)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <div>
          <Pill tone="sunny" style={{ marginBottom: "var(--space-2)" }}>
            Host a quest
          </Pill>
          <p style={{ fontWeight: 700, marginBottom: "var(--space-1)" }}>Create an open quest</p>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}>
            {PAYMENTS_DISABLED
              ? "Host an open quest — anyone can join and hop into the party chat."
              : "Paid members can host open quests — anyone can join and hop into the party chat."}
          </p>
        </div>
        {!open && (
          <Button variant="primary" type="button" onClick={() => setOpen(true)}>
            New quest +
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "var(--space-5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "var(--space-3)" }}>
            <Field label="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
            <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunset picnic at Cornwall Park" required />
          </div>
          <Field label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Cornwall Park, Epsom" required />
          <Field
            label="Date & time"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <Field label="Capacity" type="number" min={2} max={20} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          {error && <p style={{ color: "var(--coral)", fontWeight: 600, fontSize: "var(--text-sm)" }}>{error}</p>}
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Button variant="primary" type="submit">
              Publish quest
            </Button>
            <Button variant="ghost" type="button" onClick={() => { setOpen(false); reset(); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("quest");
  const { quests, toggleJoin } = useOpenQuests();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightId) return;
    const el = cardRefs.current[highlightId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  function handleJoin(questId: string) {
    const result = toggleJoin(questId);
    const quest = quests.find((q) => q.id === questId);
    if (result.joined && quest) {
      seedWelcomeMessage(quest);
    }
  }

  const joinedQuests = quests.filter((q) => q.joined);
  const availableQuests = quests.filter((q) => !q.joined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
      {joinedQuests.length > 0 && (
        <section>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-1)" }}>Your open quests</h2>
            <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)", margin: 0 }}>
              {joinedQuests.length} quest{joinedQuests.length === 1 ? "" : "s"} joined — open party chat or leave anytime.
            </p>
          </div>
          <div className="open-quest-grid open-quest-grid--explore">
            {joinedQuests.map((e) => (
              <div
                key={e.id}
                ref={(node) => {
                  cardRefs.current[e.id] = node;
                }}
              >
                <OpenQuestTile
                  quest={e}
                  highlighted={highlightId === e.id}
                  onLeave={() => toggleJoin(e.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-1)" }}>
            {joinedQuests.length > 0 ? "Discover more" : "All open quests"}
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)", margin: 0 }}>
            Join any quest below — you&apos;ll be added to its party chat instantly.
          </p>
        </div>
        {quests.length === 0 ? (
          <Card>
            <p style={{ color: "var(--ink-soft)", margin: 0 }}>
              {PAYMENTS_DISABLED
                ? "No open quests yet — host one above."
                : "No open quests yet. Paid members can host one above."}
            </p>
          </Card>
        ) : availableQuests.length === 0 ? (
          <Card style={{ background: "var(--cream-deep)" }}>
            <p style={{ color: "var(--ink-soft)", margin: 0 }}>
              You&apos;ve joined every open quest this week — nice one! Check back later for new ones.
            </p>
          </Card>
        ) : (
          <div className="open-quest-grid open-quest-grid--explore">
            {availableQuests.map((e) => (
              <div
                key={e.id}
                ref={(node) => {
                  cardRefs.current[e.id] = node;
                }}
              >
                <OpenQuestTile
                  quest={e}
                  highlighted={highlightId === e.id}
                  onJoin={() => handleJoin(e.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="meta">Open quests</span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>
          Jump into something this week
        </h1>
        <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-2)", maxWidth: "52ch" }}>
          Beyond your matched party, anyone can join these open quests around Tāmaki Makaurau. Joining
          adds you to the quest chat room automatically.
        </p>
      </div>

      <CreateOpenQuestForm />

      <Suspense fallback={<p style={{ color: "var(--ink-soft)" }}>Loading quests…</p>}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
