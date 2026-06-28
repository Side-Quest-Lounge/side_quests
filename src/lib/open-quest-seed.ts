/**
 * Curated open quests shown on Explore / Home for all users.
 * Separate from demo auth mode and matched weekly parties.
 */

export type SeedOpenEvent = {
  id: string;
  emoji: string;
  title: string;
  startsAt: string;
  when: string;
  venue: string;
  capacity: number;
  spotsLeft: number;
  going: string[];
  createdBy?: string;
};

export type SeedOpenMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export const seedOpenEvents: SeedOpenEvent[] = [
  {
    id: "oe-bouldering",
    emoji: "🧗",
    title: "Sunday bouldering for beginners",
    startsAt: nextWeekdayAt(0, 14, 0).toISOString(),
    when: "Sun · 2:00pm",
    venue: "Extreme Edge, Glen Eden",
    capacity: 8,
    spotsLeft: 3,
    going: ["Ana R", "Tom H", "Suki M", "Jay P", "Mere W"],
  },
  {
    id: "oe-boardgames",
    emoji: "🎲",
    title: "Board game night",
    startsAt: nextWeekdayAt(3, 19, 0).toISOString(),
    when: "Wed · 7:00pm",
    venue: "Counter Culture, Mount Eden",
    capacity: 10,
    spotsLeft: 5,
    going: ["Priya S", "Noah W", "Hana L"],
  },
  {
    id: "oe-sunrise",
    emoji: "🌅",
    title: "Sunrise hike up Maungawhau",
    startsAt: nextWeekdayAt(6, 6, 15).toISOString(),
    when: "Sat · 6:15am",
    venue: "Mt Eden summit gate",
    capacity: 8,
    spotsLeft: 2,
    going: ["Liam O", "Aroha K", "Ben K", "Zoe L", "Tane R", "Ivy C"],
  },
  {
    id: "oe-pottery",
    emoji: "🏺",
    title: "Drop-in pottery & a wine",
    startsAt: nextWeekdayAt(4, 18, 30).toISOString(),
    when: "Thu · 6:30pm",
    venue: "Studio One Toi Tū, Ponsonby",
    capacity: 12,
    spotsLeft: 4,
    going: ["Maia T", "Kahu P"],
  },
];

export const seedOpenQuestMessages: Record<string, SeedOpenMessage[]> = {
  "oe-bouldering": [
    {
      id: "ob1",
      author: "agent",
      body: "Welcome to Sunday bouldering! Meet at the front desk at Extreme Edge. Chalk is provided — just bring comfy shoes.",
      createdAt: minutesAgo(120),
    },
    { id: "ob2", author: "Ana R", body: "First time bouldering — any tips?", createdAt: minutesAgo(95) },
  ],
  "oe-boardgames": [
    {
      id: "og1",
      author: "agent",
      body: "Board game night at Counter Culture! We've reserved the back table.",
      createdAt: minutesAgo(200),
    },
    { id: "og2", author: "Priya S", body: "Bringing Codenames if anyone's keen 🎲", createdAt: minutesAgo(180) },
  ],
  "oe-sunrise": [
    {
      id: "os1",
      author: "agent",
      body: "Sunrise hike crew — gate opens 6:10am. Layer up; it's brisk before dawn.",
      createdAt: minutesAgo(60),
    },
  ],
  "oe-pottery": [
    {
      id: "op1",
      author: "agent",
      body: "Pottery & wine night — aprons on arrival. Studio One Toi Tū, upstairs studio.",
      createdAt: minutesAgo(300),
    },
  ],
};

function nextWeekdayAt(weekday: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  const day = d.getDay();
  let delta = (weekday - day + 7) % 7;
  if (delta === 0) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}
