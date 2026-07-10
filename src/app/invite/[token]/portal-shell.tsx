import Link from "next/link";
import { customBrandVars } from "@/lib/event-content";
import { PORTAL_THEME_ROOT_ID } from "@/lib/site-themes";
import { PortalThemeSwitcher } from "@/components/portal-theme-switcher";
import { sponsorLogoutAction } from "@/app/sponsor/login/actions";

export type PortalEvent = {
  name: string;
  logoUrl: string | null;
  themeMode: string;
  brandColor: string | null;
  brandInkColor: string | null;
  brandAccentColor: string | null;
};

/**
 * Branded chrome for the sponsor-facing pages (portal + onboarding form).
 * Applies the sponsor's event theme/brand (Phase B branding) and wraps content
 * in the same layered surfaces as the public site (see globals.css
 * `#portal-theme-root`), so a logged-in sponsor feels inside one product.
 */
export function PortalShell({
  event,
  companyName,
  mode,
  homeHref,
  children,
}: {
  event: PortalEvent | null;
  companyName: string;
  mode: "token" | "session";
  homeHref: string;
  children: React.ReactNode;
}) {
  const themeMode = event?.themeMode ?? "AUTO";
  const dataTheme =
    themeMode === "DARK" ? "dark" : themeMode === "LIGHT" ? "light" : undefined;
  const brandVars = event ? customBrandVars(event) : {};
  const eventName = event?.name ?? "Sponsor portal";

  return (
    <div
      id={PORTAL_THEME_ROOT_ID}
      data-theme={dataTheme}
      data-event-theme={dataTheme}
      data-event-brand={brandVars["--brand"]}
      data-event-brand-ink={brandVars["--brand-ink"]}
      data-event-brand-accent={brandVars["--brand-accent"]}
      style={brandVars as React.CSSProperties}
      className="flex min-h-full flex-col bg-background text-foreground"
    >
      <header className="sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href={homeHref} className="flex items-center gap-3">
            {event?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.logoUrl}
                alt={eventName}
                className="h-8 w-auto max-w-[10rem] object-contain"
              />
            ) : (
              <span className="text-sm font-semibold tracking-tight">{eventName}</span>
            )}
            <span className="hidden text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:inline">
              Sponsor portal
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-[12rem] truncate text-zinc-600 dark:text-zinc-400 sm:inline">
              {companyName}
            </span>
            <PortalThemeSwitcher />
            {mode === "session" && (
              <form action={sponsorLogoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
                >
                  Log out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="portal-main-surface flex-1">
        <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-zinc-500">
          <span>
            {eventName} · Sponsor portal
          </span>
          <span>
            Need help? Reply to any email from the organizers and we&apos;ll get back to you.
          </span>
        </div>
      </footer>
    </div>
  );
}
