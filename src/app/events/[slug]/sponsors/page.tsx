import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicEvent } from "@/lib/event";
import { SponsorGrid } from "@/components/sponsor-grid";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  const name = event && event.slug === slug ? event.name : "Event";
  return { title: { absolute: `Our sponsors · ${name}` } };
}

export default async function EventSponsorsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event || event.slug !== slug) notFound();

  const sponsors = await prisma.sponsor.findMany({
    where: {
      eventId: event.id,
      status: "CONFIRMED",
      isPublished: true,
      isHiddenFromPublic: false,
    },
    include: { package: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
        {event.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Our sponsors</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Meet the organizations backing the conversations, introductions and market access
        behind this event.
      </p>

      <SponsorGrid sponsors={sponsors} />
    </section>
  );
}
