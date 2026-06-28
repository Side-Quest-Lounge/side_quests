# Hackathon submission playbook

Side Quest — [Building Agents for Real-World Challenges](https://xprize.devpost.com/)  
**Track:** Open innovation (Track 4) — B2C weekly ritual with AI concierge  
**Stack:** Aurora PostgreSQL Serverless v2 + pgvector · Vercel · Clerk · Bedrock Titan

Use this doc to finish Devpost, record the demo video, and smoke-test production before submit.

---

## Devpost checklist

| # | Required | Status | Notes |
|---|----------|--------|-------|
| 1 | Text description (mention AWS DB) | ☑ | [`DEVPOST_DESCRIPTION.md`](./DEVPOST_DESCRIPTION.md) |
| 1b | Inspiration / What it does / How we built / etc. | ☑ | [`DEVPOST_STORY.md`](./DEVPOST_STORY.md) |
| 2 | Demo video (< 3 min, YouTube) | ☐ | Script below |
| 3 | Published Vercel URL | ☐ | Deploy + env vars first |
| 4 | Vercel Team ID | ☐ | Vercel → Settings → General |
| 5 | Architecture diagram | ☑ | [`architecture-diagram.md`](./architecture-diagram.md) — export PNG for Devpost |
| 6 | AWS DB screenshot | ☐ | Aurora console: cluster + Data API enabled |

---

## Devpost text description

Full and short copy for the Devpost **Description** field: **[DEVPOST_DESCRIPTION.md](./DEVPOST_DESCRIPTION.md)**

Inspiration, What it does, How we built it, Challenges, etc.: **[DEVPOST_STORY.md](./DEVPOST_STORY.md)**

---

## Demo video script (~2:30)

Record **1080p screen + voiceover**. Show the **live Vercel URL** (not localhost).

| Time | Scene | Say / show |
|------|-------|------------|
| 0:00–0:20 | Landing | Problem: moving cities is lonely; apps optimize swipes not showing up IRL. Side Quest = one quest per week, small party, concierge handles the awkward parts. |
| 0:20–0:45 | Sign up → onboarding → quiz | Quick profile + vibe quiz. Mention answers become a **Bedrock embedding** in **Aurora pgvector**. |
| 0:45–1:05 | Finding → match | `/finding` → Find my party. Mention **pgvector kNN** + group formation in Aurora. |
| 1:05–1:30 | Group reveal | Party names, concierge rationale, venue. **Confirm seat** (payments off for demo — instant unlock). |
| 1:30–1:50 | Home + chat | Home quest card, party avatars, **Open party chat**. Concierge welcome + icebreakers; send a hello. |
| 1:50–2:10 | Explore | Join an **open quest**, party chat for ad-hoc events. |
| 2:10–2:30 | Architecture | Flash [`architecture-diagram.md`](./architecture-diagram.md) or AWS console screenshot. "Aurora + Data API + pgvector on AWS; Next.js on Vercel." |

**Tips:** Use a **fresh Clerk account** or pre-seeded user with a matched group. Run `npm run chat:reseed` if chat looks empty. Hide browser bookmarks bar; use light mode if it reads better on video.

---

## Pre-record smoke test (production)

Run on your **Vercel URL** with production env vars set.

```bash
# From your machine (replace URL)
curl -s https://YOUR_APP.vercel.app/api/health | jq
```

Expected: `{ "ok": true, "configured": { "aurora": true, "clerk": true, ... } }`.

### Golden path

- [ ] Sign up / sign in (Clerk)
- [ ] Onboarding + quiz completes (embedding saved — check `npm run inspect:db` if unsure)
- [ ] `/finding` → match succeeds (need ≥6 embedded profiles — run `npm run seed:local` if Bedrock throttled)
- [ ] `/group/[id]` → confirm seat unlocks (with `NEXT_PUBLIC_PAYMENTS_DISABLED=1`)
- [ ] `/home` → quest card, real date pill, party avatars
- [ ] `/chat/[id]` → concierge welcome + send message
- [ ] `/explore` → join open quest → open quest chat
- [ ] `/admin/agents` (optional) — show agent traces for judges

### Known gotchas

| Issue | Fix |
|-------|-----|
| Match fails "not enough candidates" | `npx dotenv -e .env.local -- npm run seed:local` |
| Bedrock throttled on quiz save | Set `ALLOW_DETERMINISTIC_EMBEDDINGS=1` on Vercel |
| Chat duplicates / empty | `npm run chat:reseed` |
| Clerk redirect loop | Check `NEXT_PUBLIC_CLERK_*_URL` match production domain |
| No group after match | `npm run demo:match -- YOUR_CLERK_USER_ID` then refresh |

---

## Vercel production env vars

Copy from `.env.local`. Minimum for live demo:

| Variable | Required |
|----------|----------|
| `AWS_REGION`, `AURORA_*`, `AWS_ACCESS_KEY_*` | Yes |
| `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY` | Yes |
| `NEXT_PUBLIC_PAYMENTS_DISABLED=1` | Yes (hackathon demo) |
| `NEXT_PUBLIC_DEMO_MODE=1` | Yes (guest demo for judges) |
| `ALLOW_DETERMINISTIC_EMBEDDINGS=1` | Recommended if Bedrock RPM limited |
| `STRIPE_*` | Optional while payments disabled |

### Judge demo login (no account required)

Set `NEXT_PUBLIC_DEMO_MODE=1` on Vercel, then:

1. Open the live URL → **Sign in** or **Try demo** on the landing page
2. Click **Explore demo as guest →**
3. Walk **Home → Group → Chat → Explore → Quests → Survey**

Real Clerk sign-up still works for the full Aurora-backed flow.

**Region:** Set Vercel functions to **Sydney (syd1)** if Aurora is in `ap-southeast-2`.

---

## AWS screenshot (submission proof)

Capture **one** of:

1. RDS → your cluster → **Configuration** tab showing **Data API enabled**
2. RDS Query Editor running `SELECT count(*) FROM profiles WHERE embedding IS NOT NULL;`
3. `npm run check:aws` terminal output showing Aurora + pgvector passes

Save as `docs/submission/aws-aurora-screenshot.png` (add to repo or attach only on Devpost).

---

## Architecture diagram for Devpost

Source: [`architecture-diagram.md`](./architecture-diagram.md)

Export options:

- Screenshot the Mermaid/diagram section from GitHub preview
- Paste ASCII into Figma/Excalidraw and export PNG
- Use [mermaid.live](https://mermaid.live) if you convert to Mermaid

---

## Code / deploy status (as of prep)

| Item | Status |
|------|--------|
| Unit tests (`npm test`) | 23 passing |
| Production build (`npm run build`) | Passing |
| Aurora + pgvector (`npm run check:aws`) | 7/8 pass (Bedrock rate limit warning) |
| Embeddings hardening branch | Pushed to `cursor/embeddings-api-hardening-and-ops-scripts` |
| UI/demo/open-quest work | **Local only — not committed** |

### Before submit — deploy latest

1. Commit remaining app changes (home, chat, explore, payments bypass, etc.)
2. Merge to `main` or deploy feature branch on Vercel
3. Confirm production env includes `NEXT_PUBLIC_PAYMENTS_DISABLED=1`
4. Re-run golden path on live URL
5. Record video
6. Upload to Devpost

---

## Vercel Team ID

1. [vercel.com](https://vercel.com) → your team → **Settings → General**
2. Copy **Team ID** (starts with `team_`)
3. Paste into Devpost

---

## File index for judges

| Doc | Purpose |
|-----|---------|
| [`README.md`](../README.md) | Setup + golden path |
| [`MAINTAINER.md`](./MAINTAINER.md) | Engineer onboarding |
| [`architecture-diagram.md`](./architecture-diagram.md) | System design (submission artifact) |
| [`v2-social-scope.md`](./v2-social-scope.md) | Post-hackathon scope boundaries |
| This file | Submission checklist + demo script |
