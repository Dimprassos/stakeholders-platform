import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseBenefits } from "@/lib/format";
import { formatPrice } from "@/lib/format";
import { deletePackageAction, togglePackageActiveAction } from "./actions";
import { slotsTakenByPackage } from "@/lib/slots";
import { getAdminEventId } from "@/lib/event";

export const dynamic = "force-dynamic";

async function handleDelete(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await deletePackageAction(id);
  revalidatePath("/admin/packages");
}

async function handleToggle(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await togglePackageActiveAction(id);
  revalidatePath("/admin/packages");
}

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({
    where: { eventId: await getAdminEventId() },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { sponsors: true } } },
  });
  const takenByPackage = await slotsTakenByPackage(packages.map((p) => p.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage sponsorship tiers, benefits and pricing.
          </p>
        </div>
        <Link
          href="/admin/packages/new"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          New package
        </Link>
      </div>

      {packages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
          No packages yet. Create your first one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Slots</th>
                <th className="px-4 py-3 font-medium">Benefits</th>
                <th className="px-4 py-3 font-medium">Sponsors</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {packages.map((pkg) => {
                const benefitCount = parseBenefits(pkg.benefits).length;
                const slotsLabel =
                  pkg.slotsTotal != null
                    ? `${takenByPackage.get(pkg.id) ?? 0}/${pkg.slotsTotal}`
                    : "∞";
                return (
                  <tr key={pkg.id} className="align-middle">
                    <td className="px-4 py-3 text-zinc-500">{pkg.displayOrder}</td>
                    <td className="px-4 py-3 font-medium">{pkg.name}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{pkg.tier}</td>
                    <td className="px-4 py-3">{formatPrice(pkg.priceCents, pkg.currency)}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{slotsLabel}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {benefitCount} item{benefitCount === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {pkg._count.sponsors}
                    </td>
                    <td className="px-4 py-3">
                      <form action={handleToggle}>
                        <input type="hidden" name="id" value={pkg.id} />
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            pkg.isActive
                              ? "bg-green-600/10 text-green-700 hover:bg-green-600/20 dark:text-green-400"
                              : "bg-zinc-200 text-zinc-500 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {pkg.isActive ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/packages/${pkg.id}`}
                          className="text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
                        >
                          Edit
                        </Link>
                        <form action={handleDelete}>
                          <input type="hidden" name="id" value={pkg.id} />
                          <button
                            type="submit"
                            className="text-red-600 underline underline-offset-4 hover:text-red-700 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}