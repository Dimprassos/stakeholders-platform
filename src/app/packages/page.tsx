import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseBenefits } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsorship packages",
  description: "Sponsorship tiers, benefits and pricing.",
};

export default async function PackagesPage() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sponsorship packages</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Choose the tier that fits your goals. Every package puts your brand in front of our
        audience — the higher tiers add speaking slots, prime placement and more.
      </p>

      {packages.length === 0 ? (
        <p className="mt-12 text-zinc-500">No packages are available yet. Please check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const benefits = parseBenefits(pkg.benefits);
            const slotsLeft =
              pkg.slotsTotal != null ? Math.max(pkg.slotsTotal - pkg.slotsTaken, 0) : null;

            return (
              <div
                key={pkg.id}
                className="flex flex-col rounded-xl border border-black/10 p-6 dark:border-white/10"
              >
                <h2 className="text-lg font-semibold">{pkg.name}</h2>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatPrice(pkg.priceCents, pkg.currency)}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {benefits.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span aria-hidden className="text-foreground">
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {slotsLeft != null && (
                    <p className="mb-3 text-xs text-zinc-500">
                      {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left` : "Fully booked"}
                    </p>
                  )}
                  <Link
                    href={`/become-a-sponsor?package=${pkg.id}`}
                    className="inline-block rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
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
