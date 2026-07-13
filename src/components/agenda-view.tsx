import type { AgendaItem } from "@prisma/client";
import {
  AGENDA_TYPE_LABEL,
  AGENDA_TYPE_TONE,
  formatAgendaDay,
  formatSlot,
  groupAgendaByDay,
} from "@/lib/agenda";

// Shared by the main site (/agenda) and the per-event pages
// (/events/[slug]/agenda). Programme grouped by day, mirroring how conference
// agendas are normally presented: time slot · title · type · location.

export function AgendaView({
  items,
  note,
}: {
  items: AgendaItem[];
  /** Optional organizer note, e.g. "Draft programme — subject to change". */
  note?: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-lg border border-dashed border-black/10 p-8 dark:border-white/10">
        <h2 className="font-semibold">The programme is being finalized.</h2>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Sessions will be published here as soon as they are confirmed.
        </p>
      </div>
    );
  }

  const days = groupAgendaByDay(items);

  return (
    <div className="mt-10">
      {note && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {note}
        </p>
      )}

      <div className={note ? "mt-8 space-y-12" : "space-y-12"}>
        {days.map((d) => (
          <section key={d.day}>
            <div className="border-b border-black/10 pb-3 dark:border-white/10">
              {d.dayLabel && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
                  {d.dayLabel}
                </p>
              )}
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {formatAgendaDay(d.day)}
              </h2>
            </div>

            <ol className="mt-4 divide-y divide-black/5 dark:divide-white/5">
              {d.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:gap-6"
                >
                  <p className="shrink-0 text-sm font-medium tabular-nums text-zinc-600 sm:w-32 dark:text-zinc-400">
                    {formatSlot(item.startTime, item.endTime)}
                  </p>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          AGENDA_TYPE_TONE[item.type] ?? AGENDA_TYPE_TONE.SESSION
                        }`}
                      >
                        {AGENDA_TYPE_LABEL[item.type] ?? item.type}
                      </span>
                    </div>

                    {item.speaker && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.speaker}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                    )}
                    {item.location && (
                      <p className="mt-1 text-xs text-zinc-500">{item.location}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
