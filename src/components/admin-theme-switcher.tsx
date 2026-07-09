"use client";

import { useEffect, useRef } from "react";
import {
  findSiteTheme,
  isSiteThemeValue,
  ADMIN_THEME_ROOT_ID,
  ADMIN_THEME_STORAGE_KEY,
  SITE_THEME_OPTIONS,
  type SiteThemeValue,
} from "@/lib/site-themes";

// Mirrors src/components/site-theme-switcher.tsx (same 3 options + apply logic),
// but targets the admin theme root and its own localStorage key so the CMS and
// the public site keep independent theme preferences.

const THEME_VARS = [
  "--background",
  "--foreground",
  "--brand",
  "--brand-ink",
  "--brand-accent",
] as const;

function getRoot(): HTMLElement | null {
  return document.getElementById(ADMIN_THEME_ROOT_ID);
}

function systemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyAdminTheme(themeValue: SiteThemeValue) {
  const root = getRoot();
  if (!root) return;
  root.dataset.userTheme = themeValue;

  const theme = themeValue === "system" ? undefined : findSiteTheme(themeValue);
  if (!theme || !("colors" in theme)) {
    // System (or unknown) → follow the device and drop any inline overrides.
    root.dataset.theme = systemTheme();
    for (const name of THEME_VARS) root.style.removeProperty(name);
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
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    return isSiteThemeValue(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function storeTheme(theme: SiteThemeValue) {
  try {
    if (theme === "system") window.localStorage.removeItem(ADMIN_THEME_STORAGE_KEY);
    else window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures; the current page can still update visually.
  }
}

export function AdminThemeSwitcher() {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    if (selectRef.current) selectRef.current.value = stored;
    applyAdminTheme(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getStoredTheme() === "system") applyAdminTheme("system");
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Admin theme</span>
      <select
        ref={selectRef}
        defaultValue="system"
        onChange={(event) => {
          const next = event.currentTarget.value;
          const theme = isSiteThemeValue(next) ? next : "system";
          storeTheme(theme);
          applyAdminTheme(theme);
        }}
        className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs outline-none transition-colors hover:border-foreground dark:border-white/20"
        aria-label="Admin theme"
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
