import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminEventId } from "@/lib/event";
import { normalizeSubject, threadTitle } from "@/lib/communication";
import { markThreadReadAction } from "../../actions";

export const dynamic = "force-dynamic";

const DIRECTION_BOX: Record<string, string> = {
  OUTBOUND: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900",
  INBOUND: "border-blue-500/30 bg-blue-500/5",
};

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

export default async function EmailThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ sponsorId: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const { sponsorId } = await params;
  const { subject } = await searchParams;
  const subjectKey = subject ? decodeURIComponent(subject) : "";
  if (!subjectKey) notFound();

  const eventId = await getAdminEventId();
  const sponsor = await prisma.sponsor.findFirst({
    where: { id: sponsorId, eventId },
    select: { id: true, companyName: true, contactEmail: true },
  });
  if (!sponsor) notFound();

  const allMessages = await prisma.outreach.findMany({
    where: { eventId, sponsorId: sponsor.id },
    include: { template: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const messages = allMessages.filter((m) => normalizeSubject(m.subject) === subjectKey);
  if (messages.length === 0) notFound();

  const title = threadTitle(messages[0].subject);
  const unread = messages.filter((m) => m.direction === "INBOUND" && !m.readAt).length;
  const returnTo = `/admin/email-center/threads/${sponsor.id}?subject=${encodeURIComponent(
    subjectKey,
  )}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/email-center"
          className="text-sm text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
        >
          ← Email Center
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Thread with{" "}
              <Link
                href={`/admin/candidates/${sponsor.id}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {sponsor.companyName}
              </Link>
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
            {sponsor.contactEmail && (
              <p className="mt-1 text-sm text-zinc-500">{sponsor.contactEmail}</p>
            )}
          </div>
          {unread > 0 && (
            <form action={markThreadReadAction}>
              <input type="hidden" name="sponsorId" value={sponsor.id} />
              <input type="hidden" name="subjectKey" value={subjectKey} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground dark:border-white/20"
              >
                Mark thread read
              </button>
            </form>
          )}
        </div>
      </div>

      <ol className="space-y-4">
        {messages.map((m) => {
          const inbound = m.direction === "INBOUND";
          const unreadMessage = inbound && !m.readAt;
          return (
            <li
              key={m.id}
              className={`rounded-xl border p-5 ${
                DIRECTION_BOX[m.direction] ?? DIRECTION_BOX.OUTBOUND
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {inbound ? "Inbound" : "Outbound"}
                    </span>
                    {unreadMessage && (
                      <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                        New
                      </span>
                    )}
                    {m.template?.name && (
                      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-zinc-500 dark:bg-white/10">
                        {m.template.name}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-sm font-medium">{m.subject}</h2>
                </div>
                <p className="text-xs tabular-nums text-zinc-500">
                  {fmtDateTime(m.receivedAt ?? m.sentAt ?? m.createdAt)}
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {m.body}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
