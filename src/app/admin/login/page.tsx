"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import { INITIAL_LOGIN_STATE } from "./types";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_LOGIN_STATE);

  const errors = state.errors ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Manage sponsorship packages, candidates and the public showcase.
        </p>

        {state.message && !state.ok && (
          <p className="mt-6 rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {state.message}
          </p>
        )}

        <form action={formAction} className="mt-6 space-y-4" noValidate>
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              required
            />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
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
              className={inputClass}
              required
            />
            {errors.password && <p className={errorClass}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}