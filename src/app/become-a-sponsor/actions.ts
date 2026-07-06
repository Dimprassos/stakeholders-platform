"use server";

import { prisma } from "@/lib/prisma";
import type { SubmitState } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitInterest(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // Honeypot: real users never fill the hidden "website" field. Pretend success.
  if (str(formData, "website")) {
    return { ok: true, message: "Thank you — we'll be in touch." };
  }

  const companyName = str(formData, "companyName");
  const contactName = str(formData, "contactName");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const message = str(formData, "message");
  let packageInterestId = str(formData, "packageInterestId");
  const consent = formData.get("consent") === "on";

  const errors: Record<string, string> = {};
  if (!companyName) errors.companyName = "Company name is required.";
  if (!contactName) errors.contactName = "Your name is required.";
  if (!EMAIL_RE.test(email)) errors.email = "A valid email is required.";
  if (!consent) errors.consent = "Please accept the privacy terms.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // Only keep the package reference if it points to a real package.
  if (packageInterestId) {
    const exists = await prisma.package.findUnique({
      where: { id: packageInterestId },
      select: { id: true },
    });
    if (!exists) packageInterestId = "";
  }

  try {
    await prisma.submission.create({
      data: {
        companyName,
        contactName,
        email,
        phone: phone || null,
        message: message || null,
        packageInterestId: packageInterestId || null,
        consentGiven: true,
      },
    });
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  return { ok: true, message: "Thank you — we'll be in touch soon." };
}
