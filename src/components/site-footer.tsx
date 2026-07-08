import { getCurrentEvent } from "@/lib/event";

const SOCIAL_LABELS = {
  websiteUrl: "Website",
  twitterUrl: "X / Twitter",
  linkedinUrl: "LinkedIn",
  instagramUrl: "Instagram",
  facebookUrl: "Facebook",
} as const;

export async function SiteFooter() {
  const event = await getCurrentEvent();
  const name = event?.name ?? "Stakeholders Summit 2026";
  const socialLinks: { label: string; href: string }[] = [];
  if (event) {
    for (const key of Object.keys(SOCIAL_LABELS) as (keyof typeof SOCIAL_LABELS)[]) {
      const href = event[key];
      if (href) socialLinks.push({ label: SOCIAL_LABELS[key], href });
    }
  }

  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl space-y-3 px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          © {new Date().getFullYear()} {name} · Interested in partnering?{" "}
          <a href="/become-a-sponsor" className="underline underline-offset-4 hover:text-foreground">
            Become a sponsor
          </a>{" "}
          · <a href="/faq" className="underline underline-offset-4 hover:text-foreground">FAQ</a>
          {event?.mapUrl && (
            <>
              {" "}
              ·{" "}
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Venue map
              </a>
            </>
          )}
        </p>
        {socialLinks.length > 0 && (
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {socialLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </p>
        )}
      </div>
    </footer>
  );
}
