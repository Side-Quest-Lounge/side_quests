# Side Quest — UI/UX & Frontend Guidelines

**Audience:** Everyone building or reviewing frontend work on Side Quest.  
**Goal:** One shared reference so screens feel cohesive, code stays easy to review, and we ship production-ready UI without reinventing patterns.

**Source of truth for tokens & layout:** `src/app/globals.css`  
**Source of truth for components:** `src/components/ui.tsx`  
**App chrome:** `src/components/app-shell.tsx`

---

## 1. Product voice & UX principles

Side Quest helps newcomers in Auckland meet people through **one low-pressure weekly activity**. The UI should feel like a **bright harbour morning** — warm, clear, and human — not a corporate dashboard or a gamified social app.

### Locked product decisions

| Principle | What it means in UI |
|-----------|---------------------|
| **Simple & literal** | Say what things are: “Your party”, “Open quests”, “From your concierge”. No metaphor layers (orbits, crystals, etc.). |
| **Explainable AI** | Concierge copy is plain language. Show a teaser on Home; full rationale lives on the group reveal. |
| **Low pressure** | Friendly tone, optional fields, easy exits (“tap to leave”). Avoid urgency tricks. |
| **Activity > dinner** | Lead with the quest (what, where, when) before social mechanics. |
| **One primary action per card** | Each card answers one question. Don’t stack competing CTAs. |

### Information hierarchy (dashboard)

On **Home**, content flows top → bottom by importance:

1. **This week’s quest** — what’s happening  
2. **Party activity** — chat preview  
3. **Concierge insight** — why you were matched (+ single “Full reveal →”)  
4. **Open quests** — optional extras  
5. **Right rail** — countdown, seat status, history  

**Rule:** If two elements do the same job, keep one. Example: only one “Full reveal →” on Home (in the concierge card).

### Copy guidelines

- **Headings:** Short, sentence case (`This week's quest`, not `THIS WEEK'S QUEST`).
- **Meta labels:** Uppercase tracked mono via `.meta` (`YOUR WEEK`, `THIS WEEK · SAT 10AM`).
- **CTAs:** Verb-first (`Open party chat`, `Join this quest`, `Continue to vibe quiz →`).
- **Links:** Arrow suffix for forward navigation (`See all →`, `Full reveal →`). Use `dash-link` class in the app shell.
- **Locale:** New Zealand English where natural (`Kia ora`, `Tāmaki Makaurau`). Avoid US-only idioms.
- **Concierge:** Always “Concierge” in UI, never “AI” or “bot” in user-facing text.

---

## 2. Visual identity — “Quest Log / daybreak”

The palette is **bright airy base + lantern amber + harbour aqua**. Think morning light on the water, not sunset gradients.

### Colour roles

| Token | Hex / value | Use for |
|-------|-------------|---------|
| `--day` | `#f6f8f5` | Page background |
| `--surface` | `#ffffff` | Cards |
| `--surface-2-raw` | `#f1f4f1` | Inputs, raised insets |
| `--lantern` / `--coral` | `#ffb24a` | Primary CTA fill |
| `--lantern-ink` | `#b5630a` | Amber text, active nav, dash links |
| `--aqua` / `--sunny` | `#36cdb6` | Secondary accent, success, status dot |
| `--aqua-ink` | `#0a7d6d` | Aqua text on light surfaces |
| `--ink` | `#211b3a` | Primary text |
| `--ink-soft` | `#5f5878` | Body secondary |
| `--ink-faint` | `#938bad` | Hints, meta, placeholders |
| `--ember` | `#f0563f` | Errors only — use sparingly |
| `--coral-tint` | `rgba(255,178,74,0.18)` | Hero bands, active nav bg |

### Colour rules

