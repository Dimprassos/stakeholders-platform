import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InterestForm } from "@/components/interest-form";
import { getPublicEvent } from "@/lib/event";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  const name = event && event.slug === slug ? event.name : "Event";
  return { title: { absolute: `Become a sponsor · ${name}` } };
}

export default async function EventBecomeSponsorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { slug } = await params;
  const { package: packageId } = await searchParams;
  const event = await getPublicEvent(slug);
  if (!event || event.slug !== slug) notFound();

  const packages = await prisma.package.findMany({
    where: { isActive: true, eventId: event.id },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, tier: true },
  });

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href={`/events/${event.slug}/packages`}
        className="text-sm text-zinc-500 underline underline-offset-4 hover:text-foreground"
      >
        ← Back to packages
      </Link>
      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-brand-accent">
        {event.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Become a sponsor
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Interested in supporting {event.name}? Share a few details and our team will
        reach out with the right package for you.
      </p>

      <div className="mt-10">
        {/* eventSlug ties the submission to this event, not the default one. */}
        <InterestForm
          packages={packages}
          defaultPackageId={packageId}
          eventSlug={event.slug}
        />
      </div>
    </section>
  );
}
