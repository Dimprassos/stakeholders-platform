/**
 * Canonical site constants used across metadata, robots and sitemap.
 * `NEXT_PUBLIC_SITE_URL` should be set to the production origin (no trailing
 * slash) in prod; falls back to localhost for dev.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
export const SITE_NAME = "Stakeholders Summit 2026";
export const SITE_DESCRIPTION =
  "Explore sponsor packages and meet the partners behind Stakeholders Summit 2026.";
