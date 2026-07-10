import Link from "next/link";
import type { Package, Sponsor } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseBenefits } from "@/lib/format";
import { parseDeliverables, DELIVERABLE_TYPES } from "@/lib/deliverables";
import { isStripeConfigured } from "@/lib/stripe";
import {
  startCheckoutAction,
  setSponsorPasswordAction,
  signContractAction,
} from "./actions";
import { PortalShell, type PortalEvent } from "./portal-shell";

// Shared sponsor portal (docs/PLAN.md §16 Phase E) — a branded, professional
// dashboard reached from a magic link (`/invite/[token]`, mode "token") or an
// account login (`/portal`, mode "session"). Structure mirrors how real sponsor
// portals work: a status header, an always-visible onboarding progress tracker
// with actionable steps, an "Action required" area up top, then calm reference
// sections (package, details, documents, support).

export type SponsorWithPackage = Sponsor & { package: Package | null };

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  ACCEPTED: { label: "Accepted", tone: "amber" },
  DETAILS_SUBMITTED: { label: "Details submitted", tone: "blue" },
  CONFIRMED: { label: "Confirmed", tone: "green" },
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
    saved: boolean;
  };
}) {
  const basePath = mode === "session" ? "/portal" : `/invite/${token}`;
  const formHref = `/invite/${token}/form?return=${encodeURIComponent(basePath)}`;

  const [event, payments, contract] = await Promise.all([
    prisma.event.findUnique({
      where: { id: sponsor.eventId },
      select: {
        name: true,
        startDate: true,
        endDate: true,
        venue: true,
        logoUrl: true,
        themeMode: true,
        brandColor: true,
        brandInkColor: true,
        brandAccentColor: true,
      },
    }),
    prisma.payment.findMany({
      where: { sponsorId: sponsor.id, status: { in: ["PENDING", "PAID"] } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contract.findFirst({
      where: { sponsorId: sponsor.id, status: { in: ["SENT", "SIGNED"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const eventName = event?.name ?? "Your event";
  const portalEvent: PortalEvent | null = event
    ? {
        name: event.name,
        logoUrl: event.logoUrl,
        themeMode: event.themeMode,
        brandColor: event.brandColor,
        brandInkColor: event.brandInkColor,
        brandAccentColor: event.brandAccentColor,
      }
    : null;
  const dateLine = event?.startDate
    ? `${event.startDate}${event.endDate ? ` – ${event.endDate}` : ""}`
    : null;

  const pkg = sponsor.package;
  const due = payments.filter((p) => p.status === "PENDING");
  const paid = payments.filter((p) => p.status === "PAID");
  const latestReceiptUrl = paid.length > 0 ? paid[paid.length - 1].receiptUrl : null;
  const stripeReady = isStripeConfigured();
  const multipleOpenPayments = due.length > 1;
  const dueTotal = due.reduce((s, p) => s + p.amountCents, 0);

  const deliverables = parseDeliverables(sponsor.deliverables);
  const materialsDone = DELIVERABLE_TYPES.filter((d) => deliverables[d.key]).length;
  const materialsTotal = DELIVERABLE_TYPES.length;

  const hasDetails = Boolean(
    sponsor.legalName || sponsor.vatNumber || sponsor.billingAddress,
  );
  const needsDetails = !hasDetails;
  const isLive =
    sponsor.status === "CONFIRMED" &&
    sponsor.isPublished &&
    !sponsor.isHiddenFromPublic;

  // ── Onboarding progress tracker (research-backed: 3–7 steps, done/current/
  // upcoming, and every incomplete step maps to a concrete action below). ──
  const rawSteps: { label: string; complete: boolean }[] = [
    { label: "Invitation accepted", complete: true },
    { label: "Company details", complete: hasDetails },
  ];
  if (contract) {
    rawSteps.push({ label: "Agreement signed", complete: contract.status === "SIGNED" });
  }
  if (payments.length > 0) {
    rawSteps.push({ label: "Payment", complete: paid.length > 0 && due.length === 0 });
  }
  rawSteps.push({ label: "Published", complete: isLive });

  let currentTaken = false;
  const steps: { label: string; state: StepState }[] = rawSteps.map((s) => {
    if (s.complete) return { label: s.label, state: "done" };
    if (!currentTaken) {
      currentTaken = true;
      return { label: s.label, state: "current" };
    }
    return { label: s.label, state: "upcoming" };
  });
  const completedCount = rawSteps.filter((s) => s.complete).length;

  const contractSent = contract?.status === "SENT";
  const hasActions = needsDetails || contractSent || due.length > 0;

  const status = STATUS_META[sponsor.status] ?? { label: sponsor.status, tone: "zinc" as Tone };

  return (
    <PortalShell
      event={portalEvent}
      companyName={sponsor.companyName}
      mode={mode}
      homeHref={basePath}
    >
      {/* Hero */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-accent">
            Sponsor portal
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {sponsor.companyName}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            {eventName}
            {dateLine ? ` · ${dateLine}` : ""}
            {event?.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Pill tone={status.tone}>{status.label}</Pill>
          {pkg && (
            <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300">
              {pkg.name} · {pkg.tier}
            </span>
          )}
        </div>
      </section>

      {/* Transient banners */}
      <div className="mt-4 space-y-3">
        {flags.saved && (
          <Banner tone="green">Your details were saved.</Banner>
        )}
        {flags.paid && (
          <Banner tone="green">
            Payment received — thank you! A receipt is on its way.
          </Banner>
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
        {flags.signed && <Banner tone="green">Agreement signed — thank you!</Banner>}
      </div>

      {/* Progress tracker */}
      <section className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-bg)] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Your onboarding</h2>
          <span className="text-xs text-zinc-500">
            {completedCount} of {rawSteps.length} complete
          </span>
        </div>
        <ol className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-1 items-center gap-1">
              <div className="flex shrink-0 items-center gap-2">
                <StepDot state={s.state} index={i} />
                <span
                  className={`whitespace-nowrap text-xs font-medium ${
                    s.state === "upcoming"
                      ? "text-zinc-400 dark:text-zinc-500"
                      : "text-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={`mx-1 h-px min-w-6 flex-1 ${
                    s.state === "done" ? "bg-emerald-500/50" : "bg-black/10 dark:bg-white/10"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Action required */}
      {hasActions && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Action required
          </h2>
          <div className="mt-3 space-y-4">
            {needsDetails && (
              <ActionCard
                title="Complete your company details"
                body="Add billing details, website and materials so the organizer can prepare your sponsor listing and invoice."
              >
                <Link href={formHref} className={primaryBtn}>
                  Complete details
                </Link>
              </ActionCard>
            )}

            {contractSent && contract && (
              <ActionCard title={`Sign: ${contract.title}`}>
                <div className="mb-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[color:var(--line)] bg-background/80 p-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {contract.body}
                </div>
                {flags.signError && (
                  <p className="mb-2 text-sm text-red-700 dark:text-red-400">
                    Type your full name and tick the box to sign.
                  </p>
                )}
                <form action={signContractAction} className="space-y-3">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="contractId" value={contract.id} />
                  <input type="hidden" name="returnTo" value={basePath} />
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="agree" required className="mt-1" />
                    <span>
                      I have read and agree to the terms of this agreement on behalf
                      of {sponsor.companyName}.
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Type your full name to sign"
                      className="w-64 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm text-foreground dark:border-white/20"
                    />
                    <button type="submit" className={primaryBtn}>
                      Sign agreement
                    </button>
                  </div>
                </form>
              </ActionCard>
            )}

            {due.length > 0 && (
              <ActionCard
                title={`Payment due — ${formatPrice(dueTotal, due[0].currency)}`}
              >
                {multipleOpenPayments && (
                  <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                    More than one payment request is open. Please wait for the
                    organizer to confirm the correct one before paying.
                  </p>
                )}
                <ul className="space-y-3">
                  {due.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--line)] bg-background/60 px-4 py-3"
                    >
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
                          <button type="submit" className={primaryBtn}>
                            Pay now
                          </button>
                        </form>
                      ) : multipleOpenPayments ? (
                        <span className="text-sm text-zinc-500">
                          Needs organizer review
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-500">
                          Online payment not enabled yet
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {stripeReady && !multipleOpenPayments && (
                  <p className="mt-3 text-xs text-zinc-500">
                    Processed securely by Stripe.
                  </p>
                )}
              </ActionCard>
            )}
          </div>
        </section>
      )}

      {/* Reference grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {pkg && (
            <Card title="Your package">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{pkg.name}</p>
                  <p className="text-sm text-zinc-500">{pkg.tier}</p>
                </div>
                <p className="text-xl font-semibold tabular-nums">
                  {formatPrice(pkg.priceCents, pkg.currency)}
                </p>
              </div>
              {(() => {
                const benefits = parseBenefits(pkg.benefits);
                return benefits.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm">
                    {benefits.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span aria-hidden className="text-emerald-500">
                          ✓
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null;
              })()}
            </Card>
          )}

          <Card
            title="Company details"
            action={
              <Link href={formHref} className={linkBtn}>
                {hasDetails ? "Edit" : "Complete"}
              </Link>
            }
          >
            {hasDetails ? (
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label="Legal name" value={sponsor.legalName} />
                <Field label="VAT / Tax ID" value={sponsor.vatNumber} />
                <Field label="Billing address" value={sponsor.billingAddress} wide />
                <Field
                  label="Website"
                  value={
                    sponsor.websiteUrl ? (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-accent underline underline-offset-4"
                      >
                        {sponsor.websiteUrl}
                      </a>
                    ) : null
                  }
                />
                <Field
                  label="Public listing"
                  value={sponsor.isHiddenFromPublic ? "Hidden by request" : "Visible"}
                />
                {sponsor.description && (
                  <Field label="Description" value={sponsor.description} wide />
                )}
                {sponsor.logoUrl && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Logo
                    </dt>
                    <dd className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sponsor.logoUrl}
                        alt={`${sponsor.companyName} logo`}
                        className="h-12 w-auto max-w-[12rem] object-contain"
                      />
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">
                You haven&apos;t added your company details yet. These are used for
                your invoice and your public sponsor listing.
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="At a glance">
            <ul className="space-y-3 text-sm">
              <StatRow label="Payment">
                {due.length > 0 ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    {formatPrice(dueTotal, due[0].currency)} due
                  </span>
                ) : paid.length > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Paid ✓</span>
                ) : (
                  <span className="text-zinc-500">Nothing due</span>
                )}
              </StatRow>
              <StatRow label="Materials">
                <span
                  className={
                    materialsDone === materialsTotal && materialsTotal > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-600 dark:text-zinc-300"
                  }
                >
                  {materialsDone} of {materialsTotal} received
                </span>
              </StatRow>
              <StatRow label="Agreement">
                {!contract ? (
                  <span className="text-zinc-500">None yet</span>
                ) : contract.status === "SIGNED" ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Signed ✓</span>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400">Awaiting signature</span>
                )}
              </StatRow>
              <StatRow label="Public page">
                {isLive ? (
                  <Link
                    href="/sponsors"
                    className="text-emerald-600 underline underline-offset-4 dark:text-emerald-400"
                  >
                    Live ✓
                  </Link>
                ) : (
                  <span className="text-zinc-500">Not yet</span>
                )}
              </StatRow>
            </ul>
          </Card>

          {(latestReceiptUrl || contract?.status === "SIGNED") && (
            <Card title="Documents">
              <ul className="space-y-2 text-sm">
                {latestReceiptUrl && (
                  <li>
                    <a
                      href={latestReceiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-accent underline underline-offset-4"
                    >
                      Payment receipt →
                    </a>
                  </li>
                )}
                {contract?.status === "SIGNED" && (
                  <li className="text-zinc-600 dark:text-zinc-300">
                    {contract.title} — signed
                    {contract.signedAt
                      ? ` ${new Date(contract.signedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`
                      : ""}
                    {contract.signedName ? ` by ${contract.signedName}` : ""}
                  </li>
                )}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Account activation (magic-link visitors without a password yet) */}
      {mode === "token" && !sponsor.passwordHash && sponsor.contactEmail && (
        <section className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-bg)] p-6 backdrop-blur-sm">
          <h2 className="text-sm font-semibold">Optional: create a login</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Keep using this personal link, or set a password to return anytime from
            Sponsor login with {sponsor.contactEmail}.
          </p>
          {flags.pwError && (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              {flags.pwError === "duplicate"
                ? "This email already has an active sponsor account. Sign in from Sponsor login, or ask the organizer to merge the duplicate records."
                : "Password must be at least 8 characters."}
            </p>
          )}
          <form
            action={setSponsorPasswordAction}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="token" value={token} />
            <input
              type="password"
              name="password"
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="Choose a password"
              className="w-56 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm text-foreground dark:border-white/20"
            />
            <button type="submit" className={primaryBtn}>
              Create login
            </button>
          </form>
        </section>
      )}
    </PortalShell>
  );
}

// ── Design tokens (shared button/link styles) ──────────────────────────────
const primaryBtn =
  "inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90";
const linkBtn =
  "text-sm font-medium text-brand-accent underline underline-offset-4 hover:opacity-80";

type Tone = "green" | "amber" | "blue" | "red" | "zinc";
type StepState = "done" | "current" | "upcoming";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-bg)] p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionCard({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-accent/40 bg-brand-accent/5 p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      {body && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {value}
      </dd>
    </div>
  );
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{children}</span>
    </li>
  );
}

function StepDot({ state, index }: { state: StepState; index: number }) {
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
        ✓
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-brand-accent text-xs font-semibold text-brand-accent">
        {index + 1}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/15 text-xs font-semibold text-zinc-400 dark:border-white/20">
      {index + 1}
    </span>
  );
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const tones: Record<Tone, string> = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    red: "bg-red-500/10 text-red-700 dark:text-red-400",
    zinc: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
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
    green: "border-emerald-600/30 bg-emerald-600/5 text-emerald-700 dark:text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    red: "border-red-600/30 bg-red-600/5 text-red-700 dark:text-red-400",
  } as const;
  return (
    <div className={`rounded-xl border p-4 text-sm ${tones[tone]}`}>{children}</div>
  );
}
