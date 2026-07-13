import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listEvents, getAdminEvent } from "@/lib/event";
import { EventSwitcher } from "./events/event-switcher";
import { AdminNav } from "./admin-nav";
import { AdminThemeSwitcher } from "@/components/admin-theme-switcher";
import { ADMIN_THEME_ROOT_ID } from "@/lib/site-themes";
import { SITE_LOGO_URL, SITE_NAME } from "@/lib/site";
import { getReminders } from "@/lib/reminders";
import { logoutAction } from "@/app/admin/login/actions";

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
  const reminderCount = currentEvent ? (await getReminders(currentEvent.id)).length : 0;

  return (
    // Shares the public site's layered theme surfaces via #admin-theme-root
    // (globals.css). `data-theme="light"` is the readable server default;
    // AdminThemeSwitcher overrides it (System/Light/Dark) from localStorage.
    <div
      id={ADMIN_THEME_ROOT_ID}
      data-theme="light"
      className="flex min-h-screen flex-col text-foreground"
    >
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          {/* Top strip — brand + controls */}
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Same platform wordmark as the public header (logo if configured,
                otherwise the name) — was a hardcoded "Stakeholders" that ignored
                SITE_NAME, so it would have drifted the moment the env var was set.
                items-center rather than items-baseline: a logo has no baseline. */}
            <Link href="/admin" className="flex items-center gap-2">
              {SITE_LOGO_URL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={SITE_LOGO_URL}
                  alt={SITE_NAME}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <span className="text-base font-semibold tracking-tight">{SITE_NAME}</span>
              )}
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent">
                CMS
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {reminderCount > 0 && (
                <Link
                  href="/admin/notifications"
                  title={`${reminderCount} reminder${reminderCount === 1 ? "" : "s"} need attention`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {reminderCount}
                </Link>
              )}
              <AdminThemeSwitcher />
              {currentEvent && (
                <EventSwitcher
                  events={events.map((e) => ({ id: e.id, name: e.name }))}
                  currentId={currentEvent.id}
                />
              )}
              <div className="hidden h-5 w-px bg-black/10 sm:block dark:bg-white/15" />
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {user?.email ?? "Admin"}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>

          {/* Bottom strip — section nav */}
          <div className="border-t border-black/5 dark:border-white/10">
            <AdminNav />
          </div>
        </div>
      </header>

      <main className="admin-main-surface flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
      </main>

      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {SITE_NAME} CMS{currentEvent ? ` · ${currentEvent.name}` : ""}
          </span>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            View public site →
          </Link>
        </div>
      </footer>
    </div>
  );
}
