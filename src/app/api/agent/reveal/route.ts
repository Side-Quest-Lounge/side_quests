import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, isGroupMember } from "@/lib/current-user";
import { generateReveal } from "@/lib/agent";
import { enforceRateLimit, internalError, parseBody } from "@/lib/api-helpers";
import { groupIdBodySchema } from "@/lib/validators";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const parsed = await parseBody(req, groupIdBodySchema);
    if (!parsed.success) return parsed.response;

    const { groupId } = parsed.data;

    if (!(await isGroupMember(user.id, groupId))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const limited = await enforceRateLimit("reveal", user.id, groupId);
    if (limited) return limited;

    const result = await generateReveal(groupId);
    return NextResponse.json({
      rationale: result.rationale,
      icebreakers: result.icebreakers,
      venue: result.venue,
      startsAt: result.startsAt.toISOString(),
    });
  } catch (err) {
    return internalError("reveal", err);
  }
}
