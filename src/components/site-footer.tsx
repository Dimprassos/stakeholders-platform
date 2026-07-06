export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
        © {new Date().getFullYear()} Sponsorship Platform · Interested in partnering?{" "}
        <a href="/become-a-sponsor" className="underline underline-offset-4 hover:text-foreground">
          Become a sponsor
        </a>
      </div>
    </footer>
  );
}
