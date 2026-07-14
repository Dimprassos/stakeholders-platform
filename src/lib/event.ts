import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Cookie holding the admin's currently-selected event id. */
export const ADMIN_EVENT_COOKIE = "admin_event";

export type EventSettings = {
  name: string;
  tagline: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  language: string;
};

/**
 * The "current" event. For now this resolves to the default event; the
 * multi-event switcher (docs/PLAN.md §16 Phase A, a later step) will make it
 * dynamic (per admin selection / public slug). Cached per request.
 */
export const getCurrentEvent = cache(async () => {
  return (
    (await prisma.event.findFirst({ where: { isDefault: true } })) ??
    (await prisma.event.findFirst({ orderBy: { createdAt: "asc" } }))
  );
});

/**
 * Resolve a public-facing event by slug (must be active), falling back to the
 * default event. Lets public pages scope to any event via `?event=slug` while
 * keeping the default event as the plain no-param behavior.
 */
export const getPublicEvent = cache(async (slug?: string | null) => {
  if (slug) {
    const event = await prisma.event.findFirst({ where: { slug, isActive: true } });
    if (event) return event;
  }
  return getCurrentEvent();
});

/** The current event's id. Throws if the DB has no event (run the seed). */
export const getCurrentEventId = cache(async (): Promise<string> => {
  const event = await getCurrentEvent();
  if (!event) {
    throw new Error(
      "No event found — run `npm run db:seed` to create the default event.",
    );
  }
  return event.id;
});

/** All events, default first. */
export const listEvents = cache(async () => {
  return prisma.event.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
});

/**
 * The event the admin is currently working in — from the `admin_event` cookie,
 * falling back to the default event. Admin CMS pages/actions scope by this.
 */
export const getAdminEvent = cache(async () => {
  const store = await cookies();
  const id = store.get(ADMIN_EVENT_COOKIE)?.value;
  if (id) {
    const ev = await prisma.event.findUnique({ where: { id } });
    if (ev) return ev;
  }
  return getCurrentEvent();
});

/** The admin's current event id. Throws if the DB has no event (run the seed). */
export const getAdminEventId = cache(async (): Promise<string> => {
  const event = await getAdminEvent();
  if (!event) {
    throw new Error("No event found — run `npm run db:seed`.");
  }
  return event.id;
});

/**
 * Reads the public-facing event identity from the current Event.
 * Cached per-request so header, footer and page can each call it without
 * duplicating the query. Falls back to demo defaults if no event exists.
 */
export const getEventSettings = cache(async (): Promise<EventSettings> => {
  const event = await getCurrentEvent();
  return {
    name: event?.name ?? "Stakeholders Summit 2026",
    tagline: event?.tagline ?? "Where industry leaders and brands connect.",
    startDate: event?.startDate ?? null,
    endDate: event?.endDate ?? null,
    venue: event?.venue ?? null,
    language: event?.language ?? "en",
  };
});

/**
 * Public-facing identity for a *specific* event by id. Sponsor-facing content
 * (invite/payment/contract emails, the proposal page) must reflect the event a
 * sponsor actually belongs to — never the default event — or a multi-event
 * setup shows the wrong name/dates/venue (QA P0-1). Cached per (request, id).
 */
export const getEventSettingsById = cache(
  async (eventId: string): Promise<EventSettings> => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    return {
      name: event?.name ?? "Stakeholders Summit 2026",
      tagline: event?.tagline ?? "Where industry leaders and brands connect.",
      startDate: event?.startDate ?? null,
      endDate: event?.endDate ?? null,
      venue: event?.venue ?? null,
      language: event?.language ?? "en",
    };
  },
);
