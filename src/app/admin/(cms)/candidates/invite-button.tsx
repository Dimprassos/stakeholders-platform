"use client";

import { useActionState } from "react";
import { sendInviteAction, type InviteState } from "./invite-actions";

export function SendInviteForm({
  sponsorId,
  disabled,
}: {
  sponsorId: string;
  disabled?: boolean;
}) {
  const bound = sendInviteAction.bind(null, sponsorId) as (
    state: InviteState,
  ) => Promise<InviteState>;
  const [state, formAction, pending] = useActionState(bound, { ok: false });

  if (disabled) {
    return (
      <span className="text-xs text-zinc-400">
        Send invite (needs package + email)
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="text-xs font-medium text-foreground underline underline-offset-4 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send invite"}
        </button>
      </form>
      {state.message && (
        <span
          className={`text-xs ${state.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {state.message}
          {state.ok && state.previewUrl && (
            <>
              {" · "}
              <a
                href={state.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                View email
              </a>
            </>
          )}
        </span>
      )}
    </div>
  );
}