1. **Never hard-code hex in components.** Use CSS variables from `globals.css`.
2. **Primary actions = lantern** (`Button variant="primary"`). Secondary positive = aqua (`variant="accent"`).
3. **Success = aqua**, not green. Use `Pill tone="success"` or `--success-fg`.
4. **Ember/coral-red** only for errors and “almost full” urgency (`spotsLeft <= 2`).
5. **Body background** is already set globally — don’t wrap pages in extra coloured containers unless it’s a hero band inside a card.

### Brand mark — Lantern

The lantern is a small amber radial-gradient circle (see `Lantern` in `app-shell.tsx` and landing `page.tsx`). Use beside “Side Quest” in headers only — don’t scatter it as decoration.

---

## 3. Typography

Fonts are loaded in `src/app/layout.tsx`:

| Role | Variable | Font |
|------|----------|------|
| UI / body | `--font-sans` | Plus Jakarta Sans |
| Headings | `--font-display` | Bricolage Grotesque |
| Meta / codes | `--font-mono` | Space Mono |

### Type scale (fluid)

| Token | Typical use |
|-------|-------------|
| `--text-sm` | Nav, captions, chat lines |
| `--text-base` | Body, inputs, buttons |
| `--text-lg` | Card titles, section headings |
| `--text-xl` | Sub-page titles |
| `--text-2xl` | Page titles (`Kia ora, Alex`) |
| `--text-hero` | Marketing hero only |

### Heading rules

```tsx
// Page title block (every app page)
<div style={{ marginBottom: "var(--space-6)" }}>
  <span className="meta">Your week</span>
  <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>…</h1>
</div>

// Card section title
<h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>…</h2>
```

- `h1`–`h3` inherit display font from global CSS — don’t override `fontFamily` unless marketing-only.
- **Meta labels:** `<span className="meta">…</span>` — never fake with small sans-serif.
- **Body secondary:** `color: "var(--ink-soft)"`, usually `fontSize: "var(--text-sm)"` in dense UI.

---

## 4. Spacing, radius & elevation

### Spacing scale

Use only these tokens — no magic numbers like `13px` or `28px`.

| Token | Value | Common use |
|-------|-------|------------|
| `--space-1` | 4px | Tight inline gaps |
| `--space-2` | 8px | Icon gaps, pill innards |
| `--space-3` | 12px | List item gaps |
| `--space-4` | 16px | Standard padding, grid gaps |
| `--space-5` | 24px | Card padding, section gaps |
| `--space-6` | 32px | Page section margins |
| `--space-7` | 48px | Large section breaks |
| `--space-8` | 64px | Page bottom padding (mobile tabs) |

**Default card padding** is `--space-5` (set on `Card`). **Default vertical stack** inside a page column: `gap: "var(--space-5)"`.

### Radius

| Token | Use |
|-------|-----|
| `--radius-md` | Inputs, nav items |
| `--radius-lg` | Cards (default) |
| `--radius-pill` | Buttons, pills, avatars |

### Shadows

| Token | Use |
|-------|-----|
| `--shadow-sm` | Default cards |
| `--shadow-md` | Emphasised cards |
| `--shadow-lg` | Interactive card hover |
| `--shadow-coral` | Primary button glow |
| `--shadow-sunny` | Accent button glow |

Don’t combine more than one coloured shadow on the same element.

---

## 5. Component library

**Import from one place:** `@/components/ui`

```tsx
import { Avatar, Button, Card, Field, Pill } from "@/components/ui";
```

Do **not** duplicate button/card styles in page files. Extend via `style` prop only when layout requires it.

### Button

| Variant | When to use |
|---------|-------------|
| `primary` | Main action per screen (amber) |
| `accent` | Secondary positive / “you’re in” state (aqua) |
| `ghost` | Tertiary, cancel, marketing “Log in” |

- Min height **48px** on primary flows (onboarding, join quest).
- Full-width buttons on mobile cards: `style={{ width: "100%" }}`.
- Prefer `<Button>` over raw `<button>` for consistent motion and focus.

### Card

