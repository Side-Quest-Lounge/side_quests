// Demo mode: render the whole app with mock data, no Clerk auth and no database.
// Toggle with NEXT_PUBLIC_DEMO_MODE=1 (set in .env.local). Safe to import on client.
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export const DEMO_GROUP_ID = "demo";

export type DemoMember = {
  userId: string;
  name: string;
  bio: string | null;
  matchScore: number;
  isYou: boolean;
};

export type DemoGroup = {
  id: string;
  status: string;
  rationale: string;
  icebreakers: string[];
  venue: { name: string; activityType: string; address: string } | null;
  startsAt: string | null;
  subscriptionStatus: string;
  members: DemoMember[];
};

export const demoGroup: DemoGroup = {
  id: DEMO_GROUP_ID,
  status: "matched",
  rationale:
    "You all moved to Auckland in the last year and listed the outdoors and good coffee near the top of your list. Three of you are keen on an easy weekend pace, and nobody wanted anything that feels like networking — so we kept it small and low-key.",
  icebreakers: [
    "What's the best thing you've eaten in Auckland so far?",
    "Beach day or bush walk — which side are you on?",
    "What made you pick Tāmaki Makaurau?",
  ],
  venue: {
    name: "Coffee & a coastal walk",
    activityType: "Easy outdoors",
    address: "Mission Bay · meet by the fountain",
  },
  startsAt: nextSaturdayAt10().toISOString(),
  subscriptionStatus: "trial",
  members: [
    { userId: "u-you", name: "You", bio: "Just moved from Wellington", matchScore: 1, isYou: true },
    { userId: "u-maia", name: "Maia T", bio: "Designer, keen tramper", matchScore: 0.92, isYou: false },
    { userId: "u-liam", name: "Liam O", bio: "New from Dublin, loves a flat white", matchScore: 0.88, isYou: false },
    { userId: "u-priya", name: "Priya S", bio: "Data scientist, board-game nerd", matchScore: 0.85, isYou: false },
    { userId: "u-noah", name: "Noah W", bio: "Back home after 5 yrs in Berlin", matchScore: 0.81, isYou: false },
  ],
};

export type DemoMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export const demoMessages: DemoMessage[] = [
  {
    id: "m1",
    author: "agent",
    body: "Kia ora, you five! I'm your Side Quest concierge. You're on for coffee and a coastal walk at Mission Bay this Saturday at 10am. Reply here to sort out who's bringing the dog 🐕",
    createdAt: minutesAgo(48),
  },
  { id: "m2", author: "Maia T", body: "So keen! I'll be the one in the yellow raincoat ☔", createdAt: minutesAgo(40) },
  { id: "m3", author: "Liam O", body: "Count me in. Is there parking near the fountain?", createdAt: minutesAgo(33) },
  {
    id: "m4",
    author: "agent",
    body: "Plenty along Tamaki Drive, and the 769 bus stops right there. I'll send a pin Saturday morning.",
    createdAt: minutesAgo(31),
  },
  { id: "m5", author: "you", body: "Perfect — see you all there!", createdAt: minutesAgo(12) },
];

export const demoAdminGroups = [
  {
    id: "demo",
    status: "matched",
    rationale: demoGroup.rationale,
    members: demoGroup.members.map((m) => ({ userId: m.userId, name: m.name, matchScore: m.matchScore })),
  },
  {
    id: "grp-7c2a91",
    status: "matched",
    rationale: "Three returners and two newcomers who all skew creative — film, music, ceramics. Paired around a gallery-hop in Karangahape Road.",
    members: [
      { userId: "u-ana", name: "Ana R", matchScore: 0.9 },
      { userId: "u-tom", name: "Tom H", matchScore: 0.87 },
      { userId: "u-suki", name: "Suki M", matchScore: 0.83 },
      { userId: "u-jay", name: "Jay P", matchScore: 0.79 },
    ],
  },
  {
    id: "grp-44de10",
    status: "pending",
    rationale: "",
    members: [
      { userId: "u-ben", name: "Ben K", matchScore: 0.0 },
      { userId: "u-zoe", name: "Zoe L", matchScore: 0.0 },
    ],
  },
];

export const demoTraces = [
  { id: "t1", userId: "user_2nQ8xL", tool: "embed_survey", args: { len: 412 }, result: { dims: 1024 }, at: minutesAgo(62) },
  { id: "t2", userId: "user_2nQ8xL", tool: "knn_match", args: { k: 5, radius: 8000 }, result: { groupId: "demo", size: 5 }, at: minutesAgo(60) },
  { id: "t3", userId: null, tool: "compose_reveal", args: { groupId: "demo" }, result: { icebreakers: 3 }, at: minutesAgo(59) },
  { id: "t4", userId: null, tool: "pick_venue", args: { activityType: "outdoors" }, result: { name: "Mission Bay" }, at: minutesAgo(58) },
  { id: "t5", userId: "user_5kP2wM", tool: "host_intro", args: { groupId: "demo" }, result: { posted: true }, at: minutesAgo(48) },
];

export const demoUser = {
  name: "Alex",
  blurb: "New to Auckland · moved from Wellington",
  joinedAt: "Joined June 2026",
};

export type DemoOpenEvent = {
  id: string;
  emoji: string;
  title: string;
  when: string;
  venue: string;
  spotsLeft: number;
  going: string[];
};

export const demoOpenEvents: DemoOpenEvent[] = [
  {
    id: "oe-bouldering",
    emoji: "🧗",
    title: "Sunday bouldering for beginners",
    when: "Sun · 2:00pm",
    venue: "Extreme Edge, Glen Eden",
    spotsLeft: 3,
    going: ["Ana R", "Tom H", "Suki M", "Jay P", "Mere W"],
  },
  {
    id: "oe-boardgames",
    emoji: "🎲",
    title: "Board game night",
    when: "Wed · 7:00pm",
    venue: "Counter Culture, Mount Eden",
    spotsLeft: 5,
    going: ["Priya S", "Noah W", "Hana L"],
  },
  {
    id: "oe-sunrise",
    emoji: "🌅",
    title: "Sunrise hike up Maungawhau",
    when: "Sat · 6:15am",
    venue: "Mt Eden summit gate",
    spotsLeft: 2,
    going: ["Liam O", "Aroha K", "Ben K", "Zoe L", "Tane R", "Ivy C"],
  },
  {
    id: "oe-pottery",
    emoji: "🏺",
    title: "Drop-in pottery & a wine",
    when: "Thu · 6:30pm",
    venue: "Studio One Toi Tū, Ponsonby",
    spotsLeft: 4,
    going: ["Maia T", "Kahu P"],
  },
];

export type DemoPastQuest = {
  id: string;
  emoji: string;
  title: string;
  date: string;
  vibeScore: number;
};

export const demoPastQuests: DemoPastQuest[] = [
  { id: "pq-1", emoji: "🍜", title: "Ramen crawl, Dominion Rd", date: "Sat 7 Jun", vibeScore: 5 },
  { id: "pq-2", emoji: "🏖️", title: "Frisbee at Pt Chevalier", date: "Sat 31 May", vibeScore: 4 },
  { id: "pq-3", emoji: "☕", title: "Coffee & comics, K Road", date: "Sat 24 May", vibeScore: 5 },
];

export const demoEventWeek = nextSaturdayAt10().toISOString().slice(0, 10);

function nextSaturdayAt10(): Date {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + ((6 - day + 7) % 7 || 7));
  return d;
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}
