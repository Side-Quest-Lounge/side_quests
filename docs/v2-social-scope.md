# V2 Social Scope (post-hackathon)

Side Quest V1 is a **weekly ritual**: match → quest → party chat → survey.  
Full social networking is **out of scope** for the hackathon and deferred to V2+.

## V1 (what we ship)

- One **party-scoped chat** per matched group (polling, not WebSockets)
- **Concierge agent** for welcome messages and icebreakers
- **Profile gate** sends incomplete users through onboarding before Full reveal
- **Edit profile** at `/profile`; vibe quiz retake is explicit opt-in only

## V2 tiers (build only if users ask)

### Tier A — high signal, low scope

- Mutual **"hang again"** after survey → concierge nudges same open quest
- **Past party roster** on Quests (names from completed groups)
- **Read-only chat archive** for past groups

### Tier B — medium scope

- Opt-in **contact share** (e.g. IG handle) after mutual consent
- Concierge **intro** between people from different parties who liked the same open quest

### Tier C — full social (only if retention data demands)

- Friend graph + friend requests
- 1:1 DMs and multi-inbox messenger
- Friends-of-friends discovery feed

## Decision checklist

Before any social feature:

1. Does it help someone **show up to this week's quest**?
2. Does it work **without** replacing phone/IG exchange?
3. Can we ship it in **< 1 week** without moderation/legal surface?
4. Would a judge understand it in **one sentence**?

If any answer is no → defer.

## Product principle

The core job is not "become a social network." It is:

> Get 4–5 compatible strangers to show up to one low-pressure activity, once a week.

Success = good time IRL + exchanging contact offline + coming back next week.
