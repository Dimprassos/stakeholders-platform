import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSponsorId } from "@/lib/sponsor-auth";
import { getEventSettings } from "@/lib/event";
import { SponsorLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sponsor sign in" };

export default async function SponsorLoginPage() {
  // Already signed in? Go straight to the portal.
  if (await getCurrentSponsorId()) redirect("/portal");
  const { name: event } = await getEventSettings();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 text-foreground">
      <div className="w-full max-w-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
          {event}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Sponsor sign in
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with the email and password you set up in your sponsor portal.
        </p>

        <SponsorLoginForm />

        <p className="mt-6 text-xs text-zinc-500">
          No password yet? Open the personal link from your invitation email and
          set one under “Account”. Lost the link?{" "}
          <Link href="/" className="underline underline-offset-4">
            Contact the organizers
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
