"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  findSponsorsByContactEmail,
  normalizeContactEmail,
} from "@/lib/sponsor-identity";

export async function convertSubmissionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return;

  const contactEmail = normalizeContactEmail(submission.email);
  if (contactEmail) {
    const [duplicate] = await findSponsorsByContactEmail(submission.eventId, contactEmail);
    if (duplicate) redirect(`/admin/candidates/${duplicate.id}?duplicate=1`);
  }

  await prisma.$transaction([
    prisma.sponsor.create({
      data: {
        eventId: submission.eventId,
        companyName: submission.companyName,
        contactName: submission.contactName,
        contactEmail,
        packageId: submission.packageInterestId,
        status: "LEAD",
      },
    }),
    prisma.submission.update({
      where: { id },
      data: { status: "CONVERTED" },
    }),
  ]);

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
}

export async function markSubmissionReviewedAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.submission.update({ where: { id }, data: { status: "REVIEWED" } });
  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
}
