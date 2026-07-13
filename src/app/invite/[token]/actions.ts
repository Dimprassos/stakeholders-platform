"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isTokenExpired, portalExpiry } from "@/lib/magic-token";
import { declineSponsor } from "@/lib/sponsor-decline";
import { getStripe } from "@/lib/stripe";
import { createSponsorSession } from "@/lib/sponsor-auth";
import {
  findSponsorsByContactEmail,
  isSponsorAccountStatus,
  normalizeContactEmail,
} from "@/lib/sponsor-identity";
import { SITE_URL } from "@/lib/site";
import { LIMITS, isValidVat, normalizeVat, normalizeUrl } from "@/lib/validation";
import { ALLOWED_IMAGE_EXT, saveUploadedImage } from "@/lib/uploads";
import type { OnboardingState, OnboardingValues } from "./types";

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
      message: "Use 6-20 letters/numbers, e.g. 123456789 or EL123456789.",
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
    // From acceptance on, the link is the sponsor's ongoing portal — give it a
    // long window so they keep access to status, materials and payments.
    data: { status: "ACCEPTED", tokenExpiresAt: portalExpiry() },
  });
  revalidatePath(`/invite/${token}`);
}

export async function declineAction(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const sponsor = await getSponsorByToken(token);
  if (!sponsor) return;
  await declineSponsor(sponsor.id);
  revalidatePath(`/invite/${token}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
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
  const values: OnboardingValues = {
    legalName: raw.legalName,
    billingAddress: raw.billingAddress,
    vatNumber: raw.vatNumber,
    websiteUrl: raw.websiteUrl,
    logoUrl: raw.logoUrl,
    description: raw.description,
    isHiddenFromPublic: raw.isHiddenFromPublic === "on",
  };

  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: toErrors(parsed.error),
      values,
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
        values,
      };
    }
    if (!(logoFile.type in ALLOWED_LOGO_EXT)) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: { logoFile: "Logo must be a PNG, JPG or WEBP image." },
        values,
      };
    }
    if (logoFile.size > MAX_LOGO_BYTES) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: { logoFile: "Logo must be under 2 MB." },
        values,
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
      // Advance ACCEPTED → DETAILS_SUBMITTED on first submit, but never regress a
      // sponsor who is already further along (e.g. CONFIRMED) when they edit.
      status: sponsor.status === "ACCEPTED" ? "DETAILS_SUBMITTED" : sponsor.status,
      // Keep the magic link alive as the sponsor's ongoing portal (Phase E/F):
      // they return here to update materials and pay. Extend its expiry.
      tokenExpiresAt: portalExpiry(),
    },
  });

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");

  // Return the sponsor to their portal (magic-link or account) with a success
  // banner — never a dead-end "thank you" page that only links back to the site.
  const back = safeReturn(str(formData, "returnTo"), token);
  revalidatePath(back);
  redirect(`${back}?saved=1`);
}

/**
 * Start a Stripe Checkout session for a pending payment (docs/PLAN.md §16 Phase F).
 * Called from the sponsor's portal "Pay now" button; redirects to Stripe's hosted
 * checkout. On completion Stripe returns the sponsor here and the webhook marks
 * the Payment PAID.
 */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const paymentId = str(formData, "paymentId");
  const sponsor = await getSponsorByToken(token);
  if (!sponsor) redirect(`/invite/${token}`);

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, sponsorId: sponsor.id, status: "PENDING" },
  });
  if (!payment) redirect(`/invite/${token}`);

  const stripe = getStripe();
  if (!stripe) redirect(`/invite/${token}?payerror=config`);

  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: payment.currency.toLowerCase(),
            unit_amount: payment.amountCents,
            product_data: {
              name:
                payment.description ||
                `Sponsorship payment — ${sponsor.companyName}`,
            },
          },
        },
      ],
      customer_email: sponsor.contactEmail || undefined,
      // Return via a reconciliation step that confirms payment with Stripe and
      // marks it PAID immediately, so the portal never re-shows "Pay now".
      success_url: `${SITE_URL}/invite/${token}/paid?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/invite/${token}?paycancel=1`,
      metadata: { paymentId: payment.id, sponsorId: sponsor.id },
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id, method: "stripe" },
    });
    checkoutUrl = session.url;
  } catch {
    checkoutUrl = null;
  }

  // redirect() throws NEXT_REDIRECT, so it must live outside the try/catch.
  if (!checkoutUrl) redirect(`/invite/${token}?payerror=1`);
  redirect(checkoutUrl);
}

/**
 * Set a password on the sponsor's record to enable email + password login
 * (docs/PLAN.md §16 Phase E). Authenticated by the magic-link token (proof of
 * email ownership), then signs them in and sends them to the account portal.
 */
export async function setSponsorPasswordAction(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const password = str(formData, "password");
  const sponsor = await getSponsorByToken(token);
  if (!sponsor || !sponsor.contactEmail) redirect(`/invite/${token}`);
  if (password.length < 8) redirect(`/invite/${token}?pwerr=short`);

  const contactEmail = normalizeContactEmail(sponsor.contactEmail);
  if (!contactEmail) redirect(`/invite/${token}`);

  const duplicateAccount = (await findSponsorsByContactEmail(sponsor.eventId, contactEmail))
    .filter((s) => s.id !== sponsor.id)
    .find((s) => s.passwordHash && isSponsorAccountStatus(s.status));
  if (duplicateAccount) redirect(`/invite/${token}?pwerr=duplicate`);

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: { contactEmail, passwordHash },
  });
  await createSponsorSession(sponsor.id);
  redirect("/portal");
}

/** Return path that keeps the sponsor where they are (link vs. account portal). */
function safeReturn(returnTo: string, token: string): string {
  if (returnTo === "/portal" || returnTo === `/invite/${token}`) return returnTo;
  return `/invite/${token}`;
}

/**
 * The sponsor signs a sent contract from their portal (docs/PLAN.md §16 Phase F).
 * Records the typed name, timestamp and IP as the e-signature. Token-authenticated,
 * so it works from both the magic-link and the account portal.
 */
export async function signContractAction(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const contractId = str(formData, "contractId");
  const name = str(formData, "name");
  const agree = formData.get("agree") === "on";
  const back = safeReturn(str(formData, "returnTo"), token);

  const sponsor = await getSponsorByToken(token);
  if (!sponsor) redirect(`/invite/${token}`);

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, sponsorId: sponsor.id, status: "SENT" },
    select: { id: true },
  });
  if (!contract) redirect(back);
  if (!name || !agree) redirect(`${back}?signerr=1`);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  await prisma.contract.update({
    where: { id: contract.id },
    data: { status: "SIGNED", signedName: name, signedAt: new Date(), signedIp: ip },
  });
  revalidatePath("/admin/candidates");
  redirect(`${back}?signed=1`);
}
