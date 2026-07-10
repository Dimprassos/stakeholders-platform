import "server-only";
import type Stripe from "stripe";
import { getStripe } from "./stripe";
import { prisma } from "./prisma";

// Payment fulfilment (docs/PLAN.md §16 Phase F). A Checkout payment is marked
// PAID from two independent triggers so it's never stuck: the Stripe webhook
// (authoritative, works even if the buyer closes the tab) and the success-page
// reconciliation (immediate, so the portal reflects PAID the instant the buyer
// returns). Both funnel through fulfillCheckoutSession, which is idempotent.

/** Mark the Payment behind a completed Checkout session PAID (idempotent). */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId || session.payment_status !== "paid") return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  // Best-effort receipt URL from the charge behind the payment intent.
  let receiptUrl: string | null = null;
  const stripe = getStripe();
  if (stripe && paymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const charge = intent.latest_charge;
      if (charge && typeof charge !== "string") {
        receiptUrl = charge.receipt_url ?? null;
      }
    } catch {
      // Receipt is a nicety — never fail fulfilment over it.
    }
  }

  // Guard against double-processing: only move a not-yet-paid row.
  await prisma.payment.updateMany({
    where: { id: paymentId, status: { not: "PAID" } },
    data: {
      status: "PAID",
      method: "stripe",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
      receiptUrl,
    },
  });
}

/**
 * Retrieve a Checkout session by id and fulfil it. Called on the success return
 * so the sponsor sees PAID immediately, without waiting for the webhook.
 * `expectedSponsorId` ties the session to the sponsor whose link was used.
 */
export async function reconcileCheckoutSession(
  sessionId: string,
  expectedSponsorId?: string,
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (expectedSponsorId && session.metadata?.sponsorId !== expectedSponsorId) {
      return;
    }
    await fulfillCheckoutSession(session);
  } catch {
    // If Stripe can't be reached, the webhook remains the backstop.
  }
}
