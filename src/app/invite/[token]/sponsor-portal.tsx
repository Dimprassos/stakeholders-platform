import Link from "next/link";
import type { Package, Sponsor } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { parseDeliverables, DELIVERABLE_TYPES } from "@/lib/deliverables";
import { isStripeConfigured } from "@/lib/stripe";
import { getEventSettings } from "@/lib/event";
import {
  startCheckoutAction,
  setSponsorPasswordAction,
  signContractAction,
} from "./actions";
import { sponsorLogoutAction } from "@/app/sponsor/login/actions";

// Shared sponsor portal (docs/PLAN.md §16 Phase E) — a compact dashboard,
// reached from a magic link (`/invite/[token]`, mode "token") or an account
// login (`/portal`, mode "session"). Action-first: anything the sponsor needs
// to do (pay, complete details) is surfaced up top; everything else is a calm
// one-line summary rather than a wall of re-displayed form data.

export type SponsorWithPackage = Sponsor & { package: Package | null };

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: "Accepted",
  DETAILS_SUBMITTED: "Details submitted",
  CONFIRMED: "Confirmed",
};

export async function SponsorPortal({
  sponsor,
  token,
  mode,
  flags,
}: {
  sponsor: SponsorWithPackage;
  token: string;
  mode: "token" | "session";
  flags: {
    paid: boolean;
    cancel: boolean;
    error: string | null;
    pwError: string | null;
    signed: boolean;
    signError: boolean;
  };
}) {
  const { name: event } = await getEventSettings();
  const pkg = sponsor.package;
  const basePath = mode === "session" ? "/portal" : `/invite/${token}`;

  const [payments, contract] = await Promise.all([
    prisma.payment.findMany({
      where: { sponsorId: sponsor.id, status: { in: ["PENDING", "PAID"] } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contract.findFirst({
      where: { sponsorId: sponsor.id, status: { in: ["SENT", "SIGNED"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const due = payments.filter((p) => p.status === "PENDING");
  const paid = payments.filter((p) => p.status === "PAID");
  const latestReceiptUrl = paid.length > 0 ? paid[paid.length - 1].receiptUrl : null;
  const stripeReady = isStripeConfigured();
  const multipleOpenPayments = due.length > 1;

  const deliverables = parseDeliverables(sponsor.deliverables);
  const materialsDone = DELIVERABLE_TYPES.filter((d) => deliverables[d.key]).length;

  const hasDetails = Boolean(
    sponsor.legalName || sponsor.vatNumber || sponsor.billingAddress,
  );
  const needsDetails = !hasDetails;
  const isLive =
    sponsor.status === "CONFIRMED" &&
    sponsor.isPublished &&
    !sponsor.isHiddenFromPublic;

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {sponsor.companyName}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">{event}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-green-600/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
            {STATUS_LABEL[sponsor.status] ?? sponsor.status}
          </span>
          {mode === "session" && (
            <form action={sponsorLogoutAction}>
              <button
                type="submit"
                className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
              >
                Log out
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Transient banners */}
      {flags.paid && (
        <Banner tone="green">Payment received — thank you! A receipt is on its way.</Banner>
      )}
      {flags.cancel && (
        <Banner tone="amber">Payment canceled — nothing was charged.</Banner>
      )}
      {flags.error && (
        <Banner tone="red">
          {flags.error === "config"
            ? "Online payment isn't available yet — the organizer will follow up."
            : "We couldn't start the payment. Please try again or contact the organizers."}
        </Banner>
      )}
      {flags.signed && <Banner tone="green">Contract signed — thank you!</Banner>}

      {/* Primary next step: onboarding details/materials */}
      {needsDetails && (
        <section className="mt-8 rounded-2xl border border-blue-500/40 bg-blue-500/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Next step
          </h2>
          <h3 className="mt-2 text-lg font-semibold">
            Complete your sponsorship details
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Add billing details, website and materials so the organizer can prepare
            your sponsor listing.
          </p>
          <Link
            href={`/invite/${token}/form`}
            className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Complete details & materials
          </Link>
        </section>
      )}

      {/* Action needed: contract to sign */}
      {contract?.status === "SENT" && (
        <section className="mt-8 rounded-2xl border border-blue-500/40 bg-blue-500/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Contract to sign
          </h2>
          <h3 className="mt-2 text-lg font-semibold">{contract.title}</h3>
          <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-black/10 bg-background p-4 text-sm text-zinc-700 dark:border-white/10 dark:text-zinc-300">
            {contract.body}
          </div>
          {flags.signError && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              Type your full name and tick the box to sign.
            </p>
          )}
          <form action={signContractAction} className="mt-4 space-y-3">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="contractId" value={contract.id} />
            <input type="hidden" name="returnTo" value={basePath} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="agree" required className="mt-1" />
              <span>
                I have read and agree to the terms of this agreement on behalf of{" "}
                {sponsor.companyName}.
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                placeholder="Type your full name"
                className="w-64 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-white/20"
              />
              <button
                type="submit"
                className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Sign
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Action needed: outstanding payments */}
      {due.length > 0 && (
        <section className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Payment due
          </h2>
          {multipleOpenPayments && (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-background/60 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              More than one payment request is open. Please wait for the organizer to
              confirm the correct one before paying.
            </p>
          )}
          <ul className="mt-4 space-y-3">
            {due.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatPrice(p.amountCents, p.currency)}
                  </p>
                  {p.description && (
                    <p className="text-sm text-zinc-500">{p.description}</p>
                  )}
                </div>
                {stripeReady && !multipleOpenPayments ? (
                  <form action={startCheckoutAction}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="paymentId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      Pay now
                    </button>
                  </form>
                ) : multipleOpenPayments ? (
                  <span className="text-sm text-zinc-500">Needs organizer review</span>
                ) : (
                  <span className="text-sm text-zinc-500">
                    Online payment not enabled yet
                  </span>
                )}
              </li>
            ))}
          </ul>
          {stripeReady && !multipleOpenPayments && (
            <p className="mt-3 text-xs text-zinc-500">Processed securely by Stripe.</p>
          )}
        </section>
      )}

      {/* At a glance — calm one-line summaries */}
      <section className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/10 dark:divide-white/5 dark:border-white/10">
        {pkg && (
          <Row label="Package">
            <span>
              {pkg.name} · {pkg.tier}
            </span>
            <span className="font-medium tabular-nums">
              {formatPrice(pkg.priceCents, pkg.currency)}
            </span>
          </Row>
        )}

        <Row label="Payment">
          {due.length > 0 ? (
            <span className="text-amber-700 dark:text-amber-400">
              {formatPrice(
                due.reduce((s, p) => s + p.amountCents, 0),
                due[0].currency,
              )}{" "}
              due
            </span>
          ) : paid.length > 0 ? (
            <span className="text-green-700 dark:text-green-400">Paid ✓</span>
          ) : (
            <span className="text-zinc-500">Nothing due</span>
          )}
          {latestReceiptUrl && (
            <a
              href={latestReceiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4 text-zinc-500 hover:text-foreground"
            >
              Receipt →
            </a>
          )}
        </Row>

        <Row label="Materials">
          <span className={materialsDone === DELIVERABLE_TYPES.length ? "text-green-700 dark:text-green-400" : undefined}>
            {materialsDone} of {DELIVERABLE_TYPES.length} received
          </span>
        </Row>

        <Row label="Your details">
          <span className={hasDetails ? "text-zinc-600 dark:text-zinc-400" : "text-amber-700 dark:text-amber-400"}>
            {hasDetails ? "Complete" : "Not added yet"}
          </span>
          <Link
            href={`/invite/${token}/form`}
            className="text-sm underline underline-offset-4 text-zinc-500 hover:text-foreground"
          >
            {hasDetails ? "Edit →" : "Complete →"}
          </Link>
        </Row>

        {contract && (
          <Row label="Contract">
            {contract.status === "SIGNED" ? (
              <span className="text-green-700 dark:text-green-400">
                Signed ✓
                {contract.signedAt
                  ? ` · ${new Date(contract.signedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""}
              </span>
            ) : (
              <span className="text-blue-700 dark:text-blue-400">
                Awaiting your signature
              </span>
            )}
          </Row>
        )}
      </section>

      {isLive && (
        <p className="mt-4 text-sm text-zinc-500">
          You&apos;re live on the{" "}
          <Link href="/sponsors" className="underline underline-offset-4 hover:text-foreground">
            public sponsors page
          </Link>
          .
        </p>
      )}

      {/* Account activation (magic-link visitors without a password yet) */}
      {mode === "token" && !sponsor.passwordHash && sponsor.contactEmail && (
        <section className="mt-8 rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-sm font-semibold">Optional: create a login</h2>
          <p className="mt-1 text-sm text-zinc-500">
            You can skip this and keep using this personal link. Creating a password
            lets you return from Sponsor login later with {sponsor.contactEmail}.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            You can also create this login later from this same link.
          </p>
          {flags.pwError && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              {flags.pwError === "duplicate"
                ? "This email already has an active sponsor account. Sign in from Sponsor login, or ask the organizer to merge the duplicate records."
                : "Password must be at least 8 characters."}
            </p>
          )}
          <form action={setSponsorPasswordAction} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="token" value={token} />
            <input
              type="password"
              name="password"
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="Choose a password"
              className="w-56 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-white/20"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Create login
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-4 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="flex items-center gap-3">{children}</span>
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red";
  children: React.ReactNode;
}) {
  const tones = {
    green: "border-green-600/30 bg-green-600/5 text-green-700 dark:text-green-400",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    red: "border-red-600/30 bg-red-600/5 text-red-700 dark:text-red-400",
  } as const;
  return (
    <div className={`mt-6 rounded-xl border p-4 text-sm ${tones[tone]}`}>{children}</div>
  );
}
