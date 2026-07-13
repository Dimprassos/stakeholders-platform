import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentEvent, listEvents } from "@/lib/event";
import { slotsTakenByPackage } from "@/lib/slots";
import { formatDateRange } from "@/lib/format";
import { Countdown } from "@/components/countdown";
import { LogoMarquee } from "@/components/logo-marquee";
import { Reveal } from "@/components/reveal";
import { StatCounter } from "@/components/stat-counter";

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

  // Live numbers behind the counters and the logo ticker. Same visibility rules
  // as /sponsors — only CONFIRMED, published, non-hidden sponsors are ever shown.
  const packages = event
    ? await prisma.package.findMany({
        where: { isActive: true, eventId: event.id },
        orderBy: { displayOrder: "asc" },
      })
    : [];
  const sponsors = event
    ? await prisma.sponsor.findMany({
        where: {
          eventId: event.id,
          status: "CONFIRMED",
          isPublished: true,
          isHiddenFromPublic: false,
        },
        select: { id: true, companyName: true, logoUrl: true, websiteUrl: true },
        orderBy: { displayOrder: "asc" },
      })
    : [];

  const takenByPackage = await slotsTakenByPackage(packages.map((p) => p.id));
  const slotsLeft = packages.reduce((total, pkg) => {
    if (pkg.slotsTotal == null) return total;
    return total + Math.max(pkg.slotsTotal - (takenByPackage.get(pkg.id) ?? 0), 0);
  }, 0);

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

      <section className="hero-stage border-b border-black/10 dark:border-white/10">
        {/* Decorative backdrop: drifting brand-colored light + a masked grid. */}
        <div className="aurora" aria-hidden />
        <div className="grid-veil" aria-hidden />

        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            {meta && (
              <Reveal
                as="p"
                y="0.5rem"
                className="text-sm font-medium uppercase tracking-wide text-brand-accent"
              >
                {meta}
              </Reveal>
            )}
            <Reveal
              as="h1"
              delay={90}
              className="gradient-ink mt-3 text-4xl font-semibold tracking-tight sm:text-6xl"
            >
              {name}
            </Reveal>
            <Reveal
              as="p"
              delay={180}
              className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400"
            >
              {tagline} Build recognition with the decision-makers shaping the next
              chapter of the market.
            </Reveal>

            <Reveal delay={270} className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/packages"
                className="btn-brand rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-ink"
              >
                View packages
              </Link>
              <Link
                href="/become-a-sponsor"
                className="btn-ghost rounded-full border border-black/15 px-6 py-3 text-sm font-medium dark:border-white/20"
              >
                Become a sponsor
              </Link>
            </Reveal>

            {event?.startDate && (
              <Reveal delay={360} className="mt-12">
                <Countdown startDate={event.startDate} endDate={event.endDate} />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {(sponsors.length > 0 || packages.length > 0) && (
        <section className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <Reveal y="0.75rem" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <StatCounter value={sponsors.length} label="Partners on board" />
              <StatCounter value={packages.length} label="Packages" />
              <StatCounter value={slotsLeft} label="Slots left" />
              <StatCounter value={events.length} label="Events" />
            </Reveal>
          </div>

          {sponsors.length > 0 && (
            <div className="mx-auto max-w-5xl px-6 pb-10">
              <Reveal y="0.75rem">
                <p className="text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
                  Already on board
                </p>
                <LogoMarquee sponsors={sponsors} />
              </Reveal>
            </div>
          )}
        </section>
      )}

      {showEvents && (
        <section id="events" className="mx-auto max-w-5xl px-6 pt-16">
          <Reveal as="h2" y="0.75rem" className="text-2xl font-semibold tracking-tight">
            Our events
          </Reveal>
          <Reveal
            as="p"
            y="0.75rem"
            delay={80}
            className="mt-1 text-sm text-zinc-600 dark:text-zinc-400"
          >
            Sponsorship opportunities across every event we run.
          </Reveal>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {events.map((e, i) => {
              const evMeta = [formatDateRange(e.startDate, e.endDate), e.venue]
                .filter(Boolean)
                .join(" · ");
              return (
                <Reveal as="li" key={e.id} delay={i * 80}>
                  <Link
                    href={`/events/${e.slug}`}
                    className="lift group flex h-full items-start gap-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
                  >
                    {e.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.logoUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-contain transition-transform duration-300 group-hover:scale-110"
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
                        View event{" "}
                        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 pt-16 sm:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal as="div" key={c.id} delay={i * 90}>
              <Link
                href={c.href}
                className="lift group block h-full rounded-lg border border-black/10 p-6 dark:border-white/10"
              >
                <h2 className="font-semibold">{c.title}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.body}</p>
                <p className="mt-4 text-sm font-medium text-brand-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Learn more{" "}
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