- Default: white surface, `--radius-lg`, `--shadow-sm`.
- `interactive` — use for clickable preview tiles (open quest cards on Home). Adds hover lift.
- **Nested cards:** Allowed on Home open-quest preview (`Card` inside `Card`). Keep nesting to one level.
- Hero quest card uses `padding: 0` + inner sections — follow `QuestHero` in `home/page.tsx`.

### Pill

| Tone | When |
|------|------|
| `neutral` | Default tags |
| `coral` | Time badges (`Saturday`) |
| `sunny` | Step indicators (`Step 1 of 2`) |
| `success` | Spots left, confirmed seat |

### Avatar

- Always pass a **display name** string; initials are derived automatically.
- Consistent sizes: **32** chat, **34** shell, **38** hero party, **64** profile header.
- Overlap party row: `marginLeft: i === 0 ? 0 : -12` + `border: "2px solid var(--surface-raw)"`.

### Field

- Always use for labelled inputs (sign-up, onboarding, survey).
- `multiline` + `rows` for bios; include `hint` for optional fields.
- Labels are bold `--text-sm`; hints are `--ink-faint`.

### DisplayName

Use for any user-specific greeting or avatar label — handles demo vs Clerk:

```tsx
<DisplayName>{(name) => <h1>Kia ora, {name}</h1>}</DisplayName>
```

---

## 6. Layout patterns

### App shell (`(app)` routes)

All authenticated dashboard pages live under `src/app/(app)/` and are wrapped by `AppShell` + providers in `layout.tsx`.

| Breakpoint | Layout |
|------------|--------|
| `≥ 880px` | Left sidebar + scrollable main |
| `< 880px` | Top bar + bottom tab bar (Home, Explore, Chat) |

**Content width:** `.app-content` max **1180px**, centred. Don’t add another max-width wrapper unless a form should be narrower (~480–640px).

### Dashboard grid

```tsx
<div className="dash-grid">
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
    {/* main column */}
  </div>
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
    {/* right rail — collapses below main on mobile */}
  </div>
</div>
```

### Two-up cards

```tsx
<div className="dash-duo">{/* auto-fit min 220px */}</div>
```

### Standalone flows (no shell)

These pages are **centred single-column** on the viewport:

- `/` landing  
- `/sign-in`, `/sign-up`  
- `/onboarding`, `/quiz`  

Pattern:

```tsx
<main style={{
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--space-6) var(--space-5)",
}}>
  <Card style={{ maxWidth: 480, width: "100%" }}>…</Card>
</main>
```

### Marketing vs app

| | Marketing (`/`) | App (`/home`, etc.) |
|--|-----------------|---------------------|
| Motion | Staggered hero (`motion` variants) | Subtle button/card only |
| Density | Airy, storytelling | Information-dense cards |
| Nav | Top header link | Sidebar / tabs |

---

## 7. Navigation & routing

### Path helpers

Use `src/lib/paths.ts` — never hard-code demo group IDs in links.

```tsx
import { groupPath, chatPath, exploreQuestPath } from "@/lib/paths";

<Link href={groupPath()}>…</Link>
<Link href={exploreQuestPath(quest.id)}>…</Link>
```

### Link types

| Pattern | Class / component | Example |
|---------|-------------------|---------|
| Forward nav in dashboard | `className="dash-link"` | `See all →` |
| Primary route | `<Link>` + `<Button>` | Open party chat |
| Gated route (needs profile) | `<ProfileGateLink>` | Full reveal → |
| External | `target="_blank" rel="noopener noreferrer"` | Rare — avoid in v1 |

### Adding a new app nav item

1. Add to `nav` array in `app-shell.tsx`.  
2. Set `tab: true` only if it belongs in the mobile bottom bar (max 3–4).  
3. Add `match` prefixes for related routes (e.g. `/group` lights up Home).

---

## 8. Page recipes

### Standard app page header

