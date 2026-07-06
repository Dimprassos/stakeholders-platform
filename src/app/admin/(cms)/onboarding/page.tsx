import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { togglePublishAction, confirmSponsorAction } from "./actions";

export const dynamic = "force-dynamic";

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm">{value || <span className="text-zinc-400">—</span>}</p>
    </div>
  );
}

export default async function OnboardingReviewPage() {
  const [pending, reviewed] = await Promise.all([
    prisma.sponsor.findMany({
      where: { status: "DETAILS_SUBMITTED" },
      include: { package: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.sponsor.findMany({
      where: { status: "CONFIRMED" },
      include: { package: true },
      orderBy: { displayOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding review</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review sponsors who submitted their onboarding details. Confirm to move them to
          the published showcase.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Awaiting review ({pending.length})</h2>
        <div className="mt-4 space-y-4">
          {pending.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
              No sponsors awaiting review.
            </p>
          ) : (
            pending.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-black/10 p-5 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{s.companyName}</h3>
                    <p className="text-xs text-zinc-500">
                      Package: {s.package?.name ?? "Unassigned"} · submitted{" "}
                      {s.updatedAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    {s.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Legal name" value={s.legalName} />
                  <Detail label="VAT number" value={s.vatNumber} />
                  <Detail label="Billing address" value={s.billingAddress} />
                  <Detail label="Website" value={s.websiteUrl} />
                  <Detail label="Contact" value={s.contactName} />
                  <Detail label="Email" value={s.contactEmail} />
                  <Detail label="Description" value={s.description} />
                  <Detail label="Logo URL" value={s.logoUrl} />
                  <Detail
                    label="Hide from public"
                    value={s.isHiddenFromPublic ? "Yes" : "No"}
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <form action={confirmSponsorAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      Confirm &amp; publish
                    </button>
                  </form>
                  <form action={togglePublishAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium transition-colors hover:border-foreground dark:border-white/20"
                    >
                      {s.isPublished ? "Unpublish" : "Publish only"}
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Confirmed ({reviewed.length})</h2>
        <div className="mt-4 space-y-3">
          {reviewed.length === 0 ? (
            <p className="rounded-lg border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
              No confirmed sponsors yet.
            </p>
          ) : (
            reviewed.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
              >
                <div>
                  <p className="font-medium">{s.companyName}</p>
                  <p className="text-xs text-zinc-500">
                    {s.package?.name ?? "Unassigned"} ·{" "}
                    {s.isHiddenFromPublic ? "Hidden from public" : "Visible"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.isHiddenFromPublic && (
                    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Sponsor chose to hide
                    </span>
                  )}
                  <form action={togglePublishAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        s.isPublished
                          ? "bg-green-600/10 text-green-700 hover:bg-green-600/20 dark:text-green-400"
                          : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {s.isPublished ? "Published" : "Unpublished"}
                    </button>
                  </form>
                  <Link
                    href="/sponsors"
                    className="text-xs text-zinc-500 underline underline-offset-4 hover:text-foreground"
                  >
                    View public page
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}