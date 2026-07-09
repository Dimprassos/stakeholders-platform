"use client";

import { useActionState, useState } from "react";
import { updateEventAction } from "./actions";
import { INITIAL_UPDATE_EVENT_STATE } from "./types";
import {
  CORE_THEME_OPTIONS,
  EVENT_THEME_PRESETS,
  findThemePreset,
} from "@/lib/theme-presets";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";
const sectionClass = "space-y-5 rounded-xl border border-black/10 p-6 dark:border-white/10";
const sectionTitleClass = "text-sm font-semibold uppercase tracking-wide text-zinc-500";

export type EventFormInitial = {
  name: string;
  tagline: string;
  startDate: string;
  endDate: string;
  venue: string;
  mapUrl: string;
  currency: string;
  language: string;
  websiteUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  faqText: string;
  deadlinesText: string;
  termsText: string;
  privacyText: string;
  cancellationText: string;
  themeMode: string;
  brandColor: string;
  brandInkColor: string;
  brandAccentColor: string;
  logoUrl: string;
  bannerUrl: string;
};

function ImageField({
  label,
  fileField,
  urlField,
  currentUrl,
  allowFileUpload,
  error,
}: {
  label: string;
  fileField: string;
  urlField: string;
  currentUrl: string;
  allowFileUpload: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={allowFileUpload ? fileField : urlField}>
        {label}
      </label>
      {allowFileUpload && (
        <input
          id={fileField}
          name={fileField}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-xs file:font-medium file:text-background hover:file:cursor-pointer hover:file:opacity-90 dark:text-zinc-400"
        />
      )}
      <input
        id={urlField}
        name={urlField}
        type="url"
        defaultValue={currentUrl}
        placeholder="https://example.com/image.png"
        className={`${inputClass} ${allowFileUpload ? "mt-2" : "mt-1"}`}
      />
      {!allowFileUpload && (
        <p className="mt-1 text-xs text-zinc-500">
          Paste a hosted image URL. Direct uploads are disabled in production until
          object storage is connected.
        </p>
      )}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

export function EventForm({
  eventId,
  initial,
  allowFileUpload = true,
}: {
  eventId: string;
  initial: EventFormInitial;
  allowFileUpload?: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateEventAction, INITIAL_UPDATE_EVENT_STATE);
  const errors = state.errors ?? {};
  const [themeMode, setThemeMode] = useState(initial.themeMode);
  const [brandColor, setBrandColor] = useState(initial.brandColor);
  const [brandInkColor, setBrandInkColor] = useState(initial.brandInkColor);
  const [brandAccentColor, setBrandAccentColor] = useState(initial.brandAccentColor);
  const selectedPreset = findThemePreset(themeMode);

  function applyPreset(preset: (typeof EVENT_THEME_PRESETS)[number]) {
    setThemeMode(preset.value);
    setBrandColor(preset.colors.brand);
    setBrandInkColor(preset.colors.brandInk);
    setBrandAccentColor(preset.colors.brandAccent);
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="eventId" value={eventId} />

      {state.message && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-green-600/30 bg-green-600/5 text-green-700 dark:text-green-400"
              : "border-red-600/30 bg-red-600/5 text-red-700 dark:text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Identity</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="name">
              Event name *
            </label>
            <input id="name" name="name" defaultValue={initial.name} className={inputClass} required />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="tagline">
              Tagline
            </label>
            <input id="tagline" name="tagline" defaultValue={initial.tagline} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="startDate">
              Start date
            </label>
            <input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="endDate">
              End date
            </label>
            <input id="endDate" name="endDate" type="date" defaultValue={initial.endDate} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="venue">
              Venue
            </label>
            <input id="venue" name="venue" defaultValue={initial.venue} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="mapUrl">
              Venue map URL
            </label>
            <input id="mapUrl" name="mapUrl" type="url" defaultValue={initial.mapUrl} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="currency">
              Currency
            </label>
            <input id="currency" name="currency" defaultValue={initial.currency} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="language">
              Language (e.g. en, el)
            </label>
            <input id="language" name="language" defaultValue={initial.language} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Social &amp; website</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="websiteUrl">
              Website
            </label>
            <input id="websiteUrl" name="websiteUrl" type="url" defaultValue={initial.websiteUrl} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="twitterUrl">
              X / Twitter
            </label>
            <input id="twitterUrl" name="twitterUrl" type="url" defaultValue={initial.twitterUrl} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="linkedinUrl">
              LinkedIn
            </label>
            <input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={initial.linkedinUrl} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="instagramUrl">
              Instagram
            </label>
            <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={initial.instagramUrl} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="facebookUrl">
              Facebook
            </label>
            <input id="facebookUrl" name="facebookUrl" type="url" defaultValue={initial.facebookUrl} className={inputClass} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Content</h2>
        <div>
          <label className={labelClass} htmlFor="deadlinesText">
            Key dates (one per line: <code>Label :: YYYY-MM-DD</code>)
          </label>
          <textarea
            id="deadlinesText"
            name="deadlinesText"
            rows={4}
            defaultValue={initial.deadlinesText}
            placeholder={"Early bird deadline :: 2026-08-01\nRegistration closes :: 2026-10-15"}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="faqText">
            FAQ (one per line: <code>Question :: Answer</code>)
          </label>
          <textarea
            id="faqText"
            name="faqText"
            rows={6}
            defaultValue={initial.faqText}
            placeholder={"Is there a dress code? :: Business casual.\nCan I bring a guest? :: Yes, one +1 per pass."}
            className={inputClass}
          />
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Policies</h2>
        <div>
          <label className={labelClass} htmlFor="termsText">
            Terms of participation
          </label>
          <textarea id="termsText" name="termsText" rows={4} defaultValue={initial.termsText} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="privacyText">
            Privacy policy
          </label>
          <textarea id="privacyText" name="privacyText" rows={4} defaultValue={initial.privacyText} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="cancellationText">
            Cancellation policy
          </label>
          <textarea
            id="cancellationText"
            name="cancellationText"
            rows={4}
            defaultValue={initial.cancellationText}
            className={inputClass}
          />
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Branding</h2>
        <div>
          <label className={labelClass} htmlFor="themeMode">
            Theme
          </label>
          <select
            id="themeMode"
            name="themeMode"
            value={themeMode}
            onChange={(e) => {
              const next = e.target.value;
              setThemeMode(next);
              const preset = findThemePreset(next);
              if (preset) {
                setBrandColor(preset.colors.brand);
                setBrandInkColor(preset.colors.brandInk);
                setBrandAccentColor(preset.colors.brandAccent);
              }
            }}
            className={inputClass}
          >
            <optgroup label="Base modes">
              {CORE_THEME_OPTIONS.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label} — {theme.description}
                </option>
              ))}
            </optgroup>
            <optgroup label="Event presets">
              {EVENT_THEME_PRESETS.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </optgroup>
          </select>
          {errors.themeMode && <p className={errorClass}>{errors.themeMode}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {EVENT_THEME_PRESETS.map((preset) => {
            const selected = preset.value === themeMode;
            return (
              <button
                key={preset.value}
                type="button"
                aria-pressed={selected}
                onClick={() => applyPreset(preset)}
                style={{
                  backgroundColor: preset.colors.background,
                  color: preset.colors.foreground,
                  borderColor: selected ? preset.colors.brandAccent : undefined,
                }}
                className="rounded-lg border border-black/10 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm aria-pressed:ring-2 aria-pressed:ring-brand-accent"
              >
                <span className="flex gap-1">
                  <span
                    aria-hidden
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.colors.brand }}
                  />
                  <span
                    aria-hidden
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.colors.brandAccent }}
                  />
                  <span
                    aria-hidden
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.colors.foreground }}
                  />
                </span>
                <span className="mt-3 block text-sm font-semibold">{preset.label}</span>
                <span className="mt-1 block text-xs opacity-75">{preset.description}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="brandColor">
              Brand color
            </label>
            <input
              id="brandColor"
              name="brandColor"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#f59e0b"
              className={inputClass}
            />
            {errors.brandColor && <p className={errorClass}>{errors.brandColor}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="brandInkColor">
              Brand ink (text on brand)
            </label>
            <input
              id="brandInkColor"
              name="brandInkColor"
              value={brandInkColor}
              onChange={(e) => setBrandInkColor(e.target.value)}
              placeholder="#1c1917"
              className={inputClass}
            />
            {errors.brandInkColor && <p className={errorClass}>{errors.brandInkColor}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="brandAccentColor">
              Brand accent
            </label>
            <input
              id="brandAccentColor"
              name="brandAccentColor"
              value={brandAccentColor}
              onChange={(e) => setBrandAccentColor(e.target.value)}
              placeholder="#b45309"
              className={inputClass}
            />
            {errors.brandAccentColor && <p className={errorClass}>{errors.brandAccentColor}</p>}
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Custom colors apply when Theme = Custom. Presets fill these colors as a
          starting point; the saved preset controls the public palette.
          {selectedPreset ? ` Current preset: ${selectedPreset.label}.` : ""}
        </p>

        <ImageField
          label="Logo"
          fileField="logoFile"
          urlField="logoUrl"
          currentUrl={initial.logoUrl}
          allowFileUpload={allowFileUpload}
          error={errors.logoFile}
        />
        <ImageField
          label="Banner / hero image"
          fileField="bannerFile"
          urlField="bannerUrl"
          currentUrl={initial.bannerUrl}
          allowFileUpload={allowFileUpload}
          error={errors.bannerFile}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
