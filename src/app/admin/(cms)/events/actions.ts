"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_EVENT_COOKIE } from "@/lib/event";
import { textToFaq, textToDeadlines } from "@/lib/event-content";
import { isThemeModeValue } from "@/lib/theme-presets";
import { ALLOWED_IMAGE_EXT, MAX_IMAGE_BYTES, saveUploadedImage } from "@/lib/uploads";
import { normalizeUrl, normalizeHexColor, isValidHexColor } from "@/lib/validation";
import type { UpdateEventState } from "./types";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event"
  );
}

async function setCurrentEventCookie(eventId: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_EVENT_COOKIE, eventId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function createEventAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${++n}`;
  }

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };

  const event = await prisma.event.create({
    data: {
      name,
      slug,
      tagline: str("tagline"),
      startDate: str("startDate"),
      endDate: str("endDate"),
      venue: str("venue"),
    },
  });

  // Work in the newly-created event immediately.
  await setCurrentEventCookie(event.id);
  revalidatePath("/", "layout");
  redirect("/admin/events");
}

export async function switchEventAction(formData: FormData): Promise<void> {
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  const ev = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!ev) return;
  await setCurrentEventCookie(id);
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function setDefaultEventAction(formData: FormData): Promise<void> {
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  await prisma.$transaction([
    prisma.event.updateMany({ data: { isDefault: false } }),
    prisma.event.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/", "layout");
  redirect("/admin/events");
}

async function saveEventImage(
  formData: FormData,
  fileField: string,
  urlField: string,
  subdir: string,
  eventId: string,
  errors: Record<string, string>,
): Promise<string | null | undefined> {
  const file = formData.get(fileField);
  if (file instanceof File && file.size > 0) {
    if (process.env.NODE_ENV === "production") {
      errors[fileField] =
        "Direct uploads are not enabled in production yet. Please paste a hosted image URL.";
      return undefined;
    }
    if (!(file.type in ALLOWED_IMAGE_EXT)) {
      errors[fileField] = "Image must be a PNG, JPG or WEBP.";
      return undefined;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      errors[fileField] = "Image must be under 2 MB.";
      return undefined;
    }
    return saveUploadedImage(file, subdir, eventId);
  }
  return normalizeUrl(String(formData.get(urlField) ?? ""));
}

export async function updateEventAction(
  _prev: UpdateEventState,
  formData: FormData,
): Promise<UpdateEventState> {
  const id = String(formData.get("eventId") ?? "");
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return { ok: false, message: "Event not found." };

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const name = str("name");
  if (!name) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: { name: "Name is required." } };
  }

  const themeMode = str("themeMode");
  const errors: Record<string, string> = {};
  if (!isThemeModeValue(themeMode)) {
    errors.themeMode = "Invalid theme.";
  }
  for (const [field, value] of [
    ["brandColor", str("brandColor")],
    ["brandInkColor", str("brandInkColor")],
    ["brandAccentColor", str("brandAccentColor")],
  ] as const) {
    if (!isValidHexColor(value)) errors[field] = "Enter a valid hex color, e.g. #f59e0b.";
  }

  const logoUrl = await saveEventImage(formData, "logoFile", "logoUrl", "events", id, errors);
  const bannerUrl = await saveEventImage(formData, "bannerFile", "bannerUrl", "events", id, errors);

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  await prisma.event.update({
    where: { id },
    data: {
      name,
      tagline: str("tagline") || null,
      startDate: str("startDate") || null,
      endDate: str("endDate") || null,
      venue: str("venue") || null,
      mapUrl: normalizeUrl(str("mapUrl")),
      currency: str("currency") || "EUR",
      language: str("language") || "en",
      websiteUrl: normalizeUrl(str("websiteUrl")),
      twitterUrl: normalizeUrl(str("twitterUrl")),
      linkedinUrl: normalizeUrl(str("linkedinUrl")),
      instagramUrl: normalizeUrl(str("instagramUrl")),
      facebookUrl: normalizeUrl(str("facebookUrl")),
      faq: JSON.stringify(textToFaq(str("faqText"))),
      deadlines: JSON.stringify(textToDeadlines(str("deadlinesText"))),
      termsText: str("termsText") || null,
      privacyText: str("privacyText") || null,
      cancellationText: str("cancellationText") || null,
      themeMode,
      brandColor: normalizeHexColor(str("brandColor")),
      brandInkColor: normalizeHexColor(str("brandInkColor")),
      brandAccentColor: normalizeHexColor(str("brandAccentColor")),
      logoUrl,
      bannerUrl,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/events");
  return { ok: true, message: "Event updated." };
}
