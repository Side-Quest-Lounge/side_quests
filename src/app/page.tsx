"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button, Card, Avatar } from "@/components/ui";
import { DEMO } from "@/lib/demo";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
} as const;

const stages = [
  {
    no: "01",
    title: "Tell us your vibe",
    body: "A few light questions — what you're into, when you're free. No bio to agonise over.",
  },
  {
    no: "02",
    title: "We assemble your party",
    body: "The concierge pairs you with 3–5 like-minded people new to the same kind of fun.",
  },
  {
    no: "03",
    title: "Accept & show up",
    body: "One easy activity each week — a walk, a bite, a game night. Come as you are.",
  },
];

const party = ["Maia T", "Liam O", "Priya S", "Noah W", "Aroha K"];

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          maxWidth: "var(--maxw)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "var(--text-xl)",
            color: "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Lantern /> Side&nbsp;Quest
        </span>
        <Link href="/sign-in">
          <Button variant="ghost" style={{ minHeight: 42, fontSize: "var(--text-sm)" }}>
            Log in
          </Button>
        </Link>
        {DEMO && (
          <Link href="/home" style={{ marginLeft: "var(--space-2)" }}>
            <Button variant="primary" style={{ minHeight: 42, fontSize: "var(--text-sm)" }}>
              Try demo
            </Button>
          </Link>
        )}
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: "var(--maxw)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-6) var(--space-5) var(--space-9)",
        }}
      >
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "var(--space-7)",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          <div>
            <motion.div variants={rise}>
              <QuestTag>For Auckland newcomers · 20–35</QuestTag>
            </motion.div>

            <motion.h1
              variants={rise}
              style={{
                fontSize: "var(--text-hero)",
                fontWeight: 800,
                margin: "var(--space-4) 0",
                maxWidth: "16ch",
              }}
            >
              Your next side quest:{" "}
              <span style={{ color: "var(--lantern-ink)" }}>meet your people.</span>
            </motion.h1>

            <motion.p
              variants={rise}
              style={{
                fontSize: "var(--text-lg)",
                color: "var(--ink-soft)",
                maxWidth: "48ch",
                marginBottom: "var(--space-6)",
              }}
            >
              Each week our concierge assembles a small party of friendly strangers and sets
              you one low-key activity. No swiping, no small-talk gauntlet — just accept the
              quest and show up.
            </motion.p>

            <motion.div
              variants={rise}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-4)",
                alignItems: "center",
              }}
            >
              <Link href="/sign-up">
                <Button variant="primary" style={{ minHeight: 54, fontSize: "var(--text-lg)" }}>
                  Accept this week&apos;s quest →
                </Button>
              </Link>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ display: "flex" }}>
                  {party.slice(0, 4).map((name, i) => (
                    <Avatar
                      key={name}
                      name={name}
                      size={36}
                      style={{ marginLeft: i === 0 ? 0 : -10, border: "2px solid var(--background)" }}
                    />
                  ))}
                </span>
                <span className="meta" style={{ color: "var(--ink-soft)" }}>
                  120 matched
                </span>
              </span>
            </motion.div>
          </div>

          <motion.div variants={rise}>
            <QuestCard />
          </motion.div>
        </motion.section>

        <section style={{ marginTop: "var(--space-9)" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
          >
            <span className="meta">The quest log</span>
            <h2 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-2) 0 var(--space-6)", maxWidth: "22ch" }}>
              Three steps from new in town to a standing Saturday plan.
            </h2>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "var(--space-5)",
            }}
          >
            {stages.map((stage) => (
              <motion.div key={stage.no} variants={rise}>
                <Card interactive style={{ height: "100%" }}>
                  <span
                    className="meta"
                    style={{
                      color: "var(--lantern-ink)",
                      fontSize: "1.5rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {stage.no}
                  </span>
                  <h3 style={{ fontSize: "var(--text-xl)", margin: "var(--space-3) 0 var(--space-2)" }}>
                    {stage.title}
                  </h3>
                  <p style={{ color: "var(--ink-soft)" }}>{stage.body}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
          style={{
            marginTop: "var(--space-9)",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, var(--lantern) 0%, var(--lantern-deep) 100%)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-8) var(--space-6)",
            textAlign: "center",
            boxShadow: "var(--shadow-coral)",
          }}
        >
          <span className="meta" style={{ color: "var(--on-coral)" }}>
            Party forming
          </span>
          <h2 style={{ color: "#1a1535", fontSize: "var(--text-2xl)", margin: "var(--space-2) 0 var(--space-3)" }}>
            Your people are already out there.
          </h2>
          <p
            style={{
              color: "var(--on-coral)",
              fontSize: "var(--text-lg)",
              maxWidth: "40ch",
              margin: "0 auto var(--space-6)",
            }}
          >
            Join this week&apos;s round. It&apos;s low-stakes, friendly, and you can come exactly as
            you are.
          </p>
          <Link href="/sign-up">
            <Button variant="primary" style={{ minHeight: 54, fontSize: "var(--text-lg)" }}>
              Accept the quest — it&apos;s free
            </Button>
          </Link>
        </motion.section>
      </main>

      <footer
        style={{
          maxWidth: "var(--maxw)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-6) var(--space-5)",
          color: "var(--ink-faint)",
          fontSize: "var(--text-sm)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          justifyContent: "space-between",
        }}
      >
        <span>© {new Date().getFullYear()} Side Quest</span>
        <span className="meta">Made in Tāmaki Makaurau Auckland</span>
      </footer>
    </div>
  );
}

function Lantern() {
  return (
    <span
      aria-hidden
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "inline-block",
        background: "radial-gradient(circle at 35% 35%, #ffe7b0, var(--lantern) 55%, var(--lantern-deep))",
        boxShadow: "0 0 16px rgba(255,178,74,0.7)",
      }}
    />
  );
}

function QuestTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="meta"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "0.4rem 0.85rem",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-pill)",
        color: "var(--ink-soft)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--aqua)",
          boxShadow: "0 0 8px var(--aqua)",
        }}
      />
      {children}
    </span>
  );
}

function QuestCard() {
  return (
    <Card
      interactive
      style={{
        position: "relative",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-lg), var(--shadow-coral)",
        background: "linear-gradient(180deg, var(--surface-2-raw), var(--surface-raw))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
        }}
      >
        <span className="meta" style={{ color: "var(--lantern-ink)" }}>
          This week&apos;s quest
        </span>
        <span
          className="meta"
          style={{
            color: "var(--ink)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-pill)",
            padding: "0.25rem 0.6rem",
          }}
        >
          ★ Sat
        </span>
      </div>

      <div
        style={{
          position: "relative",
          background: "var(--coral-tint)",
          border: "1px solid rgba(255,178,74,0.22)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          marginBottom: "var(--space-5)",
        }}
      >
        <div
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
          }}
        >
          ☕ Coffee &amp; a coastal walk
        </div>
        <div className="meta" style={{ marginTop: "var(--space-2)", color: "var(--ink-soft)" }}>
          Mission Bay · 10:00 · easy pace
        </div>

        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 14,
            bottom: -18,
            transform: "rotate(-9deg)",
            width: 66,
            height: 66,
            borderRadius: "50%",
            border: "2px dashed var(--aqua)",
            color: "var(--aqua-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.1em",
            lineHeight: 1.2,
            background: "var(--surface-raw)",
            boxShadow: "0 0 18px rgba(77,214,193,0.28)",
          }}
        >
          YOU&apos;RE
          <br />
          IN
        </span>
      </div>

      <span className="meta" style={{ display: "block", marginBottom: "var(--space-3)" }}>
        Your party · 5
      </span>
      <div style={{ display: "flex", alignItems: "center" }}>
        {party.map((name, i) => (
          <Avatar
            key={name}
            name={name}
            size={42}
            style={{ marginLeft: i === 0 ? 0 : -12, border: "2px solid var(--surface-raw)" }}
          />
        ))}
      </div>
    </Card>
  );
}
