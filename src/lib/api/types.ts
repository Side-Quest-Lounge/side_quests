/** Shared API response shapes for client hooks. */
export type MeUser = {
  name: string;
  bio: string | null;
  isNewcomer: boolean;
};

export type MeProfile = {
  answers: Record<string, number | string>;
};

export type MeProfileResponse = {
  user: MeUser;
  profile: MeProfile | null;
};

export type MeGroupMember = {
  userId: string;
  name: string;
  bio: string | null;
  matchScore: number;
  isYou: boolean;
};

export type MeGroup = {
  id: string;
  status: string;
  rationale: string;
  icebreakers: string[];
  venue: { id: string; name: string; activityType: string; address: string } | null;
  startsAt: string | null;
  subscriptionStatus: string;
  members: MeGroupMember[];
};

export type MeGroupResponse = {
  group: MeGroup | null;
};

export type PastQuest = {
  id: string;
  emoji: string;
  title: string;
  date: string;
  vibeScore: number | null;
};

export type MeQuestsResponse = {
  past: PastQuest[];
};

export type ChatMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};
