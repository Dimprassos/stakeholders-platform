import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddCandidateForm } from "./add-candidate-form";
import { SendInviteForm } from "./invite-button";
import { ActionForm } from "../action-form";
import {
  assignPackageAction,
  setStatusAction,
  togglePublishAction,
} from "./actions";
import { PIPELINE_STATUSES } from "./types";

export const dynamic = "force-dynamic";

export type PackageOption = { id: string; name: string; tier: string };

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

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const validStatus =
    status && PIPELINE_STATUSES.includes(status as never) ? (status as string) : undefined;

  const [sponsors, packages] = await Promise.all([
    prisma.sponsor.findMany({
      where: validStatus ? { status: validStatus } : undefined,
      include: { package: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, tier: true },
    }),
  ]);

  const pkgOptions: PackageOption[] = packages;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            The sponsorship pipeline. Add prospects, assign packages and track status.
          </p>
        </div>
        <AddCandidateForm packages={pkgOptions} />
      </div>

      {validStatus && (
        <p className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900">
          Filtering by <strong>{STATUS_LABELS[validStatus]}</strong>.{" "}
          <Link href="/admin/candidates" className="underline underline-offset-4">
            Show all
          </Link>
        </p>
      )}

      {sponsors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
          No candidates {validStatus ? "in this stage" : "yet"}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {sponsors.map((s) => (
                <tr key={s.id} className="align-middle">
                  <td className="px-4 py-3 font-medium">{s.companyName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {s.contactName ? (
                      <div>
                        <div>{s.contactName}</div>
                        {s.contactEmail && <div className="text-xs">{s.contactEmail}</div>}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ActionForm action={assignPackageAction} className="inline-block">
                      <input type="hidden" name="id" value={s.id} />
                      <select
                        key={s.packageId ?? "none"}
                        name="packageId"
                        defaultValue={s.packageId ?? ""}
                        className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs dark:border-white/20"
                      >
                        <option value="">None</option>
                        {pkgOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="ml-1 text-xs text-zinc-500 underline underline-offset-2 hover:text-foreground"
                      >
                        Set
                      </button>
                    </ActionForm>
                  </td>
                  <td className="px-4 py-3">
                    <ActionForm action={setStatusAction} className="inline-flex items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <select
                        key={s.status}
                        name="status"
                        defaultValue={s.status}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_TONE[s.status] ?? "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {PIPELINE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABELS[st]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs text-zinc-500 underline underline-offset-2 hover:text-foreground"
                      >
                        Set
                      </button>
                    </ActionForm>
                  </td>
                  <td className="px-4 py-3">
                    <ActionForm action={togglePublishAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          s.isPublished
                            ? "bg-green-600/10 text-green-700 hover:bg-green-600/20 dark:text-green-400"
                            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {s.isPublished ? "Published" : "Hidden"}
                      </button>
                    </ActionForm>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {s.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  {/* Onboarding details (legal name / VAT / etc) Phase 3 — for now just a link */}
                  <td className="px-4 py-3 text-right">
                    {s.status === "DETAILS_SUBMITTED" || s.status === "CONFIRMED" ? (
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/onboarding?focus=${s.id}`}
                          className="text-zinc-600 underline underline-offset-4 hover:text-foreground dark:text-zinc-400"
                        >
                          Review
                        </Link>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <SendInviteForm
                          sponsorId={s.id}
                          disabled={!s.packageId || !s.contactEmail}
                        />
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