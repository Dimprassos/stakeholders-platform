export const PUBLIC_THEME_ROOT_ID = "public-theme-root";
export const SITE_THEME_STORAGE_KEY = "stakeholders-site-theme";

export const SITE_THEME_OPTIONS = [
  {
    value: "system",
    label: "System",
    description: "Use the event/default theme.",
  },
  {
    value: "light",
    label: "Light",
    description: "Clean white background.",
    dataTheme: "light",
    colors: {
      background: "#ffffff",
      foreground: "#171717",
      brand: "#f59e0b",
      brandInk: "#1c1917",
      brandAccent: "#b45309",
    },
  },
  {
    value: "dark",
    label: "Dark",
    description: "High-contrast dark mode.",
    dataTheme: "dark",
    colors: {
      background: "#0a0a0a",
      foreground: "#ededed",
      brand: "#f59e0b",
      brandInk: "#1c1917",
      brandAccent: "#fbbf24",
    },
  },
  {
    value: "gold",
    label: "Gold",
    description: "Warm event gold.",
    dataTheme: "site-gold",
    colors: {
      background: "#fffdf7",
      foreground: "#1c1917",
      brand: "#f59e0b",
      brandInk: "#1c1917",
      brandAccent: "#b45309",
    },
  },
  {
    value: "teal",
    label: "Teal",
    description: "Fresh Mediterranean teal.",
    dataTheme: "site-teal",
    colors: {
      background: "#f7fffb",
      foreground: "#10201f",
      brand: "#14b8a6",
      brandInk: "#052f2b",
      brandAccent: "#0f766e",
    },
  },
  {
    value: "ruby",
    label: "Ruby",
    description: "Strong sponsor CTA red.",
    dataTheme: "site-ruby",
    colors: {
      background: "#fff8f7",
      foreground: "#241312",
      brand: "#e11d48",
      brandInk: "#fff1f2",
      brandAccent: "#be123c",
    },
  },
  {
    value: "emerald",
    label: "Emerald",
    description: "Polished business green.",
    dataTheme: "site-emerald",
    colors: {
      background: "#f7fdf9",
      foreground: "#102016",
      brand: "#22c55e",
      brandInk: "#052e16",
      brandAccent: "#15803d",
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
