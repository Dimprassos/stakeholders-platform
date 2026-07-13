import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentEvent, listEvents } from "@/lib/event";
import { formatDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner with us",
  description:
    "Explore sponsorship packages, see who's already on board, and tell us you're interested — we'll take it from there.",
  alternates: { canonical: "/" },
};

const CARDS = [
  {
    id: "audience-access",
    title: "Audience access",
    body: "Meet founders, operators, investors and institutional decision-makers in one focused room.",
    href: "/packages",
  },
  {
    id: "brand-visibility",
    title: "Brand visibility",
    body: "Choose from website, stage, email and onsite placements sized to your partnership goals.",
    href: "/packages",
  },
  {
    id: "start-conversation",
    title: "Start the conversation",
    body: "Tell us what you want to achieve and the organizer team will suggest the best-fit package.",
    href: "/become-a-sponsor",
  },
];

export default async function Home() {
  const [event, allEvents] = await Promise.all([getCurrentEvent(), listEvents()]);
  const name = event?.name ?? "Stakeholders Summit 2026";
  const tagline = event?.tagline ?? "Where industry leaders and brands connect.";
  const dateRange = formatDateRange(event?.startDate, event?.endDate);
  const meta = [dateRange, event?.venue].filter(Boolean).join(" · ");

  // When the organizer runs more than one event, surface all of them on the
  // landing page (single-event stays exactly as before).
  const events = allEvents.filter((e) => e.isActive);
  const showEvents = events.length > 1;

  return (
    <>
      {event?.bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.bannerUrl}
          alt=""
          className="h-64 w-full object-cover sm:h-80"
        />
      )}
      <section className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            {meta && (
              <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
                {meta}
              </p>
            )}
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
              {name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              {tagline} Build recognition with the decision-makers shaping the next
              chapter of the market.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/packages"
                className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
              >
                View packages
              </Link>
              <Link
                href="/become-a-sponsor"
                className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition-colors hover:border-foreground dark:border-white/20"
              >
                Become a sponsor
              </Link>
            </div>
          </div>

        </div>
      </section>

      {showEvents && (
        <section id="events" className="mx-auto max-w-5xl px-6 pt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Our events</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sponsorship opportunities across every event we run.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {events.map((e) => {
              const evMeta = [formatDateRange(e.startDate, e.endDate), e.venue]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.slug}`}
                    className="flex h-full items-start gap-4 rounded-lg border border-black/10 p-6 transition-colors hover:border-brand-accent dark:border-white/10"
                  >
                    {e.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.logoUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-contain"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{e.name}</h3>
                        {e.isDefault && (
                          <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-accent">
                            Featured
                          </span>
                        )}
                      </div>
                      {evMeta && <p className="mt-1 text-xs text-zinc-500">{evMeta}</p>}
                      {e.tagline && (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                          {e.tagline}
                        </p>
                      )}
                      <p className="mt-3 text-sm font-medium text-brand-accent">
                        View event →
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 pt-16 sm:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="rounded-lg border border-black/10 p-6 transition-colors hover:border-brand-accent dark:border-white/10"
            >
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
