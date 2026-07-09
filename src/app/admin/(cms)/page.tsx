import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminEventId } from "@/lib/event";
import { RemindersPanel } from "./reminders-panel";

export const dynamic = "force-dynamic";

const PIPELINE: { status: string; label: string; tone: string }[] = [
  { status: "LEAD", label: "Leads", tone: "text-zinc-700 dark:text-zinc-300" },
  { status: "INVITE_SENT", label: "Invite sent", tone: "text-blue-700 dark:text-blue-400" },
  { status: "ACCEPTED", label: "Accepted", tone: "text-indigo-700 dark:text-indigo-400" },
  { status: "DETAILS_SUBMITTED", label: "Details submitted", tone: "text-amber-700 dark:text-amber-400" },
  { status: "CONFIRMED", label: "Confirmed", tone: "text-green-700 dark:text-green-400" },
  { status: "DECLINED", label: "Declined", tone: "text-red-700 dark:text-red-400" },
];

function formatDate(value: Date): string {
  return value.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const eventId = await getAdminEventId();
  const [statusGroups, submissions, packageCount, publishedCount, submissionCount] =
    await Promise.all([
      prisma.sponsor.groupBy({ by: ["status"], _count: true, where: { eventId } }),
      prisma.submission.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { packageInterest: { select: { name: true } } },
      }),
      prisma.package.count({ where: { eventId } }),
      prisma.sponsor.count({ where: { eventId, isPublished: true } }),
      prisma.submission.count({ where: { eventId } }),
    ]);

  const counts = new Map<string, number>(
    statusGroups.map((g) => [g.status, g._count]),
  );
  const recentSubmissions = submissions;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sponsorship funnel at a glance.
        </p>
      </div>

      <RemindersPanel eventId={eventId} />

      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PIPELINE.map((p) => {
            const count = counts.get(p.status) ?? 0;
            return (
              <Link
                key={p.status}
                href={`/admin/candidates?status=${p.status}`}
                className="rounded-xl border border-black/10 p-4 transition-colors hover:border-foreground dark:border-white/10"
              >
                <p className={`text-3xl font-semibold tracking-tight ${p.tone}`}>{count}</p>
                <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {p.label}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active packages" value={packageCount} href="/admin/packages" />
        <StatCard label="Published sponsors" value={publishedCount} href="/sponsors" />
        <StatCard label="Interest submissions" value={submissionCount} href="/admin/submissions" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent interest submissions</h2>
          <Link
            href="/admin/submissions"
            className="text-sm text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
          >
            View all
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
            No submissions yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Interest</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {recentSubmissions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">{s.companyName}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <div>{s.contactName}</div>
                      <div className="text-xs">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {s.packageInterest?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-black/10 p-5 transition-colors hover:border-foreground dark:border-white/10"
    >
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
    </Link>
  );
}