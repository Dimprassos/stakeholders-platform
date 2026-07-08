"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/magic-token";
import { LIMITS, isValidVat, normalizeVat, normalizeUrl } from "@/lib/validation";
import { ALLOWED_IMAGE_EXT, saveUploadedImage } from "@/lib/uploads";
import type { OnboardingState } from "./types";

// Logo uploads (dev): stored under public/uploads/logos and served statically.
// SVG is intentionally excluded (script-in-SVG XSS risk when served same-origin).
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_EXT = ALLOWED_IMAGE_EXT;

const OnboardingSchema = z.object({
  legalName: z
    .string()
    .min(1, { message: "Legal name is required." })
    .max(LIMITS.legalName, { message: "Legal name is too long." }),
  billingAddress: z
    .string()
    .min(1, { message: "Billing address is required." })
    .max(LIMITS.billingAddress, { message: "Billing address is too long." }),
  vatNumber: z
    .string()
    .max(LIMITS.vatNumber, { message: "VAT number is too long." })
    .refine(isValidVat, {
      message: "Enter a valid VAT number / ΑΦΜ (e.g. a 9-digit ΑΦΜ or EL123456789).",
    }),
  websiteUrl: z
    .string()
    .max(LIMITS.websiteUrl, { message: "Website URL is too long." })
    .url({ message: "Enter a valid URL (https://...)" })
    .or(z.literal("")),
  logoUrl: z.string().max(LIMITS.websiteUrl).optional(),
  description: z
    .string()
    .max(LIMITS.description, { message: "Description is too long." })
    .optional(),
  isHiddenFromPublic: z.string().optional(),
});

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function toErrors(result: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of result.issues) {
    const name = typeof issue.path[0] === "string" ? issue.path[0] : String(issue.path[0]);
    if (!errors[name]) errors[name] = issue.message;
  }
  return errors;
}

async function getSponsorByToken(token: string) {
  if (!token) return null;
  const sponsor = await prisma.sponsor.findUnique({
    where: { magicToken: token },
    include: { package: true },
  });
  if (!sponsor) return null;
  if (isTokenExpired(sponsor.tokenExpiresAt)) return null;
  return sponsor;
}

export async function acceptAction(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const sponsor = await getSponsorByToken(token);
  if (!sponsor) return;
  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { status: "ACCEPTED" },
  });
  revalidatePath(`/invite/${token}`);
}

export async function declineAction(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const sponsor = await getSponsorByToken(token);
  if (!sponsor) return;
  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { status: "DECLINED", magicToken: null, tokenExpiresAt: null, tokenIssuedAt: null },
  });
  revalidatePath(`/invite/${token}`);
}

export async function submitOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const token = str(formData, "token");
  const sponsor = await getSponsorByToken(token);
  if (!sponsor) {
    return { ok: false, message: "This invite link is invalid or has expired." };
  }
  if (sponsor.status === "DECLINED") {
    return { ok: false, message: "You previously declined this invitation." };
  }

  const raw = {
    legalName: str(formData, "legalName"),
    billingAddress: str(formData, "billingAddress"),
    vatNumber: str(formData, "vatNumber"),
    websiteUrl: str(formData, "websiteUrl"),
    logoUrl: str(formData, "logoUrl"),
    description: str(formData, "description"),
    isHiddenFromPublic: str(formData, "isHiddenFromPublic"),
  };

  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: toErrors(parsed.error),
    };
  }

  const data = parsed.data;

  // An uploaded file wins over a pasted URL; otherwise keep the pasted URL.
  let logoUrl: string | null = data.logoUrl?.trim() || null;
  const logoFile = formData.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: {
          logoFile:
            "Direct logo uploads are not enabled in production yet. Please paste a hosted logo URL.",
        },
      };
    }
    if (!(logoFile.type in ALLOWED_LOGO_EXT)) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: { logoFile: "Logo must be a PNG, JPG or WEBP image." },
      };
    }
    if (logoFile.size > MAX_LOGO_BYTES) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: { logoFile: "Logo must be under 2 MB." },
      };
    }
    logoUrl = await saveUploadedImage(logoFile, "logos", sponsor.id);
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      legalName: data.legalName,
      billingAddress: data.billingAddress,
      vatNumber: data.vatNumber ? normalizeVat(data.vatNumber) : null,
      websiteUrl: normalizeUrl(data.websiteUrl),
      logoUrl,
      description: data.description || null,
      isHiddenFromPublic: data.isHiddenFromPublic === "on",
      status: "DETAILS_SUBMITTED",
      // Invalidate the magic link once details are submitted.
      magicToken: null,
      tokenIssuedAt: null,
      tokenExpiresAt: null,
    },
  });

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
  redirect(`/invite/${token}/success`);
}
