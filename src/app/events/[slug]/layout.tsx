import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { customBrandVars } from "@/lib/event-content";
import { PUBLIC_THEME_ROOT_ID } from "@/lib/site-themes";
import { SiteThemeSwitcher } from "@/components/site-theme-switcher";
import { ScrollEffects } from "@/components/scroll-effects";
import { NavLink } from "@/components/nav-link";

export const dynamic = "force-dynamic";

// Per-event public site (docs/PLAN.md §16 multi-event). Everything under
// /events/[slug] is scoped to that event: its own logo, theme and brand, and
// every nav/CTA link stays inside the event — so a visitor browsing event B can
// never be silently bounced back to the default event's packages or form.

const SOCIAL_LABELS = {
  websiteUrl: "Website",
  twitterUrl: "X / Twitter",
  linkedinUrl: "LinkedIn",
  instagramUrl: "Instagram",
  facebookUrl: "Facebook",
} as const;

const navClass =
  "nav-link text-zinc-600 transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-brand-accent dark:text-zinc-400";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findFirst({ where: { slug, isActive: true } });
  if (!event) notFound();

  const base = `/events/${event.slug}`;
  const dataTheme =
    event.themeMode === "DARK" ? "dark" : event.themeMode === "LIGHT" ? "light" : undefined;
  const brandVars = customBrandVars(event);

  const socialLinks: { label: string; href: string }[] = [];
  for (const key of Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]) {
    const href = event[key];
    if (href) socialLinks.push({ label: SOCIAL_LABELS[key], href });
  }

  return (
    <div
      id={PUBLIC_THEME_ROOT_ID}
      data-theme={dataTheme}
      data-event-theme={dataTheme}
      data-event-brand={brandVars["--brand"]}
      data-event-brand-ink={brandVars["--brand-ink"]}
      data-event-brand-accent={brandVars["--brand-accent"]}
      style={brandVars as React.CSSProperties}
      className="flex min-h-full flex-col bg-background text-foreground"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
      >
        Skip to content
      </a>

      <ScrollEffects />

      <header className="border-b border-black/10 dark:border-white/10">
        <div className="header-bar mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-6">
          <Link
            href={base}
            className="flex items-center gap-2 font-semibold tracking-tight transition-transform hover:-translate-y-px"
          >
            {event.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.logoUrl}
                alt={event.name}
                className="h-8 w-auto object-contain"
              />
            ) : (
              event.name
            )}
          </Link>

          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-4 text-sm sm:gap-6"
          >
            <NavLink href={`${base}/agenda`} className={navClass}>
              Agenda
            </NavLink>
            <NavLink href={`${base}/packages`} className={navClass}>
              Packages
            </NavLink>
            <NavLink href={`${base}/sponsors`} className={navClass}>
              Sponsors
            </NavLink>
            <NavLink href="/" className={navClass}>
              All events
            </NavLink>
            <NavLink href="/sponsor/login" className={navClass}>
              Sponsor login
            </NavLink>
            <NavLink
              href={`${base}/become-a-sponsor`}
              className="btn-brand rounded-full bg-brand px-4 py-2 text-xs font-medium text-brand-ink"
            >
              Become a sponsor
            </NavLink>
            <SiteThemeSwitcher />
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="public-main-surface flex-1 focus:outline-none"
      >
        {children}
      </main>

      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-5xl space-y-3 px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            © {new Date().getFullYear()} {event.name} · Interested in partnering?{" "}
            <Link
              href={`${base}/become-a-sponsor`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Become a sponsor
            </Link>{" "}
            ·{" "}
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">
              All events
            </Link>{" "}
            ·{" "}
            <Link
              href="/sponsor/login"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Sponsor login
            </Link>
            {event.mapUrl && (
              <>
                {" "}
                ·{" "}
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Venue map
                </a>
              </>
            )}
          </p>
          {socialLinks.length > 0 && (
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              {socialLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
