"use client";

import { useActionState, useState } from "react";
import { submitInterest } from "@/lib/interest/actions";
import { INITIAL_SUBMIT_STATE } from "@/lib/interest/types";
import { LIMITS } from "@/lib/validation";

type PackageOption = { id: string; name: string; tier: string; eventSlug?: string };
type EventOption = { slug: string; name: string };

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function InterestForm({
  packages,
  defaultPackageId,
  eventSlug,
  events,
}: {
  packages: PackageOption[];
  defaultPackageId?: string;
  /** Fixed event (per-event pages) — submitted as a hidden field, no picker. */
  eventSlug?: string;
  /** All selectable events (main site). With more than one, the visitor picks. */
  events?: EventOption[];
}) {
  const [state, formAction, pending] = useActionState(submitInterest, INITIAL_SUBMIT_STATE);

  // On a multi-event site the generic form must not silently target the default
  // event: the visitor picks the event, and the package list narrows to it.
  // With a single event (or a fixed one) nothing extra is shown.
  const showEventPicker = !eventSlug && (events?.length ?? 0) > 1;
  const [selectedEvent, setSelectedEvent] = useState(
    packages.find((p) => p.id === defaultPackageId)?.eventSlug ?? events?.[0]?.slug ?? "",
  );
  const [selectedPackage, setSelectedPackage] = useState(defaultPackageId ?? "");
  const visiblePackages = showEventPicker
    ? packages.filter((p) => p.eventSlug === selectedEvent)
    : packages;

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
      {eventSlug && <input type="hidden" name="eventSlug" value={eventSlug} />}
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
          <input
            id="companyName"
            name="companyName"
            maxLength={LIMITS.companyName}
            className={inputClass}
            required
          />
          {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="contactName">
            Your name *
          </label>
          <input
            id="contactName"
            name="contactName"
            maxLength={LIMITS.contactName}
            className={inputClass}
            required
          />
          {errors.contactName && <p className={errorClass}>{errors.contactName}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={LIMITS.email}
            className={inputClass}
            required
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={LIMITS.phone}
            placeholder="+30 69XXXXXXXX"
            className={inputClass}
          />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>
      </div>

      {showEventPicker && (
        <div>
          <label className={labelClass} htmlFor="eventSlug">
            Which event? *
          </label>
          <select
            id="eventSlug"
            name="eventSlug"
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setSelectedPackage("");
            }}
            className={inputClass}
          >
            {events?.map((ev) => (
              <option key={ev.slug} value={ev.slug}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="packageInterestId">
          Package of interest
        </label>
        <select
          id="packageInterestId"
          name="packageInterestId"
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className={inputClass}
        >
          <option value="">No preference</option>
          {visiblePackages.map((p) => (
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
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={LIMITS.message}
          className={inputClass}
        />
        {errors.message && <p className={errorClass}>{errors.message}</p>}
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
        className="btn-brand rounded-full bg-brand px-6 py-3 text-sm font-medium text-brand-ink disabled:opacity-50"
      >
        {pending ? "Sending…" : "Submit interest"}
      </button>
    </form>
  );
}
