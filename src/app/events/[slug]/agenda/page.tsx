import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicEvent } from "@/lib/event";
import { formatDateRange } from "@/lib/format";
import { AgendaView } from "@/components/agenda-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  const name = event && event.slug === slug ? event.name : "Event";
  return { title: { absolute: `Agenda · ${name}` } };
}

export default async function EventAgendaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event || event.slug !== slug) notFound();

  const items = await prisma.agendaItem.findMany({
    where: { eventId: event.id },
    orderBy: [{ day: "asc" }, { displayOrder: "asc" }, { startTime: "asc" }],
  });

  const dates = formatDateRange(event.startDate, event.endDate);

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
        {event.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Agenda</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        {dates
          ? `The programme for ${dates}${event.venue ? ` at ${event.venue}` : ""}.`
          : "The programme for this event."}
      </p>

      <AgendaView items={items} note={event.agendaNote} />
    </section>
  );
}
