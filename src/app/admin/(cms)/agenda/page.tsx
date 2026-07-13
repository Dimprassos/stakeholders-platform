import { prisma } from "@/lib/prisma";
import { getAdminEvent, getAdminEventId } from "@/lib/event";
import {
  AGENDA_TYPES,
  AGENDA_TYPE_LABEL,
  formatAgendaDay,
  formatSlot,
  groupAgendaByDay,
} from "@/lib/agenda";
import { ActionForm } from "../action-form";
import {
  addAgendaItemAction,
  deleteAgendaItemAction,
  saveAgendaNoteAction,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-white/20";
const labelClass = "block text-xs font-medium text-zinc-500";

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const [event, eventId] = await Promise.all([getAdminEvent(), getAdminEventId()]);

  const items = await prisma.agendaItem.findMany({
    where: { eventId },
    orderBy: [{ day: "asc" }, { displayOrder: "asc" }, { startTime: "asc" }],
  });
  const days = groupAgendaByDay(items);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {event?.name ?? "Event"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          The public programme for this event, grouped by day. Shown on{" "}
          <code className="text-xs">/agenda</code> and each event&apos;s agenda page.
        </p>
      </div>

      {sp.added === "1" && (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          Agenda item added.
        </div>
      )}
      {sp.noted === "1" && (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          Agenda note saved.
        </div>
      )}
      {sp.err === "required" && (
        <div className="rounded-xl border border-red-600/30 bg-red-600/5 p-3 text-sm text-red-700 dark:text-red-400">
          Day, start time and title are required.
        </div>
      )}

      {/* Programme note */}
      <section className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Programme note</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Optional banner above the agenda, e.g. &quot;Draft programme — subject to
          change&quot;.
        </p>
        <form action={saveAgendaNoteAction} className="mt-3 flex flex-wrap gap-2">
          <input
            name="agendaNote"
            type="text"
            maxLength={200}
            defaultValue={event?.agendaNote ?? ""}
            placeholder="Draft programme — subject to change"
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Save note
          </button>
        </form>
      </section>

      {/* Add item */}
      <section className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Add agenda item</h2>
        <form action={addAgendaItemAction} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className={labelClass}>
              Day *
              <input name="day" type="date" required className={`${inputClass} mt-1`} />
            </label>
            <label className={labelClass}>
              Day label
              <input
                name="dayLabel"
                type="text"
                maxLength={60}
                placeholder="Pre-Conference"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className={labelClass}>
              Start *
              <input
                name="startTime"
                type="time"
                required
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className={labelClass}>
              End
              <input name="endTime" type="time" className={`${inputClass} mt-1`} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <label className={`${labelClass} sm:col-span-2`}>
              Title *
              <input
                name="title"
                type="text"
                required
                maxLength={160}
                placeholder="Opening Reception and Dinner"
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className={labelClass}>
              Type
              <select name="type" defaultValue="SESSION" className={`${inputClass} mt-1`}>
                {AGENDA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {AGENDA_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Order
              <input
                name="displayOrder"
                type="number"
                defaultValue={0}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Speaker
              <input
                name="speaker"
                type="text"
                maxLength={120}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className={labelClass}>
              Location
              <input
                name="location"
                type="text"
                maxLength={120}
                placeholder="Main Hall"
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <label className={labelClass}>
            Description
            <textarea
              name="description"
              rows={2}
              maxLength={500}
              className={`${inputClass} mt-1`}
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add item
          </button>
        </form>
      </section>

      {/* Current programme */}
      <section className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
          <h2 className="font-semibold tracking-tight">Programme</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {items.length} item{items.length === 1 ? "" : "s"} across {days.length} day
            {days.length === 1 ? "" : "s"}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No agenda items yet. Add the first one above.
          </p>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {days.map((d) => (
              <div key={d.day} className="p-5">
                {d.dayLabel && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
                    {d.dayLabel}
                  </p>
                )}
                <h3 className="mt-0.5 text-sm font-semibold">{formatAgendaDay(d.day)}</h3>

                <ul className="mt-3 space-y-2">
                  {d.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
                          {formatSlot(item.startTime, item.endTime)}
                          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {AGENDA_TYPE_LABEL[item.type] ?? item.type}
                          </span>
                        </p>
                        <p className="mt-1 font-medium">{item.title}</p>
                        {(item.speaker || item.location) && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {[item.speaker, item.location].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <ActionForm action={deleteAgendaItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 underline underline-offset-4 hover:opacity-80 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </ActionForm>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
