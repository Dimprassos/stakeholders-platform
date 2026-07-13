import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminEvent, getAdminEventId } from "@/lib/event";
import { tierLabel, formatPrice } from "@/lib/format";
import { parseDeliverables, deliverableProgress } from "@/lib/deliverables";
import { isStripeConfigured } from "@/lib/stripe";
import { CONTRACT_STATUS_LABEL, defaultContractBody } from "@/lib/contracts";
import { threadParam } from "@/lib/communication";
import {
  blockedReason,
  SPONSOR_STATUS_LABEL as STATUS_LABELS,
} from "@/lib/sponsor-lifecycle";
import { ActionForm } from "../../action-form";
import { toggleTaskAction, deleteTaskAction } from "../actions";
import {
  createPaymentAction,
  markPaymentPaidAction,
  cancelPaymentAction,
  deletePaymentAction,
} from "./payment-actions";
import {
  saveContractAction,
  saveAndSendContractAction,
  reopenContractAction,
  deleteContractAction,
} from "./contract-actions";
import {
  logInboundReplyAction,
  markReplyReadAction,
  markSponsorRepliesReadAction,
} from "./communication-actions";
import { NotesForm } from "./notes-form";
import { DeliverablesForm } from "./deliverables-form";
import { AddTaskForm } from "./add-task-form";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  LEAD: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  INVITE_SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ACCEPTED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  DETAILS_SUBMITTED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const PAYMENT_TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  CANCELLED: "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  REFUNDED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const CONTRACT_TONE: Record<string, string> = {
  DRAFT: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  SIGNED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
};

const DIRECTION_TONE: Record<string, string> = {
  OUTBOUND: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  INBOUND: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 break-words text-sm">
        {value || <span className="text-zinc-400">—</span>}
      </p>
    </div>
  );
}

function fmtDateTime(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.sponsor.findUnique({
    where: { id },
    select: { companyName: true },
  });
  return { title: s ? `${s.companyName} · candidate` : "Candidate" };
}

