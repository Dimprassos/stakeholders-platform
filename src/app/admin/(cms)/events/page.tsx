import { listEvents, getAdminEventId } from "@/lib/event";
import { ActionForm } from "../action-form";
import {
  createEventAction,
  switchEventAction,
  setDefaultEventAction,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";

export default async function EventsPage() {
  const [events, currentId] = await Promise.all([listEvents(), getAdminEventId()]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Each event has its own packages, candidates, submissions and templates.
          Switch to an event to manage it; the default event drives the public site.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Default</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {events.map((e) => {
              const isCurrent = e.id === currentId;
              return (
                <tr key={e.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {e.name}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">/{e.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {e.startDate ? `${e.startDate}${e.endDate ? ` – ${e.endDate}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {e.isDefault ? (
                      <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Default
                      </span>
                    ) : (
                      <ActionForm action={setDefaultEventAction}>
                        <input type="hidden" name="eventId" value={e.id} />
                        <button
                          type="submit"
                          className="text-xs text-zinc-500 underline underline-offset-2 hover:text-foreground"
                        >
                          Make default
                        </button>
                      </ActionForm>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isCurrent ? (
                      <span className="text-xs text-zinc-400">Editing now</span>
                    ) : (
                      <ActionForm action={switchEventAction} className="inline-block">
                        <input type="hidden" name="eventId" value={e.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-foreground underline underline-offset-4"
                        >
                          Switch to this event
                        </button>
                      </ActionForm>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="max-w-lg rounded-xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold">New event</h2>
        <form action={createEventAction} className="mt-4 space-y-4">
          <div>
            <label className={labelClass} htmlFor="name">
              Name *
            </label>
            <input id="name" name="name" required maxLength={120} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="tagline">
              Tagline
            </label>
            <input id="tagline" name="tagline" maxLength={200} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="startDate">
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="endDate">
                End date
              </label>
              <input id="endDate" name="endDate" type="date" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="venue">
              Venue
            </label>
            <input id="venue" name="venue" maxLength={200} className={inputClass} />
          </div>
          <button
            type="submit"
            className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Create &amp; switch to it
          </button>
        </form>
      </section>
    </div>
  );
}
