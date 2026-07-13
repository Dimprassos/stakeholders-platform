import Link from "next/link";
import { getReminders, type ReminderTone } from "@/lib/reminders";

const TONE_BOX: Record<ReminderTone, string> = {
  red: "border-red-500/30 bg-red-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
};

const TONE_DOT: Record<ReminderTone, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
};

/** The dashboard shows the most urgent few; /admin/notifications lists them all. */
const PANEL_LIMIT = 8;

export async function RemindersPanel({ eventId }: { eventId: string }) {
  const all = await getReminders(eventId);
  const reminders = all.slice(0, PANEL_LIMIT);
  const overflow = all.length - reminders.length;

  return (
    <section id="reminders">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reminders</h2>
        {all.length > 0 && (
          <span className="text-xs text-zinc-500">
            {all.length} item{all.length === 1 ? "" : "s"} need attention
          </span>
        )}
      </div>

      {reminders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
          All clear — no overdue tasks, upcoming deadlines, expiring invites, or pending
          reviews.
        </p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm transition-opacity hover:opacity-80 ${TONE_BOX[r.tone]}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[r.tone]}`} />
                  <span>
                    <span className="font-medium">{r.title}</span>
                    {r.detail && (
                      <span className="ml-2 text-xs text-zinc-500">{r.detail}</span>
                    )}
                  </span>
                </span>
                {r.when && (
                  <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500">
                    {r.when}
                  </span>
                )}
              </Link>
            </li>
          ))}
          {overflow > 0 && (
            <li>
              <Link
                href="/admin/notifications"
                className="block rounded-lg border border-dashed border-black/10 px-4 py-3 text-sm text-zinc-500 transition-colors hover:text-foreground dark:border-white/10"
              >
                {overflow} more →
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
