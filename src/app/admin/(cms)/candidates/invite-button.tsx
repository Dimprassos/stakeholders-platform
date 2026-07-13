"use client";

import { useActionState } from "react";
import { sendInviteAction, type InviteState } from "./invite-actions";

export function SendInviteForm({
  sponsorId,
  resend,
  disabledReason,
}: {
  sponsorId: string;
  resend?: boolean;
  /** From `can(sponsor, "invite")` — the same reason the server action gives. */
  disabledReason?: string | null;
}) {
  const bound = sendInviteAction.bind(null, sponsorId) as (
    state: InviteState,
  ) => Promise<InviteState>;
  const [state, formAction, pending] = useActionState(bound, { ok: false });
  const label = resend ? "Resend invite" : "Send invite";

  if (disabledReason) {
    return (
      <span
        title={disabledReason}
        className="cursor-not-allowed text-xs text-zinc-400"
      >
        {label}
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
          {pending ? "Sending…" : label}
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
