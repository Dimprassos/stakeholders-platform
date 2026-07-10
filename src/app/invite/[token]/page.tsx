import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseBenefits } from "@/lib/format";
import { parseDeliverables, DELIVERABLE_TYPES } from "@/lib/deliverables";
import { isTokenExpired } from "@/lib/magic-token";
import { slotsTaken } from "@/lib/slots";
import { getEventSettings } from "@/lib/event";
import { acceptAction, declineAction } from "./actions";

export const dynamic = "force-dynamic";

const PORTAL_STATUSES = ["ACCEPTED", "DETAILS_SUBMITTED", "CONFIRMED"] as const;

const STEPS = [
  { key: "INVITE_SENT", label: "Invited" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "DETAILS_SUBMITTED", label: "Details submitted" },
  { key: "CONFIRMED", label: "Confirmed" },
] as const;

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
  return { title: `Sponsorship · ${sponsor.companyName}` };
}

function ProgressTimeline({ status }: { status: string }) {
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="mt-6 grid gap-3 sm:grid-cols-4">
      {STEPS.map((step, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <li
            key={step.key}
            className={`rounded-xl border p-4 ${
              active
                ? "border-foreground"
                : done
                  ? "border-green-600/40 bg-green-600/5"
                  : "border-black/10 dark:border-white/10"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-green-600 text-white"
                  : active
                    ? "bg-foreground text-background"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <p className="mt-2 text-sm font-medium">{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
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

  const status = sponsor!.status;
  const isPortal = (PORTAL_STATUSES as readonly string[]).includes(status);
  const benefits = parseBenefits(pkg.benefits);
  const deliverables = parseDeliverables(sponsor!.deliverables);
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

  const packageCard = (
    <section className="mt-8 rounded-2xl border border-black/10 p-8 dark:border-white/10">
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
  );

  // ── Portal view — the sponsor has accepted and can return here any time ────
  if (isPortal) {
    const details: { label: string; value: string | null }[] = [
      { label: "Legal name", value: sponsor!.legalName },
      { label: "VAT number", value: sponsor!.vatNumber },
      { label: "Billing address", value: sponsor!.billingAddress },
      { label: "Website", value: sponsor!.websiteUrl },
    ];
    const hasDetails = details.some((d) => d.value);
    const isLive = status === "CONFIRMED" && sponsor!.isPublished && !sponsor!.isHiddenFromPublic;

    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
          Your sponsorship portal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {sponsor!.companyName} × {event}
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Thanks for coming on board. Track your status, see what we still need,
          and keep your details up to date here any time.
        </p>

        <ProgressTimeline status={status} />

        {isLive && (
          <div className="mt-8 rounded-xl border border-green-600/30 bg-green-600/5 p-4 text-sm text-green-700 dark:text-green-400">
            You&apos;re confirmed and live on the public page.{" "}
            <Link href="/sponsors" className="underline underline-offset-4">
              View the sponsors page →
            </Link>
          </div>
        )}

        {packageCard}

        {/* Deliverables the organizer is tracking */}
        <section className="mt-8 rounded-2xl border border-black/10 p-8 dark:border-white/10">
          <h2 className="text-lg font-semibold tracking-tight">What we still need</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Items the organizer marks as received as they come in.
          </p>
          <ul className="mt-5 space-y-2">
            {DELIVERABLE_TYPES.map((d) => {
              const done = !!deliverables[d.key];
              return (
                <li key={d.key} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      done
                        ? "bg-green-600 text-white"
                        : "border border-black/25 text-transparent dark:border-white/30"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={done ? "text-zinc-500 line-through" : undefined}>
                    {d.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Company details + edit */}
        <section className="mt-8 rounded-2xl border border-black/10 p-8 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Your details</h2>
            <Link
              href={`/invite/${token}/form`}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {hasDetails ? "Update details & materials" : "Add your details & logo"}
            </Link>
          </div>
          {hasDetails ? (
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {details
                .filter((d) => d.value)
                .map((d) => (
                  <div key={d.label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {d.label}
                    </dt>
                    <dd className="mt-0.5 text-sm break-words">{d.value}</dd>
                  </div>
                ))}
              {sponsor!.logoUrl && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Logo
                  </dt>
                  <dd className="mt-1 flex h-12 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sponsor!.logoUrl}
                      alt={sponsor!.companyName}
                      className="max-h-12 max-w-[10rem] object-contain"
                    />
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              We don&apos;t have your onboarding details yet — add them so we can
              feature {sponsor!.companyName}.
            </p>
          )}
        </section>

        <p className="mt-8 text-xs text-zinc-500">
          Your personal link expires on {expiryLabel}.
        </p>
      </main>
    );
  }

  // ── Proposal view — not yet accepted (INVITE_SENT) or declined ─────────────
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

      {packageCard}

      <p className="mt-6 text-xs text-zinc-500">
        This personal link expires on {expiryLabel}.
      </p>

      {status === "DECLINED" ? (
        <div className="mt-8 rounded-xl border border-red-600/30 bg-red-600/5 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            You declined this invitation. If you changed your mind, contact the
            organizers.
          </p>
        </div>
      ) : (
        <div className="mt-10 flex flex-wrap gap-3">
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
        </div>
      )}
    </main>
  );
}
