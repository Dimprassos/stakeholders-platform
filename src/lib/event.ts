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

const KEYS = ["eventName", "tagline", "eventStartDate", "eventEndDate", "venue"] as const;

/**
 * Reads the public-facing event identity from the `Setting` table.
 * Cached per-request so header, footer and page can each call it without
 * duplicating the query. Falls back to demo defaults if a key is missing.
 */
export const getEventSettings = cache(async (): Promise<EventSettings> => {
  const rows = await prisma.setting.findMany({ where: { key: { in: [...KEYS] } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    name: map.get("eventName") ?? "Stakeholders Summit 2026",
    tagline: map.get("tagline") ?? "Where industry leaders and brands connect.",
    startDate: map.get("eventStartDate") ?? null,
    endDate: map.get("eventEndDate") ?? null,
    venue: map.get("venue") ?? null,
  };
});
