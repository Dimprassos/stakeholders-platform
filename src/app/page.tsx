export default function Home() {
  const sections = [
    {
      title: "Sponsorship packages",
      description: "Tiers, benefits and pricing for prospective sponsors.",
      status: "Phase 1",
    },
    {
      title: "Sponsors showcase",
      description: "Confirmed partners, grouped by tier.",
      status: "Phase 1",
    },
    {
      title: "Organizer CMS",
      description: "Manage packages, sponsors, submissions and outreach.",
      status: "Phase 2",
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-3xl">
        <span className="inline-block rounded-full border border-black/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Foundations · Phase 0
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Sponsorship Platform
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Present sponsorship packages, reach out to potential sponsors by email,
          collect interest, and showcase confirmed partners — all from one place.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-black/10 p-5 dark:border-white/15"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {s.status}
              </div>
              <h2 className="mt-2 text-base font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
