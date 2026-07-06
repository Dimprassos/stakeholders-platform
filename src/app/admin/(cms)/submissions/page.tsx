import { prisma } from "@/lib/prisma";
import { convertSubmissionAction, markSubmissionReviewedAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  REVIEWED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  CONVERTED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  SPAM: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: { packageInterest: { select: { name: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Interest form submissions from the public &ldquo;Become a sponsor&rdquo; page.
          Convert a submission into a candidate to start the outreach pipeline.
        </p>
      </div>

      {submissions.length === 0 ? (
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
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Consent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {submissions.map((s) => (
                <tr key={s.id} className="align-top">
                  <td className="px-4 py-3 font-medium">{s.companyName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <div>{s.contactName}</div>
                    <div className="text-xs">{s.email}</div>
                    {s.phone && <div className="text-xs">{s.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {s.packageInterest?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 max-w-xs text-zinc-600 dark:text-zinc-400">
                    {s.message ? (
                      <p className="line-clamp-3 whitespace-pre-wrap">{s.message}</p>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {s.consentGiven ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_TONE[s.status] ?? "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {s.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "CONVERTED" ? (
                      <span className="text-xs text-green-600">Converted</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <form action={convertSubmissionAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-foreground underline underline-offset-4"
                          >
                            Convert to candidate
                          </button>
                        </form>
                        {s.status === "NEW" && (
                          <form action={markSubmissionReviewedAction}>
                            <input type="hidden" name="id" value={s.id} />
                            <button
                              type="submit"
                              className="text-xs text-zinc-500 underline underline-offset-2 hover:text-foreground"
                            >
                              Mark reviewed
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}