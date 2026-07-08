"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_EVENT_COOKIE } from "@/lib/event";

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
