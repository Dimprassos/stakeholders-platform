"use client";

import { useActionState } from "react";
import { submitOnboardingAction } from "./actions";
import { INITIAL_ONBOARDING_STATE, type OnboardingState } from "./types";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function OnboardingForm({
  token,
  initial,
}: {
  token: string;
  initial?: {
    legalName: string;
    billingAddress: string;
    vatNumber: string;
    websiteUrl: string;
    logoUrl: string;
    description: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    submitOnboardingAction,
    INITIAL_ONBOARDING_STATE,
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="token" value={token} />

      {state.message && (
        <p className="rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="legalName">
          Legal name *
        </label>
        <input
          id="legalName"
          name="legalName"
          defaultValue={initial?.legalName ?? ""}
          className={inputClass}
          required
        />
        {errors.legalName && <p className={errorClass}>{errors.legalName}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="billingAddress">
          Billing address *
        </label>
        <textarea
          id="billingAddress"
          name="billingAddress"
          rows={3}
          defaultValue={initial?.billingAddress ?? ""}
          className={inputClass}
          required
        />
        {errors.billingAddress && <p className={errorClass}>{errors.billingAddress}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="vatNumber">
            VAT number
          </label>
          <input
            id="vatNumber"
            name="vatNumber"
            defaultValue={initial?.vatNumber ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="websiteUrl">
            Website
          </label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={initial?.websiteUrl ?? ""}
            className={inputClass}
            placeholder="https://example.com"
          />
          {errors.websiteUrl && <p className={errorClass}>{errors.websiteUrl}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="logoUrl">
          Logo URL
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={initial?.logoUrl ?? ""}
          className={inputClass}
          placeholder="https://example.com/logo.png"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Paste a URL to your logo. (Direct file upload arrives in a later phase.)
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Short description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="isHiddenFromPublic" className="mt-1" />
          <span>
            Hide me from the public sponsors page (the organizers will still see my
            details)
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit onboarding details"}
      </button>
    </form>
  );
}