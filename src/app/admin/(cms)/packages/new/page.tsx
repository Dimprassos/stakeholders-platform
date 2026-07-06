import { PackageForm } from "../package-form";
import { createPackageAction } from "../actions";

export const metadata = { title: "New package" };

export default function NewPackagePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New package</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add a sponsorship tier.
        </p>
      </div>
      <PackageForm action={createPackageAction} />
    </div>
  );
}