"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ADMIN_THEME_ROOT_ID } from "@/lib/site-themes";
import { loginAction } from "./actions";
import { INITIAL_LOGIN_STATE } from "./types";

// This page is pinned to `data-theme="light"`: there's no AdminThemeSwitcher
// here to restore a saved preference, so it renders the light palette for
// everyone. Hence no `dark:` variants below — that variant keys off
// `[data-theme="dark"]` (see globals.css), so it could never fire here anyway.

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground";
const labelClass = "block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-600";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_LOGIN_STATE);

  const errors = state.errors ?? {};

  return (
    // The id makes #admin-theme-root paint the theme's beige gradient behind the
    // card (globals.css), replacing the hardcoded zinc this page used to carry.
    <main
      id={ADMIN_THEME_ROOT_ID}
      data-theme="light"
      className="flex min-h-screen items-center justify-center px-6 text-foreground"
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{
          borderColor: "var(--line)",
          backgroundColor: "var(--surface-bg)",
          boxShadow: "var(--surface-shadow)",
        }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage sponsorship packages, candidates and the public showcase.
        </p>

        {state.message && !state.ok && (
          <p className="mt-6 rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2 text-sm text-red-700">
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