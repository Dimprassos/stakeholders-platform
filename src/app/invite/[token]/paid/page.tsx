import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/magic-token";
import { reconcileCheckoutSession } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Stripe returns the sponsor here after a successful Checkout (docs/PLAN.md §16
// Phase F). We confirm the payment straight from Stripe and mark it PAID, then
// send them back to the portal — so it shows "Paid ✓" immediately instead of
// re-offering "Pay now" while waiting on the webhook.
export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { token } = await params;
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : null;

  const sponsor = await prisma.sponsor.findUnique({
    where: { magicToken: token },
    select: { id: true, tokenExpiresAt: true },
  });

  if (sponsor && !isTokenExpired(sponsor.tokenExpiresAt) && sessionId) {
    await reconcileCheckoutSession(sessionId, sponsor.id);
  }

  redirect(`/invite/${token}?paid=1`);
}
