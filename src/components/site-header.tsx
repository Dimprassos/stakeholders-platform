import Link from "next/link";
import { NavLink } from "@/components/nav-link";

const NAV = [
  { href: "/packages", label: "Packages" },
  { href: "/sponsors", label: "Sponsors" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Sponsorships
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground dark:text-zinc-400 dark:aria-[current=page]:text-foreground"
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            href="/become-a-sponsor"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Become a sponsor
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
