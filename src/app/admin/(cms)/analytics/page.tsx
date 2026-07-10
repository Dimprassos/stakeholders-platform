import Link from "next/link";
import { getAdminEventId } from "@/lib/event";
import { getAnalytics, type FunnelStage } from "@/lib/analytics";
import { formatPrice, tierLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Analytics" };

function pct(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export default async function AnalyticsPage() {
  const eventId = await getAdminEventId();
  const a = await getAnalytics(eventId);

  const totalCommitted = a.revenue.reduce((s, r) => s + r.committedCents, 0);
  const funnelTop = a.funnel[0]?.reached ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Conversion, revenue and package availability for this event.
        </p>
      </div>

      {/* Revenue headline */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Revenue</h2>
        {a.revenue.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
            No packages assigned yet — assign packages to candidates to see revenue.
          </p>
        ) : (
          a.revenue.map((r) => (
            <div
              key={r.currency}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <RevenueCard
                label="Collected"
                sub="Paid (Stripe / manual)"
                value={formatPrice(r.collectedCents, r.currency)}
                tone="text-emerald-700 dark:text-emerald-400"
              />
              <RevenueCard
                label="Committed"
                sub="Confirmed sponsors"
                value={formatPrice(r.committedCents, r.currency)}
                tone="text-green-700 dark:text-green-400"
              />
              <RevenueCard
                label="In pipeline"
                sub="Accepted, not yet confirmed"
                value={formatPrice(r.pipelineCents, r.currency)}
                tone="text-amber-700 dark:text-amber-400"
              />
              <RevenueCard
                label="Potential"
                sub="Invited, awaiting reply"
                value={formatPrice(r.potentialCents, r.currency)}
                tone="text-zinc-600 dark:text-zinc-400"
              />
            </div>
          ))
        )}
      </section>

      {/* Conversion funnel */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Conversion funnel</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Invited → Confirmed:{" "}
            <span className="font-semibold text-foreground">
              {pct(a.inviteToConfirmed)}
            </span>
            {a.declined > 0 && (
              <span className="ml-3 text-red-700 dark:text-red-400">
                {a.declined} declined
              </span>
            )}
          </p>
        </div>

        {funnelTop === 0 ? (
          <p className="rounded-xl border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
            No candidates yet.
          </p>
        ) : (
          <div className="space-y-2">
            {a.funnel.map((stage) => (
              <FunnelRow key={stage.status} stage={stage} top={funnelTop} />
            ))}
          </div>
        )}
      </section>

      {/* Revenue by tier */}
      {a.tiers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Committed revenue by tier</h2>
          <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-medium">Tier</th>
                  <th className="px-4 py-3 font-medium">Confirmed</th>
                  <th className="px-4 py-3 text-right font-medium">Committed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {a.tiers.map((t) => (
                  <tr key={t.tier}>
                    <td className="px-4 py-3 font-medium">{tierLabel(t.tier)}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {t.confirmed}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatPrice(t.committedCents, t.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {a.revenue.length === 1 && (
                <tfoot>
                  <tr className="border-t border-black/10 font-medium dark:border-white/10">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {a.tiers.reduce((s, t) => s + t.confirmed, 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatPrice(totalCommitted, a.revenue[0].currency)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      )}

      {/* Package availability */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Package availability</h2>
        {a.packages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/10 p-6 text-sm text-zinc-500 dark:border-white/10">
            No packages yet.{" "}
            <Link href="/admin/packages" className="underline underline-offset-4">
              Create one →
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {a.packages.map((p) => {
              const full =
                p.slotsTotal != null ? Math.min(p.taken / p.slotsTotal, 1) : null;
              const isFull = p.slotsTotal != null && p.taken >= p.slotsTotal;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-black/10 p-5 dark:border-white/10"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{p.name}</p>
                    <span className="text-xs text-zinc-500">
                      {formatPrice(p.priceCents, p.currency)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      {full != null && (
                        <div
                          className={`h-full rounded-full ${
                            isFull ? "bg-red-500" : "bg-brand"
                          }`}
                          style={{ width: `${full * 100}%` }}
                        />
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {p.slotsTotal != null
                        ? `${p.taken} / ${p.slotsTotal}${isFull ? " · full" : ""}`
                        : `${p.taken} · unlimited`}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    {p.confirmed} confirmed ·{" "}
                    {formatPrice(p.committedCents, p.currency)} committed
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending work */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Needs attention</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <PendingCard
            label="Awaiting review"
            value={a.pending.awaitingReview}
            href="/admin/onboarding"
            tone={a.pending.awaitingReview > 0 ? "text-amber-700 dark:text-amber-400" : undefined}
          />
          <PendingCard
            label="New submissions"
            value={a.pending.newSubmissions}
            href="/admin/submissions"
            tone={a.pending.newSubmissions > 0 ? "text-blue-700 dark:text-blue-400" : undefined}
          />
          <PendingCard
            label="Unread replies"
            value={a.pending.unreadReplies}
            href="/admin/email-center?status=UNREAD"
            tone={a.pending.unreadReplies > 0 ? "text-blue-700 dark:text-blue-400" : undefined}
          />
          <PendingCard
            label="Open tasks"
            value={a.pending.openTasks}
            href="/admin/candidates"
          />
          <PendingCard
            label="Overdue tasks"
            value={a.pending.overdueTasks}
            href="/admin/candidates"
            tone={a.pending.overdueTasks > 0 ? "text-red-700 dark:text-red-400" : undefined}
          />
        </div>
      </section>
    </div>
  );
}

function RevenueCard({
  label,
  sub,
  value,
  tone,
}: {
  label: string;
  sub: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-5 dark:border-white/10">
      <p className={`text-2xl font-semibold tracking-tight tabular-nums ${tone}`}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium">{label}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function FunnelRow({ stage, top }: { stage: FunnelStage; top: number }) {
  const width = top > 0 ? (stage.reached / top) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
        {stage.label}
      </div>
      <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
        <div
          className="flex h-full items-center rounded-lg bg-brand/25 px-3"
          style={{ width: `${Math.max(width, 6)}%` }}
        >
          <span className="text-sm font-semibold tabular-nums">{stage.reached}</span>
        </div>
      </div>
      <div className="w-14 shrink-0 text-right text-xs text-zinc-500">
        {stage.stepRate != null ? `${Math.round(stage.stepRate * 100)}%` : ""}
      </div>
    </div>
  );
}

function PendingCard({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-black/10 p-4 transition-colors hover:border-foreground dark:border-white/10"
    >
      <p className={`text-3xl font-semibold tracking-tight ${tone ?? ""}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
    </Link>
  );
}
