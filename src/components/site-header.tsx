import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { SiteThemeSwitcher } from "@/components/site-theme-switcher";
import { SITE_LOGO_URL, SITE_NAME } from "@/lib/site";

const NAV = [
  { href: "/agenda", label: "Agenda" },
  { href: "/packages", label: "Packages" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/faq", label: "FAQ" },
];

// The main site spans every event, so its chrome shows the platform brand —
// not the default event's. Event branding lives on /events/[slug].
export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          {SITE_LOGO_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={SITE_LOGO_URL} alt={SITE_NAME} className="h-8 w-auto object-contain" />
          ) : (
            SITE_NAME
          )}
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-brand-accent dark:text-zinc-400"
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            href="/sponsor/login"
            className="text-zinc-600 transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-brand-accent dark:text-zinc-400"
          >
            Sponsor login
          </NavLink>
          <NavLink
            href="/become-a-sponsor"
            className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-brand-ink transition-opacity hover:opacity-90"
          >
            Become a sponsor
          </NavLink>
          <SiteThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
