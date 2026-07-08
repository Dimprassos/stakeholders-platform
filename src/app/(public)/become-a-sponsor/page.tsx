import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InterestForm } from "@/components/interest-form";
import { getCurrentEventId } from "@/lib/event";

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

  const packages = await prisma.package.findMany({
    where: { isActive: true, eventId: await getCurrentEventId() },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, tier: true },
  });

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Become a sponsor</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Interested in supporting the event? Share a few details and our team will reach out with
        the right package for you.
      </p>

      <div className="mt-10">
        <InterestForm packages={packages} defaultPackageId={packageId} />
      </div>
    </section>
  );
}
