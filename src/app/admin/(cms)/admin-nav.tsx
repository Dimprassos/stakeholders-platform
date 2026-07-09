"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/email-center", label: "Email center" },
  { href: "/admin/onboarding", label: "Onboarding" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap items-center gap-1 py-2 text-sm">
      {NAV.map((item) => {
        // Dashboard (/admin) matches exactly; the rest match their subtree too.
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              active
                ? "bg-brand/15 font-medium text-brand-accent"
                : "text-zinc-600 hover:bg-black/5 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
