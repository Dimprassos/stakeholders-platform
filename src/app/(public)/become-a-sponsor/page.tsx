import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InterestForm } from "@/components/interest-form";
import { listEvents } from "@/lib/event";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become a sponsor",
  description: "Tell us you're interested in sponsoring and we'll get in touch.",
};

export default async function BecomeSponsorPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageId } = await searchParams;

  // Offer every active event (default first) so a visitor arriving at the generic
  // form picks the event explicitly, instead of silently getting the default one.
  // With a single event the picker is hidden and nothing changes.
  const events = (await listEvents()).filter((e) => e.isActive);
  const slugById = new Map(events.map((e) => [e.id, e.slug]));

  const rows = await prisma.package.findMany({
    where: { isActive: true, eventId: { in: events.map((e) => e.id) } },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, tier: true, eventId: true },
  });
  const packages = rows.map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    eventSlug: slugById.get(p.eventId) ?? "",
  }));

  const multiEvent = events.length > 1;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Become a sponsor</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        {multiEvent
          ? "Pick the event you're interested in, share a few details, and our team will reach out with the right package for you."
          : "Interested in supporting the event? Share a few details and our team will reach out with the right package for you."}
      </p>

      <div className="mt-10">
        <InterestForm
          packages={packages}
          defaultPackageId={packageId}
          events={events.map((e) => ({ slug: e.slug, name: e.name }))}
        />
      </div>
    </section>
  );
}
