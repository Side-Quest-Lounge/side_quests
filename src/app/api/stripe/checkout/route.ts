import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateUser } from "@/lib/current-user";
import { enforceRateLimit, internalError, parseBody } from "@/lib/api-helpers";
import { stripeCheckoutSchema } from "@/lib/validators";

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

    const limited = await enforceRateLimit("stripe_checkout", user.id);
    if (limited) return limited;

    const parsed = await parseBody(req, stripeCheckoutSchema);
    if (!parsed.success) return parsed.response;

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const returnPath = parsed.data.groupId ? `/group/${parsed.data.groupId}` : "/finding";

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      success_url: `${origin}${returnPath}?checkout=success`,
      cancel_url: `${origin}${returnPath}?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return internalError("stripe_checkout", err);
  }
}
