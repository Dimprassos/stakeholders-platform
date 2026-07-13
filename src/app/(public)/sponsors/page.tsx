import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentEventId } from "@/lib/event";
import { SponsorGrid } from "@/components/sponsor-grid";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our sponsors",
  description: "The partners supporting our event.",
};

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    // Defense in depth: only CONFIRMED sponsors can ever appear publicly, even
    // if `isPublished` was somehow set on an earlier-stage record.
    where: {
      eventId: await getCurrentEventId(),
      status: "CONFIRMED",
      isPublished: true,
      isHiddenFromPublic: false,
    },
    include: { package: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Reveal
        as="p"
        y="0.5rem"
        className="text-sm font-medium uppercase tracking-wide text-brand-accent"
      >
        Partner showcase
      </Reveal>
      <Reveal
        as="h1"
        delay={80}
        className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Our sponsors
      </Reveal>
      <Reveal
        as="p"
        delay={160}
        className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400"
      >
        Meet the organizations backing the conversations, introductions and market access
        behind this year&apos;s summit.
      </Reveal>

      <SponsorGrid sponsors={sponsors} />
    </section>
  );
}
