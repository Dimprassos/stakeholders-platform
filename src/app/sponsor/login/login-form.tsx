"use client";

import { useActionState } from "react";
import { loginSponsorAction } from "./actions";
import type { SponsorLoginState } from "./types";

const initialState: SponsorLoginState = { ok: false };

const labelClass = "block text-sm font-medium";
const inputClass =
  "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-foreground dark:border-white/20";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export function SponsorLoginForm() {
  const [state, action, pending] = useActionState(loginSponsorAction, initialState);

  return (
    <form action={action} className="mt-8 space-y-4">
      {state.message && !state.errors && (
        <p className="rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!state.errors?.email}
          className={inputClass}
        />
        {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state.errors?.password}
          className={inputClass}
        />
        {state.errors?.password && (
          <p className={errorClass}>{state.errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
