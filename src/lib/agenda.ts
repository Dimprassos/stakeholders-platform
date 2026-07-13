import type { AgendaItem } from "@prisma/client";

export const AGENDA_TYPES = [
  "SESSION",
  "KEYNOTE",
  "BREAK",
  "SOCIAL",
  "REGISTRATION",
] as const;

export const AGENDA_TYPE_LABEL: Record<string, string> = {
  SESSION: "Session",
  KEYNOTE: "Keynote",
  BREAK: "Break",
  SOCIAL: "Social event",
  REGISTRATION: "Registration",
};

export const AGENDA_TYPE_TONE: Record<string, string> = {
  SESSION: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  KEYNOTE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  BREAK: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300",
  SOCIAL: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  REGISTRATION: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

/** "2026-10-21" -> "Wednesday, 21 October 2026" (falls back to the raw value). */
export function formatAgendaDay(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatSlot(startTime: string, endTime: string | null): string {
  return endTime ? `${startTime} – ${endTime}` : startTime;
}

export type AgendaDay = {
  day: string;
  dayLabel: string | null;
  items: AgendaItem[];
};

/**
 * Group programme items into days (ascending), keeping each day's items in
 * `displayOrder` then start-time order — the order the queries already return.
 */
export function groupAgendaByDay(items: AgendaItem[]): AgendaDay[] {
  const map = new Map<string, AgendaDay>();
  for (const item of items) {
    const existing = map.get(item.day);
    if (existing) {
      existing.items.push(item);
      if (!existing.dayLabel && item.dayLabel) existing.dayLabel = item.dayLabel;
    } else {
      map.set(item.day, {
        day: item.day,
        dayLabel: item.dayLabel,
        items: [item],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}
