import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSponsorId } from "@/lib/sponsor-auth";
import { getEventSettings } from "@/lib/event";
import { SponsorLoginForm } from "./login-form";
import { SponsorLinkRequestForm } from "./link-request-form";

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

        {/* Passwordless recovery — a sponsor who never set a password (and lost
            their invite email) would otherwise have no way back into a portal
            they may already have paid for. */}
        <div className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <h2 className="text-sm font-semibold">No password? Lost your link?</h2>
          <p className="mt-1 mb-4 text-xs text-zinc-500">
            We&apos;ll email your personal portal link — no password needed. You can
            set one from the portal afterwards.
          </p>
          <SponsorLinkRequestForm />
        </div>
      </div>
    </main>
  );
}
