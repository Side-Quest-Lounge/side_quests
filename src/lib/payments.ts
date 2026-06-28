/**
 * Hackathon / demo: skip Stripe and confirm seats via /api/me/confirm-seat.
 * Set NEXT_PUBLIC_PAYMENTS_DISABLED=1 in .env.local (and Vercel env for deploys).
 */
export const PAYMENTS_DISABLED = process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === "1";
