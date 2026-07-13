import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicEvent } from "@/lib/event";
import { formatDateRange } from "@/lib/format";

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
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <Link
          href="/"
          className="text-sm text-zinc-500 underline underline-offset-4 hover:text-foreground"
        >
          ← All events
        </Link>

        {meta && (
          <p className="mt-6 text-sm font-medium uppercase tracking-wide text-brand-accent">
            {meta}
          </p>
        )}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
          {event.name}
        </h1>
        {event.tagline && (
          <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            {event.tagline}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={`${base}/packages`}
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
          >
            View packages
          </Link>
          <Link
            href={`${base}/become-a-sponsor`}
            className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition-colors hover:border-foreground dark:border-white/20"
          >
            Become a sponsor
          </Link>
        </div>
      </section>
    </>
  );
}
