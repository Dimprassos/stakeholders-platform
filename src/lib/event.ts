import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type EventSettings = {
  name: string;
  tagline: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
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
  };
});
