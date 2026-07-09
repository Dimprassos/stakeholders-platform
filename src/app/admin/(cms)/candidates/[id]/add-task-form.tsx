"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTaskAction } from "../actions";
import { INITIAL_CANDIDATE_STATE } from "../types";

/**
 * Add a follow-up task for a sponsor (Phase C — CRM depth). Clears the inputs
 * after a successful add so the organizer can queue several quickly.
 */
export function AddTaskForm({ sponsorId }: { sponsorId: string }) {
  const [state, formAction, pending] = useActionState(
    addTaskAction,
    INITIAL_CANDIDATE_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="sponsorId" value={sponsorId} />
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="title"
          maxLength={200}
          placeholder="Add a task — e.g. “Chase logo”"
          className="min-w-[12rem] flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        <input
          name="dueDate"
          type="date"
          aria-label="Due date"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add task"}
        </button>
      </div>
      {state.message && !state.ok && (
        <p className="text-sm text-red-700 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
