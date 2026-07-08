import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { getCurrentEvent } from "@/lib/event";

const NAV = [
  { href: "/packages", label: "Packages" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/faq", label: "FAQ" },
];

export async function SiteHeader() {
  const event = await getCurrentEvent();
  const name = event?.name ?? "Stakeholders Summit 2026";
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          {event?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt={name} className="h-8 w-auto object-contain" />
          ) : (
            name
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
            href="/become-a-sponsor"
            className="rounded-full bg-brand px-4 py-2 text-xs font-medium text-brand-ink transition-opacity hover:opacity-90"
          >
            Become a sponsor
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
