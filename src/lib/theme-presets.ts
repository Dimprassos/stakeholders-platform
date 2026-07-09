export const CORE_THEME_OPTIONS = [
  {
    value: "AUTO",
    label: "Auto",
    description: "Matches the visitor's device.",
  },
  {
    value: "LIGHT",
    label: "Light",
    description: "Forces the clean light palette.",
  },
  {
    value: "DARK",
    label: "Dark",
    description: "Forces the high-contrast dark palette.",
  },
  {
    value: "CUSTOM",
    label: "Custom colors",
    description: "Uses the color fields below.",
  },
] as const;

export const EVENT_THEME_PRESETS = [
  {
    value: "PRESET_SUMMIT_GOLD",
    dataTheme: "summit-gold",
    label: "Summit Gold",
    description: "Warm, premium and close to the current brand.",
    colors: {
      background: "#fffdf7",
      foreground: "#1c1917",
      brand: "#f59e0b",
      brandInk: "#1c1917",
      brandAccent: "#b45309",
    },
  },
  {
    value: "PRESET_AEGEAN_TEAL",
    dataTheme: "aegean-teal",
    label: "Aegean Teal",
    description: "Fresh, confident and Mediterranean without feeling casual.",
    colors: {
      background: "#f7fffb",
      foreground: "#10201f",
      brand: "#14b8a6",
      brandInk: "#052f2b",
      brandAccent: "#0f766e",
    },
  },
  {
    value: "PRESET_EXECUTIVE_RED",
    dataTheme: "executive-red",
    label: "Executive Red",
    description: "Direct, energetic and strong for sponsor calls to action.",
    colors: {
      background: "#fff8f7",
      foreground: "#241312",
      brand: "#e11d48",
      brandInk: "#fff1f2",
      brandAccent: "#be123c",
    },
  },
  {
    value: "PRESET_EMERALD_HALL",
    dataTheme: "emerald-hall",
    label: "Emerald Hall",
    description: "Trustworthy, polished and business-friendly.",
    colors: {
      background: "#f7fdf9",
      foreground: "#102016",
      brand: "#22c55e",
      brandInk: "#052e16",
      brandAccent: "#15803d",
    },
  },
  {
    value: "PRESET_ELECTRIC_LIME",
    dataTheme: "electric-lime",
    label: "Electric Lime",
    description: "Modern, tech-forward and still readable.",
    colors: {
      background: "#fbfff1",
      foreground: "#172006",
      brand: "#a3e635",
      brandInk: "#1a2e05",
      brandAccent: "#4d7c0f",
    },
  },
] as const;

export const THEME_MODE_VALUES = [
  ...CORE_THEME_OPTIONS.map((theme) => theme.value),
  ...EVENT_THEME_PRESETS.map((theme) => theme.value),
] as const;

export type ThemeModeValue = (typeof THEME_MODE_VALUES)[number];

export function isThemeModeValue(value: string): value is ThemeModeValue {
  return THEME_MODE_VALUES.includes(value as ThemeModeValue);
}

export function findThemePreset(value: string) {
  return EVENT_THEME_PRESETS.find((preset) => preset.value === value);
}

export function themeDataAttribute(themeMode: string): string | undefined {
  if (themeMode === "LIGHT") return "light";
  if (themeMode === "DARK") return "dark";
  return findThemePreset(themeMode)?.dataTheme;
}
