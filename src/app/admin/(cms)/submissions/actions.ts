"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function convertSubmissionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return;

  await prisma.$transaction([
    prisma.sponsor.create({
      data: {
        companyName: submission.companyName,
        contactName: submission.contactName,
        contactEmail: submission.email,
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