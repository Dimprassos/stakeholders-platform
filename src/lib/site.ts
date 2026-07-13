/**
 * Canonical site constants used across metadata, robots, sitemap and the main
 * site chrome (header/footer).
 *
 * These describe the *platform / organizer*, not any single event — the main
 * site spans every event. Per-event branding (name, logo, theme) lives on the
 * Event record and is used by /events/[slug]. Set these in `.env` / Vercel.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Stakeholders";

/** Optional logo for the main site header (path or absolute URL). */
export const SITE_LOGO_URL = process.env.NEXT_PUBLIC_SITE_LOGO_URL ?? null;

export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  "Explore sponsorship packages across our events and meet the partners behind them.";
