import type { Metadata } from "next";
import { getCurrentEvent } from "@/lib/event";
import { parseFaq, parseDeadlines } from "@/lib/event-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ & event details",
  description: "Key dates, frequently asked questions and event policies.",
};

function formatDeadline(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export default async function FaqPage() {
  const event = await getCurrentEvent();
  const faq = event ? parseFaq(event.faq) : [];
  const deadlines = event ? parseDeadlines(event.deadlines) : [];

  const policies = [
    { title: "Terms of participation", body: event?.termsText },
    { title: "Privacy policy", body: event?.privacyText },
    { title: "Cancellation policy", body: event?.cancellationText },
  ].filter((p): p is { title: string; body: string } => !!p.body);

  const hasContent = faq.length > 0 || deadlines.length > 0 || policies.length > 0;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-accent">
        Good to know
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        FAQ &amp; event details
      </h1>

      {!hasContent && (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          No additional details have been published yet. Check back soon, or reach out via
          the &ldquo;Become a sponsor&rdquo; form.
        </p>
      )}

      {deadlines.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Key dates</h2>
          <dl className="mt-4 space-y-2">
            {deadlines.map((d, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 border-b border-black/5 py-2 dark:border-white/5">
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">{d.label}</dt>
                <dd className="text-sm font-medium">{formatDeadline(d.date)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {faq.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          <dl className="mt-4 space-y-6">
            {faq.map((f, i) => (
              <div key={i}>
                <dt className="font-medium">{f.question}</dt>
                <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {policies.length > 0 && (
        <div className="mt-10 space-y-8">
          {policies.map((p) => (
            <div key={p.title}>
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
