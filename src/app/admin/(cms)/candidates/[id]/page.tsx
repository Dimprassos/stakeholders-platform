import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminEventId } from "@/lib/event";
import { tierLabel } from "@/lib/format";
import { parseDeliverables, deliverableProgress } from "@/lib/deliverables";
import { ActionForm } from "../../action-form";
import { toggleTaskAction, deleteTaskAction } from "../actions";
import { NotesForm } from "./notes-form";
import { DeliverablesForm } from "./deliverables-form";
import { AddTaskForm } from "./add-task-form";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead",
  INVITE_SENT: "Invite sent",
  ACCEPTED: "Accepted",
  DETAILS_SUBMITTED: "Details submitted",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
};

const STATUS_TONE: Record<string, string> = {
  LEAD: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  INVITE_SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ACCEPTED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  DETAILS_SUBMITTED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = await getAdminEventId();
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

  const deliverables = parseDeliverables(sponsor.deliverables);
  const { done: dlvDone, total: dlvTotal } = deliverableProgress(deliverables);

  const tasks = await prisma.task.findMany({
    where: { sponsorId: sponsor.id },
    orderBy: [{ done: "asc" }, { createdAt: "asc" }],
  });
  const openTasks = tasks.filter((t) => !t.done).length;
  const todayISO = new Date().toISOString().slice(0, 10);

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
