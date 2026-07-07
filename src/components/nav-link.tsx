"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A nav <Link> that marks itself with `aria-current="page"` when it matches the
 * current route, so assistive tech (and CSS `aria-[current=page]:` variants)
 * can convey the active page.
 */
export function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
