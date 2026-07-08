/**
 * Shared, framework-agnostic input validation & normalization for the public
 * interest form and the sponsor onboarding form. Keep these lenient enough for
 * international users but strict enough to reject obvious garbage.
 */

// ---- Length caps (server-enforced; mirrored as maxLength on inputs) ----
export const LIMITS = {
  companyName: 120,
  contactName: 120,
  email: 254, // RFC 5321
  phone: 24, // raw, formatted; digit count checked separately
  message: 2000,
  legalName: 160,
  billingAddress: 300,
  vatNumber: 20,
  websiteUrl: 300,
  description: 600,
} as const;

// ---- Phone (international-friendly, E.164-ish) ----

/** Strip formatting to a compact `+<digits>` / `<digits>` form for storage. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/** Empty is allowed (optional). Otherwise: an optional +, then 7–15 digits. */
export function isValidPhone(raw: string): boolean {
  const v = raw.trim();
  if (!v) return true;
  if (!/^\+?[\d\s().\-]{6,24}$/.test(v)) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

// ---- VAT / ΑΦΜ (Greek checksum, or generic EU format) ----

/** Uppercase and drop spaces / dots / dashes. */
export function normalizeVat(raw: string): string {
  return raw.toUpperCase().replace(/[\s.\-]/g, "");
}

/** Official Greek ΑΦΜ (TIN) modulo-11 checksum over the first 8 digits. */
export function isValidGreekAfm(afm: string): boolean {
  if (!/^\d{9}$/.test(afm) || afm === "000000000") return false;
  const d = afm.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += d[i] * 2 ** (8 - i);
  return (sum % 11) % 10 === d[8];
}

/**
 * Empty is allowed (optional). A bare 9-digit number or an `EL`/`GR` prefixed
 * one is validated with the Greek ΑΦΜ checksum; any other 2-letter country
 * prefix is accepted on format alone (generic EU VAT).
 */
export function isValidVat(raw: string): boolean {
  const v = normalizeVat(raw);
  if (!v) return true;
  if (/^\d{9}$/.test(v)) return isValidGreekAfm(v);
  const m = /^([A-Z]{2})([A-Z0-9]{2,12})$/.exec(v);
  if (!m) return false;
  const [, country, body] = m;
  if (country === "EL" || country === "GR") {
    return isValidGreekAfm(body);
  }
  return true;
}
