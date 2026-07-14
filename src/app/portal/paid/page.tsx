import { redirect } from "next/navigation";
import { getCurrentSponsor } from "@/lib/sponsor-auth";
import { reconcileCheckoutSession } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Stripe returns the sponsor here after a successful Checkout (docs/PLAN.md §16
// Phase F). Cookie-authenticated (QA P0-2): the sponsor is identified by their
// session, not a URL token. We confirm the payment straight from Stripe and mark
// it PAID, then send them back to the portal — so it shows "Paid ✓" immediately
// instead of re-offering "Pay now" while waiting on the webhook. The webhook
// remains the authoritative backstop and is independent of this page.
export default async function PortalPaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const sponsor = await getCurrentSponsor();
  if (!sponsor) redirect("/sponsor/login");

  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : null;

  if (sessionId) {
    await reconcileCheckoutSession(sessionId, sponsor.id);
  }

  redirect("/portal?paid=1");
}
