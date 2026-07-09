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

export async function RemindersPanel({ eventId }: { eventId: string }) {
  const reminders = await getReminders(eventId);

  return (
    <section id="reminders">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reminders</h2>
        {reminders.length > 0 && (
          <span className="text-xs text-zinc-500">
            {reminders.length} item{reminders.length === 1 ? "" : "s"} need attention
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
        </ul>
      )}
    </section>
  );
}
