export const PUBLIC_THEME_ROOT_ID = "public-theme-root";
export const SITE_THEME_STORAGE_KEY = "stakeholders-site-theme";

// The sponsor portal is visitor-facing like the public site, so it reuses the
// same theme options and shares SITE_THEME_STORAGE_KEY (one sponsor-facing
// light/dark preference across the public site and the portal). It only needs
// its own root id because it renders in a separate layout tree.
export const PORTAL_THEME_ROOT_ID = "portal-theme-root";

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
    // Must stay in sync with `[data-theme="light"]` in globals.css — the
    // switcher writes these as inline vars, which win over the stylesheet.
    colors: {
      background: "#fbf7ee",
      foreground: "#111827",
      brand: "#2563eb",
      brandInk: "#ffffff",
      brandAccent: "#1d4ed8",
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
