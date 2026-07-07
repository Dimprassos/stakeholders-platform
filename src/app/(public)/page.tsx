import type { Metadata } from "next";
import Link from "next/link";
import { getEventSettings } from "@/lib/event";
import { formatDateRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Partner with us",
  description:
    "Explore sponsorship packages, see who's already on board, and tell us you're interested — we'll take it from there.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const event = await getEventSettings();
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const meta = [dateRange, event.venue].filter(Boolean).join(" · ");

  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
        {meta && (
          <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
            {meta}
          </p>
        )}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
          {event.name}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          {event.tagline} Put your brand in front of our audience — explore the sponsorship
          packages and join us.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Sponsorship packages", body: "Transparent tiers, benefits and pricing.", href: "/packages" },
            { title: "Our sponsors", body: "See the partners already supporting the event.", href: "/sponsors" },
            { title: "Get in touch", body: "Share your details and we'll reach out.", href: "/become-a-sponsor" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-xl border border-black/10 p-6 transition-colors hover:border-foreground dark:border-white/10"
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
