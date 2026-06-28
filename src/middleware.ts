/**
 * Clerk auth gate. Skipped entirely when NEXT_PUBLIC_DEMO_MODE=1.
 * Public: landing, sign-in/up, Stripe webhook (Clerk cannot auth webhooks).
 */
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { DEMO } from "@/lib/demo";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/stripe/webhook",
]);

export default DEMO
  ? () => NextResponse.next()
  : clerkMiddleware(async (auth, req) => {
      if (!isPublic(req)) await auth.protect();
    });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
