"use server";

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/magic-token";
import type { OnboardingState } from "./types";

// Logo uploads (dev): stored under public/uploads/logos and served statically.
// SVG is intentionally excluded (script-in-SVG XSS risk when served same-origin).
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

async function saveLogoFile(file: File, sponsorId: string): Promise<string> {
  const ext = ALLOWED_LOGO_EXT[file.type];
  const dir = path.join(process.cwd(), "public", "uploads", "logos");
  await mkdir(dir, { recursive: true });
  const safeId = sponsorId.replace(/[^a-zA-Z0-9_-]/g, "") || "logo";
  const filename = `${safeId}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/logos/${filename}`;
}

const OnboardingSchema = z.object({
  legalName: z.string().min(1, { message: "Legal name is required." }),
  billingAddress: z.string().min(1, { message: "Billing address is required." }),
  vatNumber: z.string().optional(),
  websiteUrl: z
    .string()
    .url({ message: "Enter a valid URL (https://...)" })
    .or(z.literal("")),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
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

function safeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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
    logoUrl = await saveLogoFile(logoFile, sponsor.id);
  }

  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      legalName: data.legalName,
      billingAddress: data.billingAddress,
      vatNumber: data.vatNumber || null,
      websiteUrl: safeUrl(data.websiteUrl),
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
