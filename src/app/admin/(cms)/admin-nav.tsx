"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/agenda", label: "Agenda" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/email-center", label: "Email center" },
  { href: "/admin/onboarding", label: "Onboarding" },
];

// Same nav idiom as the public header (SiteHeader): the `.nav-link` underline
// that wipes in from the left on hover and stays put on the current page. This
// used to be a pill nav, which meant the two halves of the product animated
// differently on hover for no reason. One visual language, one definition —
// see `.nav-link` in globals.css.
const navClass =
  "nav-link text-zinc-600 transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-brand-accent dark:text-zinc-400";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      // gap-y leaves room for the underline (it sits below the link box) when
      // ten items wrap onto a second row.
      className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3 text-sm"
    >
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
            className={navClass}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
