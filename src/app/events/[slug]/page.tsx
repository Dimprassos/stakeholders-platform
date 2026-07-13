import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicEvent } from "@/lib/event";
import { formatDateRange } from "@/lib/format";
import { Countdown } from "@/components/countdown";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event || event.slug !== slug) return { title: "Event" };
  return {
    // Absolute: don't append the default event's SITE_NAME to another event's title.
    title: { absolute: event.name },
    description: event.tagline ?? "Sponsorship opportunities.",
  };
}

export default async function EventHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event || event.slug !== slug) notFound();

  const base = `/events/${event.slug}`;
  const meta = [formatDateRange(event.startDate, event.endDate), event.venue]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {event.bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.bannerUrl}
          alt=""
          className="h-64 w-full object-cover sm:h-80"
        />
      )}
      <section className="hero-stage">
        {/* Decorative backdrop — picks up this event's brand colors via CSS vars. */}
        <div className="aurora" aria-hidden />
        <div className="grid-veil" aria-hidden />

        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <Link
            href="/"
            className="group inline-flex items-center gap-1 text-sm text-zinc-500 underline underline-offset-4 hover:text-foreground"
          >
            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
            All events
          </Link>

          {meta && (
            <Reveal
              as="p"
              y="0.5rem"
              className="mt-6 text-sm font-medium uppercase tracking-wide text-brand-accent"
            >
              {meta}
            </Reveal>
          )}
          <Reveal
            as="h1"
            delay={90}
            className="gradient-ink mt-3 text-4xl font-semibold tracking-tight sm:text-6xl"
          >
            {event.name}
          </Reveal>
          {event.tagline && (
            <Reveal
              as="p"
              delay={180}
              className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400"
            >
              {event.tagline}
            </Reveal>
          )}

          <Reveal delay={270} className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={`${base}/packages`}
              className="btn-brand rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-ink"
            >
              View packages
            </Link>
            <Link
              href={`${base}/become-a-sponsor`}
              className="btn-ghost rounded-full border border-black/15 px-6 py-3 text-sm font-medium dark:border-white/20"
            >
              Become a sponsor
            </Link>
          </Reveal>

          {event.startDate && (
            <Reveal delay={360} className="mt-12">
              <Countdown startDate={event.startDate} endDate={event.endDate} />
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
