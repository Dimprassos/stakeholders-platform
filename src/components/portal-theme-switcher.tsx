"use client";

import { useEffect, useRef } from "react";
import {
  findSiteTheme,
  isSiteThemeValue,
  PORTAL_THEME_ROOT_ID,
  SITE_THEME_OPTIONS,
  SITE_THEME_STORAGE_KEY,
  type SiteThemeValue,
} from "@/lib/site-themes";

// Mirrors src/components/site-theme-switcher.tsx (same 3 options + apply logic,
// including re-applying the event's custom brand on "system"), but targets the
// sponsor portal's theme root. It shares SITE_THEME_STORAGE_KEY so a sponsor's
// light/dark choice is consistent between the public site and their portal.

const THEME_VARS = [
  "--background",
  "--foreground",
  "--brand",
  "--brand-ink",
  "--brand-accent",
] as const;

function getRoot(): HTMLElement | null {
  return document.getElementById(PORTAL_THEME_ROOT_ID);
}

function systemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function restoreSystemTheme(root: HTMLElement) {
  root.dataset.theme = systemTheme();

  const eventVars: Partial<Record<(typeof THEME_VARS)[number], string | undefined>> = {
    "--brand": root.dataset.eventBrand,
    "--brand-ink": root.dataset.eventBrandInk,
    "--brand-accent": root.dataset.eventBrandAccent,
  };

  for (const name of THEME_VARS) {
    const value = eventVars[name];
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
}

function applyPortalTheme(themeValue: SiteThemeValue) {
  const root = getRoot();
  if (!root) return;
  root.dataset.userTheme = themeValue;

  if (themeValue === "system") {
    restoreSystemTheme(root);
    return;
  }

  const theme = findSiteTheme(themeValue);
  if (!theme || !("colors" in theme)) {
    restoreSystemTheme(root);
    return;
  }

  root.dataset.theme = theme.dataTheme;
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--brand", theme.colors.brand);
  root.style.setProperty("--brand-ink", theme.colors.brandInk);
  root.style.setProperty("--brand-accent", theme.colors.brandAccent);
}

function getStoredTheme(): SiteThemeValue {
  try {
    const stored = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
    return isSiteThemeValue(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function storeTheme(theme: SiteThemeValue) {
  try {
    if (theme === "system") window.localStorage.removeItem(SITE_THEME_STORAGE_KEY);
    else window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures; the current page can still update visually.
  }
}

export function PortalThemeSwitcher() {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    if (selectRef.current) selectRef.current.value = stored;
    applyPortalTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getStoredTheme() === "system") applyPortalTheme("system");
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Portal theme</span>
      <select
        ref={selectRef}
        defaultValue="system"
        onChange={(event) => {
          const next = event.currentTarget.value;
          const theme = isSiteThemeValue(next) ? next : "system";
          storeTheme(theme);
          applyPortalTheme(theme);
        }}
        className="rounded-full border border-black/15 bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-brand-accent focus:border-brand-accent dark:border-white/20"
        aria-label="Portal theme"
      >
        {SITE_THEME_OPTIONS.map((theme) => (
          <option key={theme.value} value={theme.value}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  );
}
