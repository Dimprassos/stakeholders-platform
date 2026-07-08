import { PackageForm } from "../package-form";
import { createPackageAction } from "../actions";
import { getAdminEvent } from "@/lib/event";

export const dynamic = "force-dynamic";
export const metadata = { title: "New package" };

export default async function NewPackagePage() {
  const event = await getAdminEvent();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New package</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add a sponsorship tier.
        </p>
      </div>
      <PackageForm
        action={createPackageAction}
        initial={{
          name: "",
          tier: "",
          priceEuros: "",
          currency: event?.currency ?? "EUR",
          benefits: "",
          slotsTotal: "",
          displayOrder: "0",
          isActive: true,
        }}
      />
    </div>
  );
}