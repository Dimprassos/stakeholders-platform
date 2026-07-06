"use client";

import { useActionState } from "react";
import Link from "next/link";
import { INITIAL_PACKAGE_STATE } from "./types";
import type { PackageFormState } from "./types";

export type PackageFormProps = {
  action: (state: PackageFormState, formData: FormData) => Promise<PackageFormState>;
  packageId?: string;
  initial?: {
    name: string;
    tier: string;
    priceEuros: string;
    currency: string;
    benefits: string; // one per line
    slotsTotal: string;
    displayOrder: string;
    isActive: boolean;
  };
};

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function PackageForm({ action, packageId, initial }: PackageFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_PACKAGE_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {packageId && <input type="hidden" name="id" value={packageId} />}

      {state.message && !state.ok && (
        <p className="rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">
            Package name *
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initial?.name ?? ""}
            className={inputClass}
            required
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="tier">
            Tier *
          </label>
          <input
            id="tier"
            name="tier"
            defaultValue={initial?.tier ?? ""}
            placeholder="PLATINUM"
            className={inputClass}
            required
          />
          {errors.tier && <p className={errorClass}>{errors.tier}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="priceEuros">
            Price (EUR) *
          </label>
          <input
            id="priceEuros"
            name="priceEuros"
            type="text"
            inputMode="decimal"
            defaultValue={initial?.priceEuros ?? ""}
            placeholder="5000"
            className={inputClass}
            required
          />
          {errors.priceEuros && <p className={errorClass}>{errors.priceEuros}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="currency">
            Currency
          </label>
          <input
            id="currency"
            name="currency"
            defaultValue={initial?.currency ?? "EUR"}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="slotsTotal">
            Total slots
          </label>
          <input
            id="slotsTotal"
            name="slotsTotal"
            type="text"
            inputMode="numeric"
            defaultValue={initial?.slotsTotal ?? ""}
            placeholder="Unlimited"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="displayOrder">
            Display order
          </label>
          <input
            id="displayOrder"
            name="displayOrder"
            type="text"
            inputMode="numeric"
            defaultValue={initial?.displayOrder ?? "0"}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="benefits">
          Benefits (one per line)
        </label>
        <textarea
          id="benefits"
          name="benefits"
          rows={6}
          defaultValue={initial?.benefits ?? ""}
          className={inputClass}
          placeholder={"Logo on event website\nSpeaking slot\n5 delegate passes"}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Each line becomes a separate bullet point on the public packages page.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial ? initial.isActive : true}
            className="mt-1"
          />
          <span>Active (visible on the public packages page)</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : packageId ? "Update package" : "Create package"}
        </button>
        <Link
          href="/admin/packages"
          className="rounded-full border border-black/15 px-6 py-2.5 text-sm font-medium transition-colors hover:border-foreground dark:border-white/20"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}