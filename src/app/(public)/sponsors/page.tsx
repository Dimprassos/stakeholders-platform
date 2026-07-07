import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { tierLabel, tierRank } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our sponsors",
  description: "The partners supporting our event.",
};

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    where: { isPublished: true, isHiddenFromPublic: false },
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
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Our sponsors</h1>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        We&apos;re proud to partner with the organizations that make this event possible.
      </p>

      {sponsors.length === 0 ? (
        <p className="mt-12 text-zinc-500">Sponsors will be announced soon.</p>
      ) : (
        <div className="mt-12 space-y-12">
          {tiers.map((tier) => (
            <div key={tier}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {tier === "OTHER" ? "Partners" : tierLabel(tier)}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.get(tier)!.map((s) => {
                  const card = (
                    <div className="flex h-24 items-center justify-center rounded-xl border border-black/10 p-4 text-center transition-colors hover:border-foreground dark:border-white/10">
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
                        <span className="font-medium">{s.companyName}</span>
                      )}
                    </div>
                  );

                  return s.websiteUrl ? (
                    <a
                      key={s.id}
                      href={s.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.companyName}
                    >
                      {card}
                    </a>
                  ) : (
                    <div key={s.id}>{card}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
