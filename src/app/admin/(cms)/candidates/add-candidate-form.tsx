"use client";

import { useActionState, useState } from "react";
import { addCandidateAction } from "./actions";
import { INITIAL_CANDIDATE_STATE } from "./types";
import type { PackageOption } from "./page";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function AddCandidateForm({ packages }: { packages: PackageOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addCandidateAction,
    INITIAL_CANDIDATE_STATE,
  );
  const errors = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-4">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          {state.message}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 text-xs underline underline-offset-4"
        >
          Add another
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Add candidate
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-black/10 p-5 dark:border-white/10" noValidate>
      {state.message && (
        <p className="rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium">
            Company name *
          </label>
          <input id="companyName" name="companyName" className={inputClass} required />
          {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
        </div>

        <div>
          <label htmlFor="contactName" className="block text-sm font-medium">
            Contact name
          </label>
          <input id="contactName" name="contactName" className={inputClass} />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium">
            Contact email
          </label>
          <input id="contactEmail" name="contactEmail" type="email" className={inputClass} />
          {errors.contactEmail && <p className={errorClass}>{errors.contactEmail}</p>}
        </div>

        <div>
          <label htmlFor="packageId" className="block text-sm font-medium">
            Assign package
          </label>
          <select id="packageId" name="packageId" className={inputClass} defaultValue="">
            <option value="">No package</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.tier}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add candidate"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium transition-colors hover:border-foreground dark:border-white/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}