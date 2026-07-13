import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { getEventSettings } from "@/lib/event";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Root layout now reads the event (for <html lang>), so it must never be
// statically prerendered — this applies to the whole tree, guarding every
// current and future page (see the `/` build-time-prerender fix in PLAN.md).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language } = await getEventSettings();
  return (
    <html
      lang={language}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The script below stamps `data-js` on this element before React hydrates,
      // so <html> deliberately differs from the server HTML. Same pattern as any
      // pre-paint theme script; without this React reports a hydration mismatch.
      // Scoped to <html>'s own attributes — it does not cascade to the tree.
      suppressHydrationWarning
    >
      <head>
        {/* Gates the scroll-reveal animations in globals.css on JS being alive.
            Runs before first paint, so revealed content starts hidden with JS
            (no flash) and stays visible without it (no blank page). */}
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.js="1"` }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
