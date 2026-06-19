"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button, Card, Pill, Avatar } from "@/components/ui";

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

const steps = [
  {
    emoji: "👋",
    title: "Tell us a little",
    body: "A few light questions — what you're into, when you're free. No bio to agonise over.",
    tone: "coral" as const,
    chip: "2 minutes",
  },
  {
    emoji: "✨",
    title: "We match your group",
    body: "Our concierge pairs you with 3–5 like-minded people new to the same kind of fun.",
    tone: "sunny" as const,
    chip: "Small groups",
  },
  {
    emoji: "🎉",
    title: "Show up & enjoy",
    body: "One easy activity each week — a walk, a bite, a game night. Come as you are.",
    tone: "success" as const,
    chip: "Weekly",
  },
];

const friends = ["Maia T", "Liam O", "Priya S", "Noah W", "Aroha K"];

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          maxWidth: "var(--maxw)",
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-5) var(--space-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--text-xl)",
            color: "var(--ink)",
          }}
        >
          Side&nbsp;Quest
        </span>
        <Link href="/sign-up">
          <Button variant="ghost" style={{ minHeight: 42, fontSize: "var(--text-sm)" }}>
            Sign in
          </Button>
        </Link>
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
              <Pill tone="sunny">🌤️ For Auckland 20–35s, especially newcomers</Pill>
            </motion.div>

            <motion.h1
              variants={rise}
              style={{
                fontSize: "var(--text-hero)",
                margin: "var(--space-4) 0 var(--space-4)",
                maxWidth: "14ch",
              }}
            >
              New to Auckland?{" "}
              <span style={{ color: "var(--coral)" }}>Meet your people</span> this
              week.
            </motion.h1>

            <motion.p
              variants={rise}
              style={{
                fontSize: "var(--text-lg)",
                color: "var(--ink-soft)",
                maxWidth: "46ch",
                marginBottom: "var(--space-6)",
              }}
            >
              An AI concierge gathers a small group of friendly strangers for one
              low-key activity every week. No swiping, no awkward intros — just
              show up and enjoy.
            </motion.p>

            <motion.div
              variants={rise}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                alignItems: "center",
              }}
            >
              <Link href="/sign-up">
                <Button variant="primary" style={{ minHeight: 54, fontSize: "var(--text-lg)" }}>
                  Find my group →
                </Button>
              </Link>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ display: "flex" }}>
                  {friends.slice(0, 4).map((name, i) => (
                    <Avatar
                      key={name}
                      name={name}
                      size={36}
                      style={{
                        marginLeft: i === 0 ? 0 : -10,
                        border: "2px solid var(--background)",
                      }}
                    />
                  ))}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-soft)", fontWeight: 600 }}>
                  120+ met their crew
                </span>
              </span>
            </motion.div>
          </div>

          <motion.div variants={rise}>
            <Card
              interactive
              style={{
                background: "var(--surface)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-lg)",
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
                <span style={{ fontWeight: 800, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)" }}>
                  This week&apos;s side quest
                </span>
                <Pill tone="coral">Saturday</Pill>
              </div>
              <div
                style={{
                  background: "var(--coral-tint)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink)" }}>
                  ☕ Coffee & a coastal walk
                </div>
                <div style={{ color: "var(--ink-soft)", marginTop: "var(--space-1)" }}>
                  Mission Bay · 10:00am · easy pace
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex" }}>
                  {friends.map((name, i) => (
                    <Avatar
                      key={name}
                      name={name}
                      size={40}
                      style={{ marginLeft: i === 0 ? 0 : -12, border: "2px solid var(--surface)" }}
                    />
                  ))}
                </div>
                <Pill tone="success">You&apos;re in 🎉</Pill>
              </div>
            </Card>
          </motion.div>
        </motion.section>

        <section style={{ marginTop: "var(--space-9)" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)", maxWidth: "20ch" }}
          >
            Making friends as an adult, made easy.
          </motion.h2>

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
            {steps.map((step) => (
              <motion.div key={step.title} variants={rise}>
                <Card interactive style={{ height: "100%" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "var(--space-3)" }}>{step.emoji}</div>
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <Pill tone={step.tone}>{step.chip}</Pill>
                  </div>
                  <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>{step.title}</h3>
                  <p style={{ color: "var(--ink-soft)" }}>{step.body}</p>
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
            background: "linear-gradient(135deg, var(--coral) 0%, var(--sunny) 140%)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-8) var(--space-6)",
            textAlign: "center",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <h2 style={{ color: "var(--white)", fontSize: "var(--text-2xl)", marginBottom: "var(--space-3)" }}>
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
            Join this week&apos;s round. It&apos;s low-stakes, friendly, and you can
            come exactly as you are.
          </p>
          <Link href="/sign-up">
            <Button variant="accent" style={{ minHeight: 54, fontSize: "var(--text-lg)" }}>
              Get started — it&apos;s free
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
        }}
      >
        © {new Date().getFullYear()} Side Quest · Made in Tāmaki Makaurau Auckland
      </footer>
    </div>
  );
}
