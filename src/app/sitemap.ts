import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public, indexable routes. Admin and magic-link pages are intentionally excluded.
const PUBLIC_PATHS = ["", "/packages", "/sponsors", "/become-a-sponsor"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));
}
