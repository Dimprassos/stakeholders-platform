import Link from "next/link";
import { getAdminEventId } from "@/lib/event";
import { getReminders, type ReminderTone } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notifications" };

const TONE_BOX: Record<ReminderTone, string> = {
  red: "border-red-500/30 bg-red-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
};

const TONE_LABEL: Record<ReminderTone, string> = {
  red: "Urgent",
  amber: "Reminder",
  blue: "New",
};

const TONE_TEXT: Record<ReminderTone, string> = {
  red: "text-red-700 dark:text-red-400",
  amber: "text-amber-700 dark:text-amber-400",
  blue: "text-blue-700 dark:text-blue-400",
};

export default async function NotificationsPage() {
  const eventId = await getAdminEventId();
  const reminders = await getReminders(eventId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Derived from sponsor replies, pending payments, contracts, tasks,
          onboarding reviews, deadlines and invite expiry.
        </p>
      </div>

      {reminders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
          All clear — nothing needs attention right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {reminders.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                className={`block rounded-xl border p-4 transition-opacity hover:opacity-85 ${TONE_BOX[r.tone]}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_TEXT[r.tone]}`}
                    >
                      {TONE_LABEL[r.tone]}
                    </span>
                    <h2 className="mt-2 font-medium">{r.title}</h2>
                    {r.detail && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {r.detail}
                      </p>
                    )}
                  </div>
                  {r.when && (
                    <span className="text-xs font-medium tabular-nums text-zinc-500">
                      {r.when}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
