"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui";
import { DisplayName } from "@/components/user-display";
import { DEMO_GROUP_ID } from "@/lib/demo";
import { chatPath } from "@/lib/paths";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
  // extra path prefixes that should light this item up
  match?: string[];
  tab?: boolean; // shown in the mobile bottom bar
};

const nav: NavItem[] = [
  { href: "/home", label: "Home", icon: IconHome, match: ["/finding", "/group", "/survey"], tab: true },
  { href: "/explore", label: "Explore", icon: IconCompass, tab: true },
  { href: chatPath(), label: "Chat", icon: IconChat, match: [`/chat/${DEMO_GROUP_ID}`], tab: true },
  { href: "/quests", label: "Quests", icon: IconMap },
];

function isActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
  return (item.match ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-root">
      <aside className="app-sidebar">
        <Link href="/home" className="app-brand">
          <Lantern />
          <span>Side&nbsp;Quest</span>
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: "var(--space-5)" }}>
          {nav.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link key={item.href} href={item.href} className={`app-nav-item${active ? " is-active" : ""}`}>
                {item.icon(active)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href="/onboarding" className="app-user-chip">
          <DisplayName>
            {(name) => (
              <>
                <Avatar name={name} size={34} />
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", whiteSpace: "nowrap" }}>{name}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--ink-faint)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Edit profile
                  </span>
                </span>
              </>
            )}
          </DisplayName>
        </Link>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Link href="/home" className="app-topbar-brand">
            <Lantern />
            <span>Side&nbsp;Quest</span>
          </Link>
          <div style={{ flex: 1 }} />
          <span className="app-status">
            <span className="app-status-dot" />
            This week · Sat 10am
          </span>
          <span aria-hidden className="app-bell">
            <IconBell />
          </span>
          <Link href="/onboarding" aria-label="Edit profile">
            <DisplayName>{(name) => <Avatar name={name} size={34} />}</DisplayName>
          </Link>
        </header>

        <main className="app-content">{children}</main>
      </div>

      <nav className="app-tabs">
        {nav
          .filter((i) => i.tab)
          .map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link key={item.href} href={item.href} className={`app-tab${active ? " is-active" : ""}`}>
                {item.icon(active)}
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}

function Lantern() {
  return (
    <span
      aria-hidden
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        flexShrink: 0,
        background: "radial-gradient(circle at 35% 35%, #ffe7b0, var(--lantern) 55%, var(--lantern-deep))",
        boxShadow: "0 0 14px rgba(255,178,74,0.65)",
      }}
    />
  );
}

const stroke = {
  fill: "none",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconHome(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...stroke} aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9h14v-9" />
      {active && <path d="M10 19v-5h4v5" />}
    </svg>
  );
}

function IconCompass(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...stroke} aria-hidden>
      <path d="M4 5h16v11H8l-4 3z" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...stroke} aria-hidden>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" stroke="currentColor" {...stroke} aria-hidden>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
