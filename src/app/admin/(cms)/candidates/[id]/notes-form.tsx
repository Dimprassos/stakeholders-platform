"use client";

import { useActionState } from "react";
import { updateSponsorNotesAction } from "../actions";
import { INITIAL_CANDIDATE_STATE } from "../types";

/**
 * Organizer's private notes about a sponsor (Phase C — CRM depth). Saves via a
 * server action and shows a lightweight "saved" confirmation.
 */
export function NotesForm({
  sponsorId,
  initialNotes,
}: {
  sponsorId: string;
  initialNotes: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateSponsorNotesAction,
    INITIAL_CANDIDATE_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={sponsorId} />
      <textarea
        name="notes"
        rows={6}
        defaultValue={initialNotes}
        maxLength={5000}
        placeholder="Private notes — context, next steps, past sponsorships, who to follow up with…"
        className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save notes"}
        </button>
        {state.message && (
          <span
            className={`text-sm ${
              state.ok
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
