"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function togglePublishAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    select: { isPublished: true },
  });
  if (!sponsor) return;
  await prisma.sponsor.update({
    where: { id },
    data: { isPublished: !sponsor.isPublished },
  });
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}

export async function toggleHiddenAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    select: { isHiddenFromPublic: true },
  });
  if (!sponsor) return;
  await prisma.sponsor.update({
    where: { id },
    data: { isHiddenFromPublic: !sponsor.isHiddenFromPublic },
  });
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}

export async function confirmSponsorAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.sponsor.update({
    where: { id },
    data: { status: "CONFIRMED", isPublished: true },
  });
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}