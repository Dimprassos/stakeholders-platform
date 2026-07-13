"use client";

import { useActionState } from "react";
import { requestSponsorLinkAction } from "./actions";
import type { SponsorLoginState } from "./types";

const INITIAL: SponsorLoginState = { ok: false };

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";

export function SponsorLinkRequestForm() {
  const [state, formAction, pending] = useActionState(
    requestSponsorLinkAction,
    INITIAL,
  );

  if (state.ok) {
    return (
      <p className="rounded-lg border border-green-600/30 bg-green-600/5 px-3 py-2 text-sm text-green-700 dark:text-green-400">
        {state.message}
      </p>
    );
  }

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-sm font-medium" htmlFor="link-email">
          Your email
        </label>
        <input
          id="link-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={`${inputClass} mt-1`}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium transition-colors hover:border-foreground disabled:opacity-50 dark:border-white/20"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
