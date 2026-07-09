"use client";

import { useActionState, useState } from "react";
import { submitOnboardingAction } from "./actions";
import { INITIAL_ONBOARDING_STATE, type OnboardingValues } from "./types";
import { getVatValidationError, LIMITS, normalizeVat } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";
const hintClass = "mt-1 text-xs text-zinc-500";

function toInitialValues(initial: OnboardingFormProps["initial"]): OnboardingValues {
  return {
    legalName: initial?.legalName ?? "",
    billingAddress: initial?.billingAddress ?? "",
    vatNumber: initial?.vatNumber ?? "",
    websiteUrl: initial?.websiteUrl ?? "",
    logoUrl: initial?.logoUrl ?? "",
    description: initial?.description ?? "",
    isHiddenFromPublic: initial?.isHiddenFromPublic ?? false,
  };
}

type OnboardingFormProps = {
  token: string;
  allowFileUpload?: boolean;
  initial?: {
    legalName: string;
    billingAddress: string;
    vatNumber: string;
    websiteUrl: string;
    logoUrl: string;
    description: string;
    isHiddenFromPublic?: boolean;
  };
};

export function OnboardingForm({
  token,
  initial,
  allowFileUpload = true,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(
    submitOnboardingAction,
    INITIAL_ONBOARDING_STATE,
  );
  const [values, setValues] = useState<OnboardingValues>(() =>
    toInitialValues(initial),
  );
  const errors = state.errors ?? {};
  const vatFormatError = getVatValidationError(values.vatNumber);
  const vatServerError = errors.vatNumber;
  const vatNormalized = normalizeVat(values.vatNumber);
  const showVatFeedback = values.vatNumber.trim().length > 0;

  function setValue<K extends keyof OnboardingValues>(
    key: K,
    value: OnboardingValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

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
          value={values.legalName}
          onChange={(e) => setValue("legalName", e.target.value)}
          maxLength={LIMITS.legalName}
          className={inputClass}
          required
          aria-invalid={!!errors.legalName}
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
          value={values.billingAddress}
          onChange={(e) => setValue("billingAddress", e.target.value)}
          maxLength={LIMITS.billingAddress}
          className={inputClass}
          required
          aria-invalid={!!errors.billingAddress}
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
            value={values.vatNumber}
            onChange={(e) => setValue("vatNumber", e.target.value)}
            maxLength={LIMITS.vatNumber}
            autoCapitalize="characters"
            placeholder="123456789 or EL123456789"
            className={`${inputClass} uppercase placeholder:normal-case`}
            aria-invalid={!!(vatServerError || vatFormatError)}
            aria-describedby="vatNumberFeedback"
          />
          <p
            id="vatNumberFeedback"
            className={
              vatServerError || vatFormatError
                ? errorClass
                : showVatFeedback
                  ? "mt-1 text-xs text-green-700 dark:text-green-400"
                  : hintClass
            }
          >
            {vatServerError ??
              vatFormatError ??
              (showVatFeedback
                ? `Looks OK. We'll store it as ${vatNormalized}.`
                : "Optional. We accept format-valid VAT/TIN values for organizer review.")}
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="websiteUrl">
            Website
          </label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            value={values.websiteUrl}
            onChange={(e) => setValue("websiteUrl", e.target.value)}
            maxLength={LIMITS.websiteUrl}
            className={inputClass}
            placeholder="https://example.com"
            aria-invalid={!!errors.websiteUrl}
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
          value={values.logoUrl}
          onChange={(e) => setValue("logoUrl", e.target.value)}
          className={`${inputClass} ${allowFileUpload ? "mt-2" : "mt-1"}`}
          placeholder="https://example.com/logo.png"
          aria-invalid={!!errors.logoUrl}
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
          value={values.description}
          onChange={(e) => setValue("description", e.target.value)}
          maxLength={LIMITS.description}
          className={inputClass}
        />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="isHiddenFromPublic"
            checked={values.isHiddenFromPublic}
            onChange={(e) => setValue("isHiddenFromPublic", e.target.checked)}
            className="mt-1"
          />
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
