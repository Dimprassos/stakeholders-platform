import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listEvents, getAdminEvent } from "@/lib/event";
import { EventSwitcher } from "./events/event-switcher";
import { logoutAction } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/onboarding", label: "Onboarding review" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdmin();
  const [user, events, currentEvent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    }),
    listEvents(),
    getAdminEvent(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold tracking-tight">
              CMS
            </Link>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {currentEvent && (
              <EventSwitcher
                events={events.map((e) => ({ id: e.id, name: e.name }))}
                currentId={currentEvent.id}
              />
            )}
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {user?.email ?? "Admin"}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}