"use client";

import { useActionState } from "react";
import { submitOnboardingAction } from "./actions";
import { INITIAL_ONBOARDING_STATE } from "./types";
import { LIMITS } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function OnboardingForm({
  token,
  initial,
  allowFileUpload = true,
}: {
  token: string;
  allowFileUpload?: boolean;
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
          maxLength={LIMITS.legalName}
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
          maxLength={LIMITS.billingAddress}
          className={inputClass}
          required
        />
        {errors.billingAddress && <p className={errorClass}>{errors.billingAddress}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="vatNumber">
            VAT number / ΑΦΜ
          </label>
          <input
            id="vatNumber"
            name="vatNumber"
            defaultValue={initial?.vatNumber ?? ""}
            maxLength={LIMITS.vatNumber}
            autoCapitalize="characters"
            placeholder="123456789 or EL123456789"
            className={`${inputClass} uppercase placeholder:normal-case`}
          />
          {errors.vatNumber && <p className={errorClass}>{errors.vatNumber}</p>}
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
            maxLength={LIMITS.websiteUrl}
            className={inputClass}
            placeholder="https://example.com"
          />
          {errors.websiteUrl && <p className={errorClass}>{errors.websiteUrl}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={allowFileUpload ? "logoFile" : "logoUrl"}>
          Logo
        </label>
        {allowFileUpload && (
          <>
            <input
              id="logoFile"
              name="logoFile"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-xs file:font-medium file:text-background hover:file:cursor-pointer hover:file:opacity-90 dark:text-zinc-400"
            />
            {errors.logoFile && <p className={errorClass}>{errors.logoFile}</p>}
            <p className="mt-1 text-xs text-zinc-500">
              PNG, JPG or WEBP, up to 2&nbsp;MB — or paste a hosted link below.
            </p>
          </>
        )}
        <input
          id="logoUrl"
          name="logoUrl"
          type="url"
          aria-label="Logo URL (if already hosted online)"
          defaultValue={initial?.logoUrl ?? ""}
          className={`${inputClass} ${allowFileUpload ? "mt-2" : "mt-1"}`}
          placeholder="https://example.com/logo.png"
        />
        {errors.logoUrl && <p className={errorClass}>{errors.logoUrl}</p>}
        {!allowFileUpload && (
          <p className="mt-1 text-xs text-zinc-500">
            Paste a hosted PNG, JPG or WEBP logo URL. Direct uploads are disabled
            on the production deployment until object storage is connected.
          </p>
        )}
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
          maxLength={LIMITS.description}
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
