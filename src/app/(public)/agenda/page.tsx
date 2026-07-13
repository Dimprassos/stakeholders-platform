import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentEvent } from "@/lib/event";
import { formatDateRange } from "@/lib/format";
import { AgendaView } from "@/components/agenda-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda",
  description: "The programme for the event.",
};

export default async function AgendaPage() {
  const event = await getCurrentEvent();
  const items = event
    ? await prisma.agendaItem.findMany({
        where: { eventId: event.id },
        orderBy: [{ day: "asc" }, { displayOrder: "asc" }, { startTime: "asc" }],
      })
    : [];

  const dates = formatDateRange(event?.startDate, event?.endDate);

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
        Programme
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Agenda</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        {dates
          ? `The programme for ${dates}${event?.venue ? ` at ${event.venue}` : ""}.`
          : "The programme for the event."}
      </p>

      <AgendaView items={items} note={event?.agendaNote} />
    </section>
  );
}
