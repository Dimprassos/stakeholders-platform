"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PackageFormState } from "./types";

const PackageSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  tier: z.string().min(1, { message: "Tier is required." }),
  priceEuros: z
    .string()
    .min(1, { message: "Price is required." })
    .regex(/^\d+(\.\d{1,2})?$/, {
      message: "Enter a valid price (e.g. 5000 or 2500.50).",
    }),
  currency: z.string().min(1).default("EUR"),
  benefits: z.string(),
  slotsTotal: z.string().optional(),
  displayOrder: z.string().optional(),
  isActive: z.string().optional(),
});

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function parseBenefits(raw: string): string[] {
  return raw
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

function toErrors(
  result: z.ZodError,
  keyMap: Partial<Record<string, string>>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.issues) {
    const pathKey = issue.path[0];
    const name = typeof pathKey === "string" ? keyMap[pathKey] ?? pathKey : String(pathKey);
    if (!errors[name]) errors[name] = issue.message;
  }
  return errors;
}

export async function createPackageAction(
  _prev: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const raw = {
    name: str(formData, "name"),
    tier: str(formData, "tier"),
    priceEuros: str(formData, "priceEuros"),
    currency: str(formData, "currency"),
    benefits: str(formData, "benefits"),
    slotsTotal: str(formData, "slotsTotal"),
    displayOrder: str(formData, "displayOrder"),
    isActive: str(formData, "isActive"),
  };

  const parsed = PackageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: toErrors(parsed.error, { priceEuros: "priceEuros" }),
    };
  }

  const data = parsed.data;
  try {
    await prisma.package.create({
      data: {
        name: data.name,
        tier: data.tier,
        priceCents: Math.round(parseFloat(data.priceEuros) * 100),
        currency: data.currency,
        benefits: JSON.stringify(parseBenefits(data.benefits)),
        slotsTotal: data.slotsTotal ? parseInt(data.slotsTotal, 10) : null,
        displayOrder: data.displayOrder ? parseInt(data.displayOrder, 10) : 0,
        isActive: data.isActive === "on",
      },
    });
  } catch {
    return { ok: false, message: "Something went wrong while creating the package." };
  }

  revalidatePath("/admin/packages");
  revalidatePath("/packages");
  redirect("/admin/packages");
}

export async function updatePackageAction(
  _prev: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  const id = str(formData, "id");
  if (!id) {
    return { ok: false, message: "Missing package id." };
  }

  const raw = {
    name: str(formData, "name"),
    tier: str(formData, "tier"),
    priceEuros: str(formData, "priceEuros"),
    currency: str(formData, "currency"),
    benefits: str(formData, "benefits"),
    slotsTotal: str(formData, "slotsTotal"),
    displayOrder: str(formData, "displayOrder"),
    isActive: str(formData, "isActive"),
  };

  const parsed = PackageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: toErrors(parsed.error, { priceEuros: "priceEuros" }),
    };
  }

  const data = parsed.data;
  try {
    await prisma.package.update({
      where: { id },
      data: {
        name: data.name,
        tier: data.tier,
        priceCents: Math.round(parseFloat(data.priceEuros) * 100),
        currency: data.currency,
        benefits: JSON.stringify(parseBenefits(data.benefits)),
        slotsTotal: data.slotsTotal ? parseInt(data.slotsTotal, 10) : null,
        displayOrder: data.displayOrder ? parseInt(data.displayOrder, 10) : 0,
        isActive: data.isActive === "on",
      },
    });
  } catch {
    return { ok: false, message: "Something went wrong while updating the package." };
  }

  revalidatePath("/admin/packages");
  revalidatePath("/packages");
  redirect("/admin/packages");
}

export async function deletePackageAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!id) return { ok: false, message: "Missing package id." };

  const sponsorCount = await prisma.sponsor.count({
    where: { packageId: id },
  });

  if (sponsorCount > 0) {
    return {
      ok: false,
      message: `Cannot delete: ${sponsorCount} sponsor(s) are assigned to this package. Reassign them first.`,
    };
  }

  await prisma.package.delete({ where: { id } });

  revalidatePath("/admin/packages");
  revalidatePath("/packages");
  return { ok: true };
}

export async function togglePackageActiveAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!id) return { ok: false, message: "Missing package id." };

  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!pkg) return { ok: false, message: "Package not found." };

  await prisma.package.update({
    where: { id },
    data: { isActive: !pkg.isActive },
  });

  revalidatePath("/admin/packages");
  revalidatePath("/packages");
  return { ok: true };
}