```tsx
<div style={{ marginBottom: "var(--space-6)" }}>
  <span className="meta">Section context</span>
  <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-1)" }}>Page title</h1>
  <p style={{ color: "var(--ink-soft)", marginTop: "var(--space-2)", maxWidth: "52ch" }}>
    One sentence of context.
  </p>
</div>
```

`maxWidth: "52ch"` on intros improves readability — use on Explore-style pages.

### Card with header row + link

```tsx
<Card>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
    <h2 style={{ fontSize: "var(--text-lg)" }}>Title</h2>
    <Link href="…" className="dash-link">See all →</Link>
  </div>
  {/* content */}
</Card>
```

### Teaser + detail link (concierge pattern)

Show **2-line clamp** on Home; full content on detail page:

```tsx
<p style={{
  color: "var(--ink-soft)",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}}>{rationale}</p>
```

### Form submit flow

1. Validate on client (required fields).  
2. `fetch` to API route.  
3. Show inline error in `--coral` / ember tone.  
4. `router.push` on success — don’t leave dead ends.

### Loading & empty states

- Route-level: `<Suspense fallback={…}>` with a single line of `--ink-soft` text.  
- Button loading: `disabled={saving}` on the active button; no spinners library yet.  
- Empty lists: one friendly sentence inside the card — don’t show blank cards.

---

## 9. Motion & interaction

Motion uses **Motion** (`motion/react`) in `ui.tsx` and marketing pages.

### Rules

1. **Respect `useReducedMotion()`** — already handled inside `Button` and `Card`. Any new motion must do the same.
2. **App pages:** hover/tap on buttons and `interactive` cards only. No page-enter animations in the dashboard.
3. **Marketing:** staggered children is fine (`container` / `rise` variants on `/`).
4. **Duration:** `--duration-fast` (150ms) for hovers; spring for buttons (`stiffness: 400, damping: 24`).
5. **Global:** `prefers-reduced-motion` media query zeroes animations in CSS — don’t fight it.

---

## 10. Accessibility

- **Focus:** Global `:focus-visible` ring uses `--ring`. Don’t remove outlines.
- **Avatars:** `role="img"` + `aria-label={name}` (built into `Avatar`).
- **Icon-only buttons:** `aria-label` required (see topbar profile link).
- **Decorative icons:** `aria-hidden` on SVGs.
- **Colour contrast:** Body text is `--ink` on `--day` / `--surface`. Don’t put `--ink-faint` on long paragraphs.
- **Touch targets:** Minimum **44×44px** effective tap area on mobile nav and buttons.
- **Safe areas:** Mobile tab bar uses `env(safe-area-inset-bottom)` — account for it in fixed bottom UI.

---

## 11. Frontend code conventions

### File & folder structure

```
src/
  app/
    (app)/          # Shell-wrapped dashboard routes
    onboarding/     # Standalone flows
    api/            # Route handlers only — no UI
  components/
    ui.tsx          # Design system primitives
    app-shell.tsx   # Chrome
    *-gate-link.tsx # Behavioural link wrappers
  context/          # Client state providers (e.g. open quests)
  lib/
    paths.ts        # Route builders
    demo.ts         # Demo mode fixtures
```

### Server vs client

| Need | Use |
|------|-----|
| `useState`, `useEffect`, browser APIs | `"use client"` |
| Data fetch on load, secrets, DB | Server Component or `route.ts` |
| Search params in client page | Wrap in `<Suspense>` (see `explore/page.tsx`) |

### Styling approach

**Current standard:** CSS variables + inline `style` objects.  

When adding styles:

1. Prefer existing tokens over raw values.  
2. Prefer shared classes in `globals.css` for repeated layout (`.dash-grid`, `.meta`, `.app-nav-item`).  
3. Add a new global class only when **3+ pages** share the same layout pattern.  
4. **Do not** add Tailwind, CSS modules, or styled-components without team agreement.

### State management

- **URL state** for shareable context (`?quest=id`).  
- **React context** for cross-page UI state (`OpenQuestsProvider`).  
- **sessionStorage** for demo/onboarding progress (`onboarding-session.ts`) — not for production source of truth.  
- **Server/DB** for real user data when Clerk + Aurora are enabled.

