import "server-only";
import Stripe from "stripe";

// Stripe client (docs/PLAN.md §16 Phase F — payments). Test mode: set
// STRIPE_SECRET_KEY (sk_test_…) and STRIPE_WEBHOOK_SECRET (whsec_…) in .env.
// When the key is absent every payment path degrades gracefully to a clear
// "not configured" state instead of throwing, so the app still runs.

let cached: Stripe | null | undefined;

/** The Stripe client, or null when STRIPE_SECRET_KEY is not set. */
export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

/** Whether Stripe is configured (a secret key is present). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
