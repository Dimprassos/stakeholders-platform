import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { tierLabel, tierRank } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our sponsors",
  description: "The partners supporting our event.",
};

const TIER_ACCENTS: Record<string, string> = {
  PLATINUM: "text-zinc-950 dark:text-white",
  GOLD: "text-brand-accent",
  SILVER: "text-slate-600 dark:text-slate-300",
  BRONZE: "text-orange-700 dark:text-orange-300",
};

function sponsorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    // Defense in depth: only CONFIRMED sponsors can ever appear publicly, even
    // if `isPublished` was somehow set on an earlier-stage record.
    where: { status: "CONFIRMED", isPublished: true, isHiddenFromPublic: false },
    include: { package: true },
    orderBy: { displayOrder: "asc" },
  });

  // Group by the tier of the linked package.
  const groups = new Map<string, typeof sponsors>();
  for (const s of sponsors) {
    const tier = s.package?.tier ?? "OTHER";
    const list = groups.get(tier) ?? [];
    list.push(s);
    groups.set(tier, list);
  }
  const tiers = [...groups.keys()].sort((a, b) => tierRank(a) - tierRank(b));

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
        Partner showcase
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Our sponsors</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Meet the organizations backing the conversations, introductions and market access
        behind this year&apos;s summit.
      </p>

      {sponsors.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-black/10 p-8 dark:border-white/10">
          <h2 className="font-semibold">Sponsors will be announced soon.</h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Confirmed partners appear here after organizer approval. Interested in joining
            the first group?
          </p>
        </div>
      ) : (
        <div className="mt-12 space-y-12">
          {tiers.map((tier) => {
            const sponsorsInTier = groups.get(tier)!;
            const tierName = tier === "OTHER" ? "Partners" : tierLabel(tier);
            const accent = TIER_ACCENTS[tier] ?? "text-zinc-500";

            return (
              <div key={tier}>
                <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-3 dark:border-white/10">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${accent}`}>
                      {tierName}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                      {sponsorsInTier.length} partner
                      {sponsorsInTier.length === 1 ? "" : "s"}
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-500">Confirmed and public</p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sponsorsInTier.map((s) => {
                    const cardClass =
                      "block min-h-40 rounded-lg border border-black/10 p-5 transition-colors hover:border-brand-accent dark:border-white/10";
                    const content = (
                      <>
                        <div className="flex h-16 items-center justify-center">
                          {s.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.logoUrl}
                              alt={s.companyName}
                              loading="lazy"
                              decoding="async"
                              className="max-h-12 max-w-full object-contain"
                            />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">
                              {sponsorInitials(s.companyName)}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 text-center">
                          <h3 className="font-semibold">{s.companyName}</h3>
                          {s.description && (
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {s.description}
                            </p>
                          )}
                          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                            {s.package?.name ?? tierName}
                          </p>
                        </div>
                      </>
                    );

                    return s.websiteUrl ? (
                      <a
                        key={s.id}
                        href={s.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.companyName}
                        className={cardClass}
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={s.id} className={cardClass}>
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
