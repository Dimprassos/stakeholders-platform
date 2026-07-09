import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentEvent } from "@/lib/event";
import { customBrandVars } from "@/lib/event-content";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const event = await getCurrentEvent();
  const themeMode = event?.themeMode ?? "AUTO";
  // AUTO (default) respects the visitor's OS/browser preference — unchanged
  // from before Phase B. LIGHT/DARK force the palette via `data-theme` +
  // globals.css only when an organizer deliberately picks one; CUSTOM keeps
  // AUTO's light/dark behavior but overrides the brand accent colors.
  const dataTheme = themeMode === "DARK" ? "dark" : themeMode === "LIGHT" ? "light" : undefined;
  const brandVars = event ? customBrandVars(event) : {};

  return (
    <div
      data-theme={dataTheme}
      style={brandVars as React.CSSProperties}
      className="flex min-h-full flex-col bg-background text-foreground"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}