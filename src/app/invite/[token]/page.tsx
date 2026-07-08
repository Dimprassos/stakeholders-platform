import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseBenefits } from "@/lib/format";
import { isTokenExpired } from "@/lib/magic-token";
import { slotsTaken } from "@/lib/slots";
import { getEventSettings } from "@/lib/event";
import { acceptAction, declineAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const sponsor = await prisma.sponsor.findUnique({
    where: { magicToken: token },
    select: { companyName: true, tokenExpiresAt: true },
  });
  if (!sponsor || isTokenExpired(sponsor.tokenExpiresAt)) {
    return { title: "Invitation" };
  }
  return { title: `Sponsorship invitation · ${sponsor.companyName}` };
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const sponsor = await prisma.sponsor.findUnique({
    where: { magicToken: token },
    include: { package: true },
  });

  const invalid = !sponsor || isTokenExpired(sponsor.tokenExpiresAt);
  const { name: event, venue, startDate, endDate } = await getEventSettings();

  if (invalid) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            This invite link is no longer valid
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            It may have expired or already been used. If you believe this is a
            mistake, please contact the organizers.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            <Link href="/" className="underline underline-offset-4">
              Back to site
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const pkg = sponsor!.package;
  if (!pkg) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Invitation for {sponsor!.companyName}
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Your assigned package is being prepared. Please check back shortly
            or contact the organizers.
          </p>
        </div>
      </main>
    );
  }

  const benefits = parseBenefits(pkg.benefits);
  const slotsRemaining =
    pkg.slotsTotal != null
      ? Math.max(pkg.slotsTotal - (await slotsTaken(pkg.id)), 0)
      : null;
  const expiry = sponsor!.tokenExpiresAt!;
  const expiryLabel = expiry.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Sponsorship invitation
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        {sponsor!.companyName} × {event}
      </h1>

      {(startDate || venue) && (
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {startDate && `${startDate}${endDate ? ` – ${endDate}` : ""}`}
          {startDate && venue ? " · " : ""}
          {venue}
        </p>
      )}

      <p className="mt-6 text-lg text-zinc-700 dark:text-zinc-300">
        Dear{sponsor!.contactName ? ` ${sponsor!.contactName}` : ""}, we&apos;d
        love to have <strong>{sponsor!.companyName}</strong>{" "}
        on board. Below is the package we&apos;re proposing. Review it and let
        us know.
      </p>

      <section className="mt-10 rounded-2xl border border-black/10 p-8 dark:border-white/10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">{pkg.name}</h2>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {pkg.tier}
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight">
          {formatPrice(pkg.priceCents, pkg.currency)}
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          {benefits.length === 0 ? (
            <li className="text-zinc-500">No benefits listed.</li>
          ) : (
            benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span aria-hidden className="text-foreground">
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))
          )}
        </ul>

        {pkg.slotsTotal != null && slotsRemaining != null && (
          <p className="mt-6 text-xs text-zinc-500">
            {slotsRemaining} of {pkg.slotsTotal} slots remaining.
          </p>
        )}
      </section>

      <p className="mt-6 text-xs text-zinc-500">
        This personal link expires on {expiryLabel}.
      </p>

      {sponsor!.status === "DECLINED" ? (
        <div className="mt-8 rounded-xl border border-red-600/30 bg-red-600/5 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            You declined this invitation. If you changed your mind, contact the
            organizers.
          </p>
        </div>
      ) : (
        <div className="mt-10 flex flex-wrap gap-3">
          {sponsor!.status === "ACCEPTED" || sponsor!.status === "DETAILS_SUBMITTED" ? (
            <Link
              href={`/invite/${token}/form`}
              className="rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {sponsor!.status === "DETAILS_SUBMITTED"
                ? "Review submitted details"
                : "Continue to onboarding"}
            </Link>
          ) : (
            <>
              <form action={acceptAction}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Accept invitation
                </button>
              </form>
              <form action={declineAction}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  className="rounded-full border border-black/15 px-7 py-3 text-sm font-medium transition-colors hover:border-foreground dark:border-white/20"
                >
                  Decline
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </main>
  );
}