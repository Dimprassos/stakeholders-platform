"use client";

import { useActionState, useState } from "react";
import { saveDeliverablesAction } from "../actions";
import { INITIAL_CANDIDATE_STATE } from "../types";
import { DELIVERABLE_TYPES } from "@/lib/deliverables";

/**
 * Per-sponsor deliverables checklist (Phase C — CRM depth). Controlled
 * checkboxes with a live "x of n" counter; saves the whole set via a server
 * action, matching the NotesForm pattern.
 */
export function DeliverablesForm({
  sponsorId,
  initial,
}: {
  sponsorId: string;
  initial: Record<string, boolean>;
}) {
  const [state, formAction, pending] = useActionState(
    saveDeliverablesAction,
    INITIAL_CANDIDATE_STATE,
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DELIVERABLE_TYPES.map((t) => [t.key, !!initial[t.key]])),
  );

  const done = DELIVERABLE_TYPES.filter((t) => checked[t.key]).length;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={sponsorId} />

      <p className="text-xs font-medium text-zinc-500">
        {done} of {DELIVERABLE_TYPES.length} complete
      </p>

      <ul className="space-y-1.5">
        {DELIVERABLE_TYPES.map((t) => (
          <li key={t.key}>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name={`dlv_${t.key}`}
                checked={!!checked[t.key]}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, [t.key]: e.target.checked }))
                }
                className="h-4 w-4 rounded border-black/20 accent-[var(--brand-accent)] dark:border-white/20"
              />
              <span
                className={
                  checked[t.key] ? "text-zinc-400 line-through" : undefined
                }
              >
                {t.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save deliverables"}
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
