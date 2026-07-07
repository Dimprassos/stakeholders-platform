/**
 * Canonical site constants used across metadata, robots and sitemap.
 * `NEXT_PUBLIC_SITE_URL` should be set to the production origin (no trailing
 * slash) in prod; falls back to localhost for dev.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "Sponsorship Platform";
export const SITE_DESCRIPTION =
  "Present sponsorship packages, reach out to sponsors, and showcase partners.";
