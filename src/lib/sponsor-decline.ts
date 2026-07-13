import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Decline a sponsor and close out everything that was still open on them.
 *
 * Both decline paths call this — the admin setting the status in the CMS, and
 * the sponsor declining from their own invite link — so the two can't drift.
 *
 * Declining revokes the magic token, which is what makes the rest necessary: a
 * pending payment can no longer be paid and a contract out for signature can no
 * longer be signed, because the portal those actions live in is gone. Left
 * alone they linger as reminders the organizer can never action.
 */
export async function declineSponsor(sponsorId: string): Promise<void> {
  await prisma.$transaction([
    prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        status: "DECLINED",
        isPublished: false,
        magicToken: null,
        tokenIssuedAt: null,
        tokenExpiresAt: null,
      },
    }),
    // Void the open payment request. CANCELLED (not deleted) keeps it visible in
    // the sponsor's payment history; PAID ones are left alone — that money came in.
    prisma.payment.updateMany({
      where: { sponsorId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),
    // Pull an unsigned contract back to draft: it is no longer out for signature.
    // SIGNED ones stay signed — that is the audit trail.
    prisma.contract.updateMany({
      where: { sponsorId, status: "SENT" },
      data: { status: "DRAFT" },
    }),
  ]);
}
