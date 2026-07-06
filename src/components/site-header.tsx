import Link from "next/link";

const NAV = [
  { href: "/packages", label: "Packages" },
  { href: "/sponsors", label: "Sponsors" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Sponsorships
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/become-a-sponsor"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Become a sponsor
          </Link>
        </nav>
      </div>
    </header>
  );
}