export default async function SponsorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const paySent = typeof sp.paySent === "string" ? sp.paySent : null;
  const payErr = sp.payerr === "amount";
  const payPendingErr = sp.payerr === "pending";
  const duplicateNotice = sp.duplicate === "1";
  const contractSent =
    typeof sp.contractSent === "string" ? sp.contractSent : null;
  const contractSaved = sp.consaved === "1";
  const contractBodyErr = sp.conerr === "body";
  const replyLogged = sp.replyLogged === "1";
  const communicationBodyErr = sp.commerr === "body";
  const blocked = typeof sp.blocked === "string" ? sp.blocked.slice(0, 300) : null;
  const mailPreview = typeof sp.preview === "string" ? sp.preview : null;
  const eventId = await getAdminEventId();
  const event = await getAdminEvent();
  const eventName = event?.name ?? "Stakeholders Summit 2026";
  // Scope to the admin's current event — a record from another event 404s here.
  const sponsor = await prisma.sponsor.findFirst({
    where: { id, eventId },
    include: { package: true },
  });
  if (!sponsor) notFound();

  const timeline = [
    { label: "Added", value: fmtDateTime(sponsor.createdAt) },
    { label: "Invite issued", value: fmtDateTime(sponsor.tokenIssuedAt) },
    { label: "Invite expires", value: fmtDateTime(sponsor.tokenExpiresAt) },
    { label: "Last updated", value: fmtDateTime(sponsor.updatedAt) },
  ].filter((t): t is { label: string; value: string } => !!t.value);

  const canReview =
    sponsor.status === "DETAILS_SUBMITTED" || sponsor.status === "CONFIRMED";

  // The same rule table the server actions enforce, so each panel is disabled
  // exactly when the action behind it would refuse (@/lib/sponsor-lifecycle).
  const cannotContract = blockedReason(sponsor, "contract");
  const cannotPay = blockedReason(sponsor, "payment");

  const deliverables = parseDeliverables(sponsor.deliverables);
  const { done: dlvDone, total: dlvTotal } = deliverableProgress(deliverables);

  const tasks = await prisma.task.findMany({
    where: { sponsorId: sponsor.id },
    orderBy: [{ done: "asc" }, { createdAt: "asc" }],
  });
  const openTasks = tasks.filter((t) => !t.done).length;
  const todayISO = new Date().toISOString().slice(0, 10);

  const payments = await prisma.payment.findMany({
    where: { sponsorId: sponsor.id },
    orderBy: { createdAt: "desc" },
  });
  const paidTotal = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const pendingTotal = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const paymentCurrency = sponsor.package?.currency ?? "EUR";
  const defaultAmount = sponsor.package
    ? String(sponsor.package.priceCents / 100)
    : "";
  const stripeReady = isStripeConfigured();

  const contracts = await prisma.contract.findMany({
    where: { sponsorId: sponsor.id },
    orderBy: { createdAt: "desc" },
  });
  const editableContract =
    contracts.find((c) => c.status === "DRAFT" || c.status === "SENT") ?? null;
  const signedContracts = contracts.filter((c) => c.status === "SIGNED");
  const contractTitle = editableContract?.title ?? "Sponsorship Agreement";
  const contractBody =
    editableContract?.body ??
    defaultContractBody({
      event: eventName,
      company: sponsor.companyName,
      packageName: sponsor.package?.name,
      price: sponsor.package
        ? formatPrice(sponsor.package.priceCents, sponsor.package.currency)
        : null,
    });
  const contractLocked = editableContract?.status === "SENT";
  const contractFormLocked = contractLocked || !!cannotContract;

  const communications = await prisma.outreach.findMany({
    where: { sponsorId: sponsor.id, eventId },
    include: { template: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const unreadReplies = communications.filter(
    (m) => m.direction === "INBOUND" && !m.readAt,
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/candidates"
          className="text-sm text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
        >
          ← Candidates
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{sponsor.companyName}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_TONE[sponsor.status] ?? "bg-zinc-200 text-zinc-700"
            }`}
          >
            {STATUS_LABELS[sponsor.status] ?? sponsor.status}
          </span>
          {sponsor.status === "CONFIRMED" && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                sponsor.isPublished && !sponsor.isHiddenFromPublic
                  ? "bg-green-600/10 text-green-700 dark:text-green-400"
                  : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {sponsor.isPublished && !sponsor.isHiddenFromPublic
                ? "Public"
                : "Not public"}
            </span>
          )}
        </div>
      </div>

      {blocked && (
        <div className="rounded-xl border border-red-600/30 bg-red-600/5 p-3 text-sm text-red-700 dark:text-red-400">
          {blocked}
        </div>
      )}
      {payErr && (
        <div className="rounded-xl border border-red-600/30 bg-red-600/5 p-3 text-sm text-red-700 dark:text-red-400">
          Enter a valid amount to request a payment.
        </div>
      )}
      {payPendingErr && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          This sponsor already has an open payment request. Mark it paid, cancel it,
          or delete it before requesting another.
        </div>
      )}
      {duplicateNotice && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          A submission with this email already maps to this candidate, so no duplicate
          candidate was created.
        </div>
      )}
      {paySent === "1" && (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          Payment request created and emailed to the sponsor.
          {mailPreview && (
            <>
              {" "}
              <a
                href={mailPreview}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                View email →
              </a>
            </>
          )}
        </div>
      )}
      {paySent === "noemail" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          Payment request created. No email was sent — this sponsor has no active
          portal link or contact email. Send an invite first, or share the payment
          link manually.
        </div>
      )}
      {paySent === "fail" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          Payment request created, but the notification email could not be sent.
        </div>
      )}
      {contractBodyErr && (
        <div className="rounded-xl border border-red-600/30 bg-red-600/5 p-3 text-sm text-red-700 dark:text-red-400">
          Add contract text before saving.
        </div>
      )}
      {contractSaved && (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          Contract draft saved.
        </div>
      )}
      {contractSent === "1" && (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          Contract sent to the sponsor for signature.
          {mailPreview && (
            <>
              {" "}
              <a
                href={mailPreview}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                View email →
              </a>
            </>
          )}
        </div>
      )}
      {contractSent === "noemail" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          Contract marked as awaiting signature. No email was sent — this sponsor
          has no active portal link or contact email.
        </div>
      )}
      {contractSent === "fail" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          Contract marked as awaiting signature, but the notification email could
          not be sent.
        </div>
      )}
      {communicationBodyErr && (
        <div className="rounded-xl border border-red-600/30 bg-red-600/5 p-3 text-sm text-red-700 dark:text-red-400">
          Add the reply text before logging an inbound message.
        </div>
      )}
      {replyLogged && (
        <div className="rounded-xl border border-green-600/30 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          Inbound reply logged in the communication timeline.
        </div>
      )}

      {/* Profile */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Profile
          </h2>
          {canReview && (
            <Link
              href={`/admin/onboarding?focus=${sponsor.id}`}
              className="text-xs text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
            >
              Onboarding review →
            </Link>
          )}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Contact" value={sponsor.contactName} />
          <Detail label="Email" value={sponsor.contactEmail} />
          <Detail
            label="Package"
            value={
              sponsor.package
                ? `${sponsor.package.name} (${tierLabel(sponsor.package.tier)})`
                : null
            }
          />
          <Detail label="Legal name" value={sponsor.legalName} />
          <Detail label="VAT number" value={sponsor.vatNumber} />
          <Detail label="Billing address" value={sponsor.billingAddress} />
          <Detail label="Website" value={sponsor.websiteUrl} />
          <Detail label="Description" value={sponsor.description} />
          <Detail label="Logo URL" value={sponsor.logoUrl} />
        </div>
        {sponsor.logoUrl && (
          <div className="mt-5 flex h-16 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sponsor.logoUrl}
              alt={sponsor.companyName}
              className="max-h-16 max-w-[12rem] object-contain"
            />
          </div>
        )}
      </section>

      {/* Communication timeline */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Communication
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Sent emails plus manually logged inbound replies for this sponsor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unreadReplies > 0 && (
              <span className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                {unreadReplies} unread
              </span>
            )}
            {unreadReplies > 0 && (
              <ActionForm action={markSponsorRepliesReadAction} className="flex">
                <input type="hidden" name="sponsorId" value={sponsor.id} />
                <button
                  type="submit"
                  className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
                >
                  Mark all read
                </button>
              </ActionForm>
            )}
          </div>
        </div>

        <details className="mt-4 rounded-lg border border-dashed border-black/15 p-4 dark:border-white/20">
          <summary className="cursor-pointer text-sm font-medium text-brand-accent">
            Log inbound reply
          </summary>
          <form action={logInboundReplyAction} className="mt-4 space-y-3">
            <input type="hidden" name="sponsorId" value={sponsor.id} />
            <label className="block text-xs font-medium text-zinc-500">
              Subject
              <input
                name="subject"
                type="text"
                maxLength={200}
                placeholder={`Reply from ${sponsor.companyName}`}
                className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-white/20"
              />
            </label>
            <label className="block text-xs font-medium text-zinc-500">
              Reply text
              <textarea
                name="body"
                required
                rows={4}
                maxLength={5000}
                placeholder="Paste the sponsor's email reply here."
                className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm leading-6 text-foreground dark:border-white/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Log reply
            </button>
          </form>
        </details>

        {communications.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No communication logged yet. Sent invites, payment requests, contracts,
            custom emails and inbound replies will appear here.
          </p>
        ) : (
          <ol className="mt-5 space-y-3">
            {communications.map((m) => {
              const inbound = m.direction === "INBOUND";
              const unread = inbound && !m.readAt;
              const happenedAt = m.receivedAt ?? m.sentAt ?? m.createdAt;
              return (
                <li
                  key={m.id}
                  className={`rounded-lg border p-4 ${
                    unread
                      ? "border-blue-600/30 bg-blue-600/5"
                      : "border-black/10 dark:border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            DIRECTION_TONE[m.direction] ?? DIRECTION_TONE.OUTBOUND
                          }`}
                        >
                          {inbound ? "Inbound" : "Outbound"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_TONE[m.status] ?? STATUS_TONE.DRAFT
                          }`}
                        >
                          {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                        </span>
                        {unread && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                            New
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-medium">{m.subject}</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                        {m.body}
                      </p>
                      {m.template?.name && (
                        <p className="mt-2 text-xs text-zinc-500">
                          Template: {m.template.name}
                        </p>
                      )}
                      <Link
                        href={`/admin/email-center/threads/${sponsor.id}?subject=${threadParam(
                          m.subject,
                        )}`}
                        className="mt-2 inline-block text-xs text-zinc-500 underline underline-offset-4 hover:text-foreground"
                      >
                        View thread →
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">{fmtDateTime(happenedAt)}</p>
                      {unread && (
                        <ActionForm action={markReplyReadAction} className="mt-2 flex justify-end">
                          <input type="hidden" name="messageId" value={m.id} />
                          <button
                            type="submit"
                            className="text-xs text-zinc-500 underline underline-offset-4 hover:text-foreground"
                          >
                            Mark read
                          </button>
                        </ActionForm>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Deliverables checklist */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Deliverables
          </h2>
          <span className="text-xs font-medium text-zinc-500">
            {dlvDone}/{dlvTotal}
          </span>
        </div>
        <div className="mt-4">
          <DeliverablesForm sponsorId={sponsor.id} initial={deliverables} />
        </div>
      </section>

      {/* Contracts */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Contracts
          </h2>
          {editableContract && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                CONTRACT_TONE[editableContract.status] ?? "bg-zinc-200 text-zinc-700"
              }`}
            >
              {CONTRACT_STATUS_LABEL[editableContract.status] ?? editableContract.status}
            </span>
          )}
        </div>

        <form action={saveContractAction} className="mt-4 space-y-3">
          <input type="hidden" name="sponsorId" value={sponsor.id} />
          {editableContract && (
            <input type="hidden" name="contractId" value={editableContract.id} />
          )}
          <label className="block text-xs font-medium text-zinc-500">
            Title
            <input
              name="title"
              type="text"
              required
              maxLength={120}
              defaultValue={contractTitle}
              disabled={contractFormLocked}
              className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground disabled:opacity-60 dark:border-white/20"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Agreement text
            <textarea
              name="body"
              required
              rows={12}
              defaultValue={contractBody}
              disabled={contractFormLocked}
              className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm leading-6 text-foreground disabled:opacity-60 dark:border-white/20"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={contractFormLocked}
              title={cannotContract ?? undefined}
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {contractLocked
                ? "Awaiting signature"
                : editableContract
                  ? "Save draft"
                  : "Create draft"}
            </button>
            {!contractLocked && (
              <button
                type="submit"
                formAction={saveAndSendContractAction}
                disabled={!!cannotContract}
                title={cannotContract ?? undefined}
                className="rounded-full border border-blue-600/40 px-4 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:border-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400"
              >
                Save & send for signature
              </button>
            )}
            <p className="text-xs text-zinc-500">
              {cannotContract
                ? cannotContract
                : contractLocked
                  ? "Move it back to draft before editing the agreement text."
                  : "The sponsor sees this in their portal once you send it."}
            </p>
          </div>
        </form>

        {editableContract && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4 dark:border-white/5">
            {editableContract.status === "SENT" && (
              <ActionForm action={reopenContractAction} className="flex">
                <input type="hidden" name="contractId" value={editableContract.id} />
                <button
                  type="submit"
                  className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
                >
                  Move back to draft
                </button>
              </ActionForm>
            )}
            <ActionForm action={deleteContractAction} className="flex">
              <input type="hidden" name="contractId" value={editableContract.id} />
              <button
                type="submit"
                className="text-xs text-zinc-500 underline underline-offset-4 hover:text-red-600"
              >
                Delete unsigned contract
              </button>
            </ActionForm>
          </div>
        )}

        {signedContracts.length > 0 && (
          <div className="mt-5 border-t border-black/5 pt-4 dark:border-white/5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Signed agreements
            </h3>
            <ul className="mt-3 space-y-2">
              {signedContracts.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-green-600/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      Signed by {c.signedName ?? "sponsor"}
                      {c.signedAt
                        ? ` · ${fmtDateTime(c.signedAt)}`
                        : ""}
                      {c.signedIp ? ` · IP ${c.signedIp}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                    Signed
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Payments */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Payments
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-green-700 dark:text-green-400">
              {formatPrice(paidTotal, paymentCurrency)} paid
            </span>
            {pendingTotal > 0 && (
              <span className="text-amber-700 dark:text-amber-400">
                {formatPrice(pendingTotal, paymentCurrency)} pending
              </span>
            )}
          </div>
        </div>

        {!stripeReady && (
          <p className="mt-3 rounded-lg border border-dashed border-black/10 px-3 py-2 text-xs text-zinc-500 dark:border-white/10">
            Stripe is not configured, so sponsors can&apos;t pay online yet. Set{" "}
            <code>STRIPE_SECRET_KEY</code> in <code>.env</code> — meanwhile you can
            still record payments as paid manually.
          </p>
        )}

        {payments.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No payment requests yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-black/5 py-2 last:border-0 dark:border-white/5"
              >
                <span className="font-medium tabular-nums">
                  {formatPrice(p.amountCents, p.currency)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    PAYMENT_TONE[p.status] ?? "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                </span>
                <span className="text-xs text-zinc-500">
                  {p.description ? `${p.description} · ` : ""}
                  {p.method ? `${p.method} · ` : ""}
                  {p.status === "PAID" && p.paidAt
                    ? `paid ${fmtDay(p.paidAt.toISOString().slice(0, 10))}`
                    : `raised ${fmtDay(p.createdAt.toISOString().slice(0, 10))}`}
                </span>
                {p.receiptUrl && (
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
                  >
                    Receipt →
                  </a>
                )}
                {p.status !== "PAID" && p.status !== "CANCELLED" && (
                  <span className="ml-auto flex items-center gap-2">
                    <ActionForm action={markPaymentPaidAction} className="flex">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-black/15 px-2.5 py-1 text-xs font-medium transition-colors hover:border-green-600 hover:text-green-700 dark:border-white/20"
                      >
                        Mark paid
                      </button>
                    </ActionForm>
                    <ActionForm action={cancelPaymentAction} className="flex">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs text-zinc-500 underline underline-offset-4 hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </ActionForm>
                    <ActionForm action={deletePaymentAction} className="flex">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <button
                        type="submit"
                        aria-label="Delete payment request"
                        title="Delete payment request"
                        className="text-lg leading-none text-zinc-400 transition-colors hover:text-red-600"
                      >
                        ×
                      </button>
                    </ActionForm>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {cannotPay ? (
          <p className="mt-4 rounded-lg border border-dashed border-black/10 px-3 py-2 text-xs text-zinc-500 dark:border-white/10">
            {cannotPay}
          </p>
        ) : pendingTotal > 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-black/10 px-3 py-2 text-xs text-zinc-500 dark:border-white/10">
            Resolve the open pending payment above before requesting another one.
          </p>
        ) : (
          <form
            action={createPaymentAction}
            className="mt-4 flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="sponsorId" value={sponsor.id} />
            <input type="hidden" name="currency" value={paymentCurrency} />
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Amount ({paymentCurrency})
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={defaultAmount}
                className="w-32 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-white/20"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-500">
              Description (optional)
              <input
                name="description"
                type="text"
                maxLength={200}
                placeholder="e.g. Gold package — full sponsorship"
                className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-foreground dark:border-white/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Request payment
            </button>
          </form>
        )}
      </section>

      {/* Tasks */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Tasks
          </h2>
          <span className="text-xs font-medium text-zinc-500">{openTasks} open</span>
        </div>

        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No tasks yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tasks.map((t) => {
              const overdue = !!t.dueDate && !t.done && t.dueDate < todayISO;
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <ActionForm action={toggleTaskAction} className="flex">
                    <input type="hidden" name="taskId" value={t.id} />
                    <button
                      type="submit"
                      aria-label={t.done ? "Mark as not done" : "Mark as done"}
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        t.done
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-black/25 text-transparent hover:border-foreground dark:border-white/30"
                      }`}
                    >
                      ✓
                    </button>
                  </ActionForm>
                  <div className="flex-1 text-sm">
                    <span className={t.done ? "text-zinc-400 line-through" : undefined}>
                      {t.title}
                    </span>
                    {t.dueDate && (
                      <span
                        className={`ml-2 text-xs ${
                          overdue ? "text-red-600 dark:text-red-400" : "text-zinc-500"
                        }`}
                      >
                        due {fmtDay(t.dueDate)}
                        {overdue ? " · overdue" : ""}
                      </span>
                    )}
                  </div>
                  <ActionForm action={deleteTaskAction} className="flex">
                    <input type="hidden" name="taskId" value={t.id} />
                    <button
                      type="submit"
                      aria-label="Delete task"
                      title="Delete task"
                      className="text-lg leading-none text-zinc-400 transition-colors hover:text-red-600"
                    >
                      ×
                    </button>
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        )}

        <AddTaskForm sponsorId={sponsor.id} />
      </section>

      {/* Activity timeline */}
      {timeline.length > 0 && (
        <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Activity
          </h2>
          <dl className="mt-4 space-y-2">
            {timeline.map((t) => (
              <div
                key={t.label}
                className="flex items-baseline justify-between gap-4 border-b border-black/5 py-2 last:border-0 dark:border-white/5"
              >
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">{t.label}</dt>
                <dd className="text-sm font-medium tabular-nums">{t.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Organizer notes */}
      <section className="rounded-xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Organizer notes
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Private — visible only to admins, never shown to the sponsor or the public.
        </p>
        <div className="mt-4">
          <NotesForm sponsorId={sponsor.id} initialNotes={sponsor.notes ?? ""} />
        </div>
      </section>
    </div>
  );
}
