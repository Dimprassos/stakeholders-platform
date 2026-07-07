import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/transactional areas — keep out of the index.
      disallow: ["/admin/", "/invite/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
