import { quizQuestions } from "./quiz";

export type SeedPersona = {
  id: string;
  name: string;
  bio: string;
  isNewcomer: boolean;
  answers: Record<string, number>;
};

type Archetype = {
  nameStem: string;
  bio: string;
  isNewcomer: boolean;
  answers: Record<string, number>;
};

const ARCHETYPES: Archetype[] = [
  {
    nameStem: "Alex",
    bio: "Just landed from Wellington — keen to find a regular crew for weekend adventures.",
    isNewcomer: true,
    answers: { energy: 4, creative: 3, spontaneity: 4, talkativeness: 3, outdoors: 5, food: 3, games: 2, fitness: 4, quiet: 2, newcomer: 5 },
  },
  {
    nameStem: "Priya",
    bio: "Software dev who boulders twice a week and loves a good trivia night.",
    isNewcomer: false,
    answers: { energy: 4, creative: 2, spontaneity: 3, talkativeness: 4, outdoors: 3, food: 3, games: 5, fitness: 5, quiet: 2, newcomer: 3 },
  },
  {
    nameStem: "Jordan",
    bio: "Pottery hobbyist and introvert — small groups over big nights out.",
    isNewcomer: true,
    answers: { energy: 2, creative: 5, spontaneity: 2, talkativeness: 2, outdoors: 2, food: 4, games: 3, fitness: 2, quiet: 5, newcomer: 4 },
  },
  {
    nameStem: "Sam",
    bio: "Food blogger exploring every Ponsonby café. Always up for a cooking class.",
    isNewcomer: false,
    answers: { energy: 4, creative: 4, spontaneity: 4, talkativeness: 4, outdoors: 2, food: 5, games: 2, fitness: 2, quiet: 3, newcomer: 2 },
  },
  {
    nameStem: "Taylor",
    bio: "Trail runner and hiking enthusiast — best chats happen on a bush walk.",
    isNewcomer: true,
    answers: { energy: 5, creative: 2, spontaneity: 5, talkativeness: 3, outdoors: 5, food: 2, games: 1, fitness: 5, quiet: 3, newcomer: 5 },
  },
  {
    nameStem: "Casey",
    bio: "Board game collector and host. Low-key evenings are my love language.",
    isNewcomer: false,
    answers: { energy: 3, creative: 3, spontaneity: 2, talkativeness: 3, outdoors: 1, food: 3, games: 5, fitness: 1, quiet: 4, newcomer: 2 },
  },
  {
    nameStem: "Riley",
    bio: "Working holiday visa — here for six months, want mates before I leave.",
    isNewcomer: true,
    answers: { energy: 5, creative: 3, spontaneity: 5, talkativeness: 5, outdoors: 4, food: 4, games: 3, fitness: 3, quiet: 1, newcomer: 5 },
  },
  {
    nameStem: "Morgan",
    bio: "Architect who sketches on weekends. Creative activities over sport.",
    isNewcomer: false,
    answers: { energy: 3, creative: 5, spontaneity: 3, talkativeness: 3, outdoors: 3, food: 3, games: 2, fitness: 2, quiet: 4, newcomer: 1 },
  },
];

const LAST_NAMES = [
  "Chen", "Patel", "Nguyen", "Williams", "Singh", "Brown", "Kim", "O'Brien",
  "Santos", "Murphy", "Lee", "Ahmed", "Campbell", "Foster", "Reid", "Torres",
  "Clark", "Sharma", "Brooks", "Hayes", "Davis", "Martin", "Liu", "Walker",
  "Young", "King", "Scott", "Green", "Adams", "Baker", "Hall", "Rivera",
  "Cooper", "Ward", "Bell", "Price", "Wood", "Ross", "Kelly", "Bennett",
];

const QUESTION_IDS = quizQuestions.map((q) => q.id);

function jitter(value: number, offset: number): number {
  return Math.min(5, Math.max(1, value + offset));
}

/** 40 Auckland personas with varied quiz answers for pgvector matching demos. */
export function buildSeedPersonas(): SeedPersona[] {
  return Array.from({ length: 40 }, (_, i) => {
    const archetype = ARCHETYPES[i % ARCHETYPES.length];
    const variant = Math.floor(i / ARCHETYPES.length);
    const jitterMap = [-1, 0, 0, 1, 1][variant % 5];

    const answers: Record<string, number> = {};
    for (const id of QUESTION_IDS) {
      answers[id] = jitter(archetype.answers[id] ?? 3, jitterMap);
    }

    return {
      id: `seed_${String(i + 1).padStart(2, "0")}`,
      name: `${archetype.nameStem} ${LAST_NAMES[i]}`,
      bio: archetype.bio,
      isNewcomer: archetype.isNewcomer,
      answers,
    };
  });
}

export const SEED_VENUES = [
  {
    name: "Clip 'N Climb Auckland",
    activityType: "bouldering",
    address: "27 Normanby Rd, Mount Eden, Auckland",
    capacity: 8,
  },
  {
    name: "Studio Pottery Co",
    activityType: "pottery",
    address: "12 Ponsonby Rd, Ponsonby, Auckland",
    capacity: 6,
  },
  {
    name: "Holey Moley Golf",
    activityType: "mini-golf",
    address: "88 Customs St W, Auckland CBD",
    capacity: 8,
  },
  {
    name: "The Trivia Parlour",
    activityType: "trivia",
    address: "45 Vulcan Ln, Auckland CBD",
    capacity: 12,
  },
  {
    name: "Cuisine Collective",
    activityType: "cooking",
    address: "8 Fort St, Auckland CBD",
    capacity: 6,
  },
  {
    name: "Waitākere Ranges Walk",
    activityType: "hiking",
    address: "Scenic Dr, Titirangi, Auckland",
    capacity: 10,
  },
] as const;

/** ISO week label for the current week, e.g. "2026-W26". */
export function currentWeekLabel(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((now.getTime() - jan4.getTime()) / 86400000) + 4;
  const week = Math.ceil(dayOfYear / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