### Demo mode

`NEXT_PUBLIC_DEMO_MODE=1` bypasses auth and uses `src/lib/demo.ts`.  

- UI must still work in demo mode.  
- Use `DisplayName`, `DEMO` checks, and API fallbacks — never assume Clerk or DB.  
- Don’t show “Alex” hard-coded in new components; use `DisplayName` or props.

### API integration from UI

```tsx
const res = await fetch("/api/profile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
if (!res.ok) {
  setError("Plain-language message");
  return;
}
```

- Errors are user-facing, not stack traces.  
- Optimistic UI only when rollback is trivial (open quest join is fine).

---

## 12. PR review checklist

Use this before requesting review:

### UX
- [ ] One clear primary action per screen/card  
- [ ] Copy matches product voice (literal, low pressure, NZ-friendly)  
- [ ] No duplicate links or redundant paths to the same destination  
- [ ] Teaser vs detail: summary on Home, depth on detail page  
- [ ] Mobile: checked at `< 560px` and `~ 390px` width  
- [ ] Bottom tab bar doesn’t cover content (padding already on `.app-content`)

### Visual
- [ ] Only design tokens — no random hex/colours  
- [ ] Components from `@/components/ui` — no one-off buttons  
- [ ] Spacing from `--space-*` scale  
- [ ] Meta labels use `.meta` class  
- [ ] `dash-link` for inline forward links in dashboard  

### Code quality
- [ ] `"use client"` only where needed  
- [ ] Route paths via `src/lib/paths.ts`  
- [ ] No unused imports or dead demo code  
- [ ] `npm run build` passes  
- [ ] New motion respects reduced motion  
- [ ] Forms: labels, focus order, error states  

### Accessibility
- [ ] Interactive elements keyboard-reachable  
- [ ] Images/icons have correct aria attributes  
- [ ] Colour is not the only indicator of state  

---

## 13. Anti-patterns — don’t do this

| Don’t | Do instead |
|-------|------------|
| Second “Full reveal” on the same page | One teaser link in concierge card |
| `style={{ color: "#ffb24a" }}` | `var(--lantern-ink)` or `dash-link` |
| Raw `<button>` styled by hand | `<Button variant="…">` |
| Hard-code `/group/demo` | `groupPath()` |
| Hard-code user name “Alex” | `<DisplayName>` |
| Long concierge rationale on Home | 2-line clamp + detail page |
| New colour for every feature | Existing pill tones + semantic tokens |
| Spinner library for every load | `disabled` + short fallback text |
| CSS framework mid-hackathon | Tokens + `ui.tsx` |
| Business logic in page components | `src/lib/*` or `context/*` |

---

## 14. Extending the system

When you genuinely need something new:

1. **Check** if `Button` / `Card` / `Pill` variants cover it.  
2. **Add** to `ui.tsx` if it will be reused 2+ times.  
3. **Add** tokens to `:root` in `globals.css` if it’s a new semantic colour or spacing step.  
4. **Document** the addition in this file (short bullet under the relevant section).  
5. **Keep** the same API shape: `variant`, `tone`, `style` override, `forwardRef` where relevant.

---

## 15. Quick reference

```tsx
// Imports
import { Avatar, Button, Card, Field, Pill } from "@/components/ui";
import { DisplayName } from "@/components/user-display";
import { groupPath, chatPath, exploreQuestPath } from "@/lib/paths";

// Page stack
<div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

// Secondary text
style={{ color: "var(--ink-soft)", fontSize: "var(--text-sm)" }}

// Inline dashboard link
<Link href="…" className="dash-link">Label →</Link>

// Step badge
<Pill tone="sunny">Step 1 of 2</Pill>
```

---

*Last updated: June 2026 — matches `globals.css` and `ui.tsx` on `main`. Update this doc when tokens or components change.*
