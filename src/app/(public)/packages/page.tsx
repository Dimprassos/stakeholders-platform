import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { slotsTakenByPackage } from "@/lib/slots";
import { getCurrentEventId } from "@/lib/event";
import { PackageGrid } from "@/components/package-grid";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsorship packages",
  description: "Sponsorship tiers, benefits and pricing.",
};

export default async function PackagesPage() {
  const packages = await prisma.package.findMany({
    where: { isActive: true, eventId: await getCurrentEventId() },
    orderBy: { displayOrder: "asc" },
  });
  const takenByPackage = await slotsTakenByPackage(packages.map((p) => p.id));

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Reveal
        as="p"
        y="0.5rem"
        className="text-sm font-medium uppercase tracking-wide text-brand-accent"
      >
        Partnership menu
      </Reveal>
      <Reveal
        as="h1"
        delay={80}
        className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Sponsorship packages
      </Reveal>
      <Reveal
        as="p"
        delay={160}
        className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400"
      >
        Choose the tier that fits your goals. Every package gives your brand a credible
        presence with senior stakeholders; higher tiers add stage access, category visibility
        and private networking moments.
      </Reveal>

      <PackageGrid
        packages={packages}
        takenByPackage={takenByPackage}
        becomeHref="/become-a-sponsor"
      />
    </section>
  );
}
