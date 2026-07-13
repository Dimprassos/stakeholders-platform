"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId } from "@/lib/event";
import { can, blockedUrl } from "@/lib/sponsor-lifecycle";

/** The sponsor, in the admin's current event. */
async function ownedSponsor(id: string) {
  if (!id) return null;
  const eventId = await getAdminEventId();
  return prisma.sponsor.findFirst({
    where: { id, eventId },
    select: { id: true, status: true, isPublished: true, isHiddenFromPublic: true },
  });
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const sponsor = await ownedSponsor(id);
  if (!sponsor) return;

  // Same rule as the candidates table: only a CONFIRMED sponsor may be
  // published. Un-publishing is always allowed.
  if (!sponsor.isPublished) {
    const verdict = can(sponsor, "publish");
    if (!verdict.ok) redirect(blockedUrl("/admin/onboarding", verdict.reason));
  }

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
  const sponsor = await ownedSponsor(id);
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
  const sponsor = await ownedSponsor(id);
  if (!sponsor) return;

  const verdict = can(sponsor, "confirm");
  if (!verdict.ok) redirect(blockedUrl("/admin/onboarding", verdict.reason));

  await prisma.sponsor.update({
    where: { id },
    data: { status: "CONFIRMED", isPublished: true },
  });
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  revalidatePath("/sponsors");
}
