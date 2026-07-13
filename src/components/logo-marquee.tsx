import type { Sponsor } from "@prisma/client";

/**
 * A continuously scrolling strip of confirmed sponsor logos — the "trusted by"
 * ticker every conference site has. Pure CSS (see `.marquee` in globals.css):
 * the track holds the items twice and slides by exactly -50%, so the loop is
 * seamless. Hovering (or tabbing into a link) pauses it.
 */

type MarqueeSponsor = Pick<Sponsor, "id" | "companyName" | "logoUrl" | "websiteUrl">;

/** One lap should feel unhurried regardless of how many logos there are. */
const SECONDS_PER_LOGO = 6;
/** Too few logos leaves visible gaps, so repeat the list until the track fills. */
const MIN_ITEMS_PER_LAP = 6;

function Logo({ sponsor }: { sponsor: MarqueeSponsor }) {
  const mark = sponsor.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sponsor.logoUrl}
      alt={sponsor.companyName}
      loading="lazy"
      decoding="async"
      className="max-h-10 max-w-36 object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
    />
  ) : (
    <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-foreground">
      {sponsor.companyName}
    </span>
  );

  if (!sponsor.websiteUrl) return mark;

  return (
    <a
      href={sponsor.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
    >
      {mark}
    </a>
  );
}

export function LogoMarquee({ sponsors }: { sponsors: MarqueeSponsor[] }) {
  if (sponsors.length === 0) return null;

  const lap: MarqueeSponsor[] = [];
  while (lap.length < MIN_ITEMS_PER_LAP) lap.push(...sponsors);
  const duration = `${lap.length * SECONDS_PER_LOGO}s`;

  // Two identical laps: the first is the real content, the second exists only so
  // the -50% slide wraps without a gap — it's hidden from assistive tech.
  const laps: { key: string; hidden: boolean }[] = [
    { key: "a", hidden: false },
    { key: "b", hidden: true },
  ];

  return (
    <div className="marquee py-6">
      <ul
        className="marquee-track"
        style={{ "--marquee-duration": duration } as React.CSSProperties}
      >
        {laps.flatMap(({ key, hidden }) =>
          lap.map((sponsor, i) => (
            <li
              key={`${key}-${i}-${sponsor.id}`}
              aria-hidden={hidden || undefined}
              className="flex shrink-0 items-center justify-center px-8"
            >
              <Logo sponsor={sponsor} />
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
