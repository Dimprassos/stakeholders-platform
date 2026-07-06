"use client";

import { useActionState } from "react";
import { submitInterest } from "@/app/become-a-sponsor/actions";
import { INITIAL_SUBMIT_STATE } from "@/app/become-a-sponsor/types";

type PackageOption = { id: string; name: string; tier: string };

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function InterestForm({
  packages,
  defaultPackageId,
}: {
  packages: PackageOption[];
  defaultPackageId?: string;
}) {
  const [state, formAction, pending] = useActionState(submitInterest, INITIAL_SUBMIT_STATE);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-6">
        <h2 className="text-lg font-semibold">Thanks for your interest! 🎉</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {state.message ?? "We've received your details and will be in touch soon."}
        </p>
      </div>
    );
  }

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Honeypot: hidden from users, catches bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {state.message && !state.ok && (
        <p className="rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="companyName">
            Company name *
          </label>
          <input id="companyName" name="companyName" className={inputClass} required />
          {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="contactName">
            Your name *
          </label>
          <input id="contactName" name="contactName" className={inputClass} required />
          {errors.contactName && <p className={errorClass}>{errors.contactName}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            Email *
          </label>
          <input id="email" name="email" type="email" className={inputClass} required />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="packageInterestId">
          Package of interest
        </label>
        <select
          id="packageInterestId"
          name="packageInterestId"
          defaultValue={defaultPackageId ?? ""}
          className={inputClass}
        >
          <option value="">No preference</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="message">
          Message
        </label>
        <textarea id="message" name="message" rows={4} className={inputClass} />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" className="mt-1" />
          <span>
            I agree to be contacted about sponsorship and accept the processing of my data. *
          </span>
        </label>
        {errors.consent && <p className={errorClass}>{errors.consent}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Submit interest"}
      </button>
    </form>
  );
}
