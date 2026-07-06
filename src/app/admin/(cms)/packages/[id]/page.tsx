import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseBenefits } from "@/lib/format";
import { PackageForm } from "../package-form";
import { updatePackageAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: pkg ? `Edit · ${pkg.name}` : "Edit package" };
}

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({ where: { id } });

  if (!pkg) notFound();

  const initial = {
    name: pkg.name,
    tier: pkg.tier,
    priceEuros: (pkg.priceCents / 100).toString(),
    currency: pkg.currency,
    benefits: parseBenefits(pkg.benefits).join("\n"),
    slotsTotal: pkg.slotsTotal != null ? pkg.slotsTotal.toString() : "",
    displayOrder: pkg.displayOrder.toString(),
    isActive: pkg.isActive,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit package</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Update the details for {pkg.name}.
        </p>
      </div>
      <PackageForm action={updatePackageAction} packageId={pkg.id} initial={initial} />
    </div>
  );
}