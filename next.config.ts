import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Sponsor logo uploads can be up to ~2MB; the default 1MB Server Action
      // body limit would reject them. Leave headroom for multipart overhead.
      bodySizeLimit: "3mb",
    },
  },
  async headers() {
    // The magic-link token lives in the URL on these routes. `no-referrer`
    // stops it leaking to third parties (the sponsor's own website, Stripe,
    // externally-hosted logos) via the Referer header (QA P0-2 / SEC-03).
    return [
      {
        source: "/invite/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/portal/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
