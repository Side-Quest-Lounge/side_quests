
## AWS Database used 

**We used Amazon Aurora PostgreSQL Serverless v2.**

Side Quest stores all core product data in **Amazon Aurora PostgreSQL Serverless v2** (engine: Aurora PostgreSQL), accessed from Vercel via the **Amazon RDS Data API** — not a persistent TCP connection pool.

| Detail | Our setup |
|--------|-----------|
| **AWS service** | **Amazon Aurora PostgreSQL Serverless v2** |
| **Not used** | Aurora DSQL, DynamoDB, DocumentDB, ElastiCache, Neptune, or Vercel Postgres |
| **Region** | `ap-southeast-2` (Sydney) |
| **Cluster** | `sidequest` |
| **PostgreSQL database** | `friendmatch` |
| **Extension** | **pgvector** — 1024-dim cosine kNN for profile matching |
| **Access pattern** | RDS Data API + Drizzle ORM (`aws-data-api/pg`) from Next.js API routes |

**What lives in Aurora:** users, profiles (with vector embeddings), venues, events, groups, group_members, party chat messages, post-event surveys, agent traces, and API rate-limit counters.

**Why Aurora PostgreSQL:** Side Quest is relational at its core (events → groups → members → messages → surveys) *and* needs semantic similarity search. Aurora PostgreSQL with pgvector gives us both in one database — SQL for the weekly ritual, vectors for matching strangers into parties of six.

---

## Judge demo login

Set `NEXT_PUBLIC_DEMO_MODE=1` on the deployed app. Judges open **Sign in** and click **Explore demo as guest →** (or **Try demo** on the landing page) — no Clerk account required. They can walk Home, group reveal, party chat, Explore, Quests, and Survey with sample data. Real sign-up still runs the Aurora-backed flow.
