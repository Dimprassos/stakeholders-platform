"use client";

import { switchEventAction } from "./actions";

/**
 * Compact header dropdown to change the admin's current event. Submitting posts
 * to the server action, which sets the cookie and redirects.
 */
export function EventSwitcher({
  events,
  currentId,
}: {
  events: { id: string; name: string }[];
  currentId: string;
}) {
  return (
    <form action={switchEventAction} className="flex items-center gap-1.5">
      <span className="hidden text-xs text-zinc-500 sm:inline">Event</span>
      <select
        name="eventId"
        defaultValue={currentId}
        aria-label="Current event"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="max-w-[12rem] truncate rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs dark:border-white/20"
      >
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </form>
  );
}
