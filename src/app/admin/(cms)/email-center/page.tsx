import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminEvent } from "@/lib/event";
import { groupThreads, threadParam } from "@/lib/communication";
import { ActionForm } from "../action-form";
import { markReplyReadAction } from "../candidates/[id]/communication-actions";
import { TemplateForm } from "./template-form";
import { DeleteTemplateButton } from "./delete-template-button";
import { ComposeForm } from "./compose-form";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  BOUNCED: "Bounced",
  REPLIED: "Replied",
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  SENT: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  BOUNCED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  REPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const DIRECTION_TONE: Record<string, string> = {
  OUTBOUND: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  INBOUND: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const FILTERS = ["ALL", "UNREAD", "SENT", "DRAFT", "REPLIED", "BOUNCED"] as const;

function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function countByStatus(rows: { status: string }[], status: string): number {
  return rows.filter((row) => row.status === status).length;
}

function countInbound(rows: { direction: string }[]): number {
  return rows.filter((row) => row.direction === "INBOUND").length;
}

function countUnread(rows: { direction: string; readAt: Date | null }[]): number {
  return rows.filter((row) => row.direction === "INBOUND" && !row.readAt).length;
}

export default async function EmailCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const event = await getAdminEvent();
  const eventId = event?.id;
  const { status } = await searchParams;
  const unreadFilter = status === "UNREAD";
  const statusFilter =
    status && FILTERS.includes(status as never) && !["ALL", "UNREAD"].includes(status)
      ? status
      : undefined;

  if (!eventId) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
        Create an event before using the Email Center.
      </div>
    );
  }

  const [allOutreach, outreach, threadRows, templates, recipients] = await Promise.all([
    prisma.outreach.findMany({
      where: { eventId },
      select: { status: true, direction: true, readAt: true },
    }),
    prisma.outreach.findMany({
      where: {
        eventId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(unreadFilter ? { direction: "INBOUND", readAt: null } : {}),
      },
      include: {
        sponsor: { select: { id: true, companyName: true, contactEmail: true } },
        template: { select: { name: true } },
      },
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.outreach.findMany({
      where: { eventId, sponsorId: { not: null } },
      select: {
        id: true,
        sponsorId: true,
        subject: true,
        direction: true,
        readAt: true,
        sentAt: true,
        receivedAt: true,
        createdAt: true,
        sponsor: { select: { id: true, companyName: true, contactEmail: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.emailTemplate.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sponsor.findMany({
      where: { eventId, contactEmail: { not: null } },
      select: { id: true, companyName: true, contactEmail: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const statCards = [
    { label: "Total messages", value: allOutreach.length },
    { label: "Sent", value: countByStatus(allOutreach, "SENT") },
    { label: "Inbound replies", value: countInbound(allOutreach) },
    { label: "Unread replies", value: countUnread(allOutreach) },
  ];
  const threads = groupThreads(threadRows).slice(0, 12);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            {event.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Email Center</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Per-event communication history, reusable templates, and manually logged
            inbound sponsor replies.
          </p>
        </div>
        <Link
          href="/admin/candidates"
          className="rounded-full border border-black/15 px-4 py-2 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
        >
          Send invite from candidates
        </Link>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {item.label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="font-semibold tracking-tight">Compose email</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Send a one-off message to a candidate or any address. It&apos;s logged in
          the history below; in dev you get an Ethereal preview link.
        </p>
        <div className="mt-4">
          <ComposeForm recipients={recipients} templates={templates} />
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="font-semibold tracking-tight">Threads</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Sponsor conversations grouped by recipient and subject.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {threads.length} active
          </span>
        </div>

        {threads.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No sponsor threads yet. Send or receive a sponsor email to start one.
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {threads.map((thread) => (
              <li key={`${thread.sponsorId}:${thread.key}`}>
                <Link
                  href={`/admin/email-center/threads/${thread.sponsorId}?subject=${threadParam(
                    thread.subject,
                  )}`}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span>
                    <span className="font-medium">{thread.subject}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {thread.sponsorName}
                      {thread.sponsorEmail ? ` · ${thread.sponsorEmail}` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {thread.total} message{thread.total === 1 ? "" : "s"}
                    </span>
                    {thread.unread > 0 && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                        {thread.unread} new
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="font-semibold tracking-tight">Outreach history</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Latest 50 messages for the selected event.
            </p>
          </div>
          <nav aria-label="Email status filters" className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active =
                filter === "UNREAD"
                  ? unreadFilter
                  : !unreadFilter && (statusFilter ?? "ALL") === filter;
              const href =
                filter === "ALL" ? "/admin/email-center" : `/admin/email-center?status=${filter}`;
              const label =
                filter === "ALL"
                  ? "All"
                  : filter === "UNREAD"
                    ? "Unread"
                    : statusLabel(filter);
              return (
                <Link
                  key={filter}
                  href={href}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {outreach.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            No email activity yet. Send an invite from the candidate pipeline to create
            the first outreach log.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Template</th>
                  <th className="px-4 py-3 font-medium">Direction</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {outreach.map((item) => {
                  const recipient =
                    item.sponsor?.contactEmail ?? item.prospectEmail ?? "No recipient";
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3">
                        {item.sponsor ? (
                          <Link
                            href={`/admin/candidates/${item.sponsor.id}`}
                            className="font-medium underline-offset-4 hover:text-brand-accent hover:underline"
                          >
                            {item.sponsor.companyName}
                          </Link>
                        ) : (
                          <span className="font-medium">External prospect</span>
                        )}
                        <div className="mt-0.5 text-xs text-zinc-500">{recipient}</div>
                      </td>
                      <td className="max-w-sm px-4 py-3">
                        <div className="font-medium">{item.subject}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                          {item.body}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {item.template?.name ?? "Custom"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            DIRECTION_TONE[item.direction] ?? DIRECTION_TONE.OUTBOUND
                          }`}
                        >
                          {item.direction === "INBOUND" ? "Inbound" : "Outbound"}
                        </span>
                        <span
                          className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_TONE[item.status] ?? STATUS_TONE.DRAFT
                          }`}
                        >
                          {statusLabel(item.status)}
                        </span>
                        {item.direction === "INBOUND" && !item.readAt && (
                          <span className="ml-2 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {fmtDateTime(item.receivedAt ?? item.sentAt ?? item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* The only place an inbound email from an address that
                            matches no sponsor can be cleared: the candidate page
                            and the thread view both need a sponsor, so without
                            this such a reply stays unread — and keeps notifying —
                            forever. */}
                        {item.direction === "INBOUND" && !item.readAt && (
                          <ActionForm action={markReplyReadAction} className="flex justify-end">
                            <input type="hidden" name="messageId" value={item.id} />
                            <button
                              type="submit"
                              className="whitespace-nowrap rounded-full border border-black/15 px-3 py-1 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
                            >
                              Mark read
                            </button>
                          </ActionForm>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight">Templates</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Merge fields currently supported: {"{{event}}"}, {"{{companyName}}"},{" "}
              {"{{contactName}}"}, {"{{packageName}}"}, {"{{link}}"}.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {templates.length} template{templates.length === 1 ? "" : "s"}
          </span>
        </div>

        <details className="mt-5 rounded-lg border border-dashed border-black/15 p-4 dark:border-white/20">
          <summary className="cursor-pointer text-sm font-medium text-brand-accent">
            + New template
          </summary>
          <div className="mt-4">
            <TemplateForm />
          </div>
        </details>

        {templates.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No templates for this event yet — create the first one above.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {templates.map((template) => (
              <article
                key={template.id}
                className="flex flex-col rounded-lg border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {template.subject}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {fmtDateTime(template.updatedAt)}
                  </span>
                </div>
                <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                  {template.body}
                </pre>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-brand-accent hover:underline">
                    Edit template
                  </summary>
                  <div className="mt-3 border-t border-black/10 pt-4 dark:border-white/10">
                    <TemplateForm
                      template={{
                        id: template.id,
                        name: template.name,
                        subject: template.subject,
                        body: template.body,
                      }}
                    />
                  </div>
                </details>

                <div className="mt-3 flex justify-end border-t border-black/5 pt-3 dark:border-white/10">
                  <DeleteTemplateButton id={template.id} name={template.name} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
