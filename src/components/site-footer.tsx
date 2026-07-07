import { getEventSettings } from "@/lib/event";

export async function SiteFooter() {
  const event = await getEventSettings();
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
        © {new Date().getFullYear()} {event.name} · Interested in partnering?{" "}
        <a href="/become-a-sponsor" className="underline underline-offset-4 hover:text-foreground">
          Become a sponsor
        </a>
      </div>
    </footer>
  );
}
