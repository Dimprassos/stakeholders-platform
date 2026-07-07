import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseBenefits, tierLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsorship packages",
  description: "Sponsorship tiers, benefits and pricing.",
};

const TIER_STYLES: Record<
  string,
  { badge: string; border: string; eyebrow: string; copy: string }
> = {
  PLATINUM: {
    badge: "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950",
    border: "border-zinc-950/30 dark:border-white/30",
    eyebrow: "text-zinc-950 dark:text-white",
    copy: "Best for category ownership and executive-level visibility.",
  },
  GOLD: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    border: "border-amber-500/50",
    eyebrow: "text-brand-accent",
    copy: "Best for brands that want stage access and strong onsite presence.",
  },
  SILVER: {
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    eyebrow: "text-slate-600 dark:text-slate-300",
    copy: "Best for focused visibility across website, social and networking moments.",
  },
  BRONZE: {
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    border: "border-orange-300/80 dark:border-orange-900",
    eyebrow: "text-orange-700 dark:text-orange-300",
    copy: "Best for supporting the community with a light, visible footprint.",
  },
};

function tierStyle(tier: string) {
  return (
    TIER_STYLES[tier] ?? {
      badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
      border: "border-black/10 dark:border-white/10",
      eyebrow: "text-zinc-500",
      copy: "A flexible partnership option for the summit.",
    }
  );
}

export default async function PackagesPage() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
        Partnership menu
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Sponsorship packages
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Choose the tier that fits your goals. Every package gives your brand a credible
        presence with senior stakeholders; higher tiers add stage access, category visibility
        and private networking moments.
      </p>

      {packages.length === 0 ? (
        <p className="mt-12 rounded-lg border border-dashed border-black/10 p-6 text-zinc-500 dark:border-white/10">
          No packages are available yet. Please check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const benefits = parseBenefits(pkg.benefits);
            const slotsLeft =
              pkg.slotsTotal != null ? Math.max(pkg.slotsTotal - pkg.slotsTaken, 0) : null;
            const style = tierStyle(pkg.tier);

            return (
              <div
                key={pkg.id}
                className={`flex flex-col rounded-lg border p-6 ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${style.eyebrow}`}>
                      {tierLabel(pkg.tier)}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">{pkg.name}</h2>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>
                    {slotsLeft == null ? "Open" : `${slotsLeft}/${pkg.slotsTotal}`}
                  </span>
                </div>

                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatPrice(pkg.priceCents, pkg.currency)}
                </p>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{style.copy}</p>

                <ul className="mt-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {benefits.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span aria-hidden className="text-brand-accent">
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {slotsLeft != null && (
                    <p className="mb-3 text-xs text-zinc-500">
                      {slotsLeft > 0
                        ? `${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left`
                        : "Fully booked"}
                    </p>
                  )}
                  <Link
                    href={`/become-a-sponsor?package=${pkg.id}`}
                    className="inline-block rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
                  >
                    Become a sponsor
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
