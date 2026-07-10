"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId, getEventSettings } from "@/lib/event";
import { sendMail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import { isTokenExpired } from "@/lib/magic-token";

// Admin payment actions (docs/PLAN.md §16 Phase F). The admin raises payment
// requests against a sponsor; the sponsor is emailed a link and pays via Stripe
// from their portal, or the admin settles manually for offline payments. All
// scoped to the current event.

/** Confirm a payment belongs to a sponsor in the admin's current event. */
async function ownedPayment(paymentId: string) {
  if (!paymentId) return null;
  const eventId = await getAdminEventId();
  return prisma.payment.findFirst({
    where: { id: paymentId, eventId },
    select: { id: true, sponsorId: true, status: true },
  });
}

export async function createPaymentAction(formData: FormData): Promise<void> {
  const sponsorId = String(formData.get("sponsorId") ?? "");
  const amount = Number(String(formData.get("amount") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const currency = (String(formData.get("currency") ?? "EUR").trim() || "EUR").toUpperCase();

  if (!sponsorId) return;
  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      magicToken: true,
      tokenExpiresAt: true,
      package: { select: { name: true } },
    },
  });
  if (!sponsor) return;
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(`/admin/candidates/${sponsorId}?payerr=amount`);
  }

  const existingPending = await prisma.payment.findFirst({
    where: { eventId, sponsorId, status: "PENDING" },
    select: { id: true },
  });
  if (existingPending) {
    redirect(`/admin/candidates/${sponsorId}?payerr=pending`);
  }

  const amountCents = Math.round(amount * 100);
  await prisma.payment.create({
    data: {
      eventId,
      sponsorId,
      amountCents,
      currency,
      description: description || null,
      status: "PENDING",
    },
  });

  // Notify the sponsor by email with a link to pay from their portal. Only
  // possible if they have a contact email and a live portal link.
  const canEmail =
    !!sponsor.contactEmail &&
    !!sponsor.magicToken &&
    !isTokenExpired(sponsor.tokenExpiresAt);
  let previewParam = "";
  if (canEmail) {
    const { name: event } = await getEventSettings();
    const link = `${SITE_URL}/invite/${sponsor.magicToken}`;
    const amountLabel = formatPrice(amountCents, currency);
    const subject = `Payment request — ${event}`;
    const text =
      `Hi ${sponsor.contactName ?? "there"},\n\n` +
      `${event} has requested a payment of ${amountLabel} for your sponsorship` +
      `${sponsor.package ? ` (${sponsor.package.name})` : ""}` +
      `${description ? ` — ${description}` : ""}.\n\n` +
      `You can pay securely from your sponsor portal:\n${link}\n\n` +
      `Thank you,\n${event}`;

    let previewUrl: string | undefined;
    try {
      const result = await sendMail({ to: sponsor.contactEmail!, subject, text });
      previewUrl = result.previewUrl;
    } catch {
      revalidatePath(`/admin/candidates/${sponsorId}`);
      redirect(`/admin/candidates/${sponsorId}?paySent=fail`);
    }
    await prisma.outreach.create({
      data: {
        eventId,
        sponsorId,
        prospectEmail: sponsor.contactEmail,
        subject,
        body: text,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    if (previewUrl) previewParam = `&preview=${encodeURIComponent(previewUrl)}`;
  }

  revalidatePath(`/admin/candidates/${sponsorId}`);
  revalidatePath("/admin/analytics");
  redirect(
    `/admin/candidates/${sponsorId}?paySent=${canEmail ? "1" : "noemail"}${previewParam}`,
  );
}

/** Mark a payment settled offline (bank transfer, cash, etc.). */
export async function markPaymentPaidAction(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await ownedPayment(paymentId);
  if (!payment || payment.status === "PAID") return;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PAID", method: "manual", paidAt: new Date() },
  });
  revalidatePath(`/admin/candidates/${payment.sponsorId}`);
  revalidatePath("/admin/analytics");
}

export async function cancelPaymentAction(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await ownedPayment(paymentId);
  if (!payment || payment.status === "PAID") return;
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/admin/candidates/${payment.sponsorId}`);
  revalidatePath("/admin/analytics");
}

export async function deletePaymentAction(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await ownedPayment(paymentId);
  // Keep paid records for the audit trail; only unpaid ones can be removed.
  if (!payment || payment.status === "PAID") return;
  await prisma.payment.delete({ where: { id: payment.id } });
  revalidatePath(`/admin/candidates/${payment.sponsorId}`);
  revalidatePath("/admin/analytics");
}
