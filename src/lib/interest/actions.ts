"use server";

import { prisma } from "@/lib/prisma";
import { LIMITS, isValidPhone, normalizePhone } from "@/lib/validation";
import { getCurrentEventId } from "@/lib/event";
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
  else if (companyName.length > LIMITS.companyName)
    errors.companyName = `Keep the company name under ${LIMITS.companyName} characters.`;
  if (!contactName) errors.contactName = "Your name is required.";
  else if (contactName.length > LIMITS.contactName)
    errors.contactName = `Keep your name under ${LIMITS.contactName} characters.`;
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email)
    errors.email = "A valid email is required.";
  if (!isValidPhone(phone))
    errors.phone = "Enter a valid phone number, e.g. +30 69XXXXXXXX.";
  if (message.length > LIMITS.message)
    errors.message = `Keep your message under ${LIMITS.message} characters.`;
  if (!consent) errors.consent = "Please accept the privacy terms.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const eventId = await getCurrentEventId();

  // Only keep the package reference if it points to a real package in this event.
  if (packageInterestId) {
    const exists = await prisma.package.findFirst({
      where: { id: packageInterestId, eventId },
      select: { id: true },
    });
    if (!exists) packageInterestId = "";
  }

  try {
    await prisma.submission.create({
      data: {
        eventId,
        companyName,
        contactName,
        email,
        phone: phone ? normalizePhone(phone) : null,
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
