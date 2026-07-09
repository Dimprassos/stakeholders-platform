export const PUBLIC_THEME_ROOT_ID = "public-theme-root";
export const SITE_THEME_STORAGE_KEY = "stakeholders-site-theme";

// The admin CMS gets its own independent theme preference (same 3 options),
// stored separately so it never collides with a visitor's public-site choice.
export const ADMIN_THEME_ROOT_ID = "admin-theme-root";
export const ADMIN_THEME_STORAGE_KEY = "stakeholders-admin-theme";

export const SITE_THEME_OPTIONS = [
  {
    value: "system",
    label: "System",
    description: "Follow this device.",
  },
  {
    value: "light",
    label: "Light",
    description: "Warm Athens light.",
    dataTheme: "light",
    colors: {
      background: "#fbf7ee",
      foreground: "#111827",
      brand: "#93c5fd",
      brandInk: "#0f172a",
      brandAccent: "#2563eb",
    },
  },
  {
    value: "dark",
    label: "Dark",
    description: "Deep conference dark.",
    dataTheme: "dark",
    colors: {
      background: "#080b12",
      foreground: "#f8fafc",
      brand: "#fbbf24",
      brandInk: "#1c1917",
      brandAccent: "#fbbf24",
    },
  },
] as const;

export type SiteThemeValue = (typeof SITE_THEME_OPTIONS)[number]["value"];

export function findSiteTheme(value: string) {
  return SITE_THEME_OPTIONS.find((theme) => theme.value === value);
}

export function isSiteThemeValue(value: string | null): value is SiteThemeValue {
  return !!value && SITE_THEME_OPTIONS.some((theme) => theme.value === value);
